export default {
    async fetch(request, env, ctx) {
        // --- Security Headers (SEC-011) ---
        // Applied to ALL responses from this Worker.
        const securityHeaders = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        };

        // --- CORS (SEC-010) — Strict origin validation ---
        const ALLOWED_ORIGINS = [
            "https://scantxungoqr.pages.dev",
            "https://scantxungoqr.com",
        ];

        // Only allow localhost in development environment
        if (env.ENVIRONMENT === "development") {
            ALLOWED_ORIGINS.push("http://localhost:5173");
        }

        const requestOrigin = request.headers.get("Origin") || "";

        // Reject unauthorized origins with 403
        if (requestOrigin && !ALLOWED_ORIGINS.includes(requestOrigin)) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { ...securityHeaders, "Content-Type": "application/json" },
            });
        }

        const corsHeaders = {
            "Access-Control-Allow-Origin": requestOrigin || ALLOWED_ORIGINS[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Merge security + CORS for convenience
        const responseHeaders = { ...securityHeaders, ...corsHeaders };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: responseHeaders });
        }

        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405, headers: responseHeaders });
        }

        try {
            // --- Content-Type Validation (SEC-003) ---
            const contentType = request.headers.get("Content-Type") || "";
            if (!contentType.includes("application/json")) {
                return new Response(JSON.stringify({ error: "Unsupported Media Type" }), {
                    status: 415,
                    headers: { ...responseHeaders, "Content-Type": "application/json" },
                });
            }

            // --- Body Size Limit (SEC-009) ---
            // A URL payload should never exceed 2KB (2048 bytes)
            const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
            if (contentLength > 2048) {
                return new Response(JSON.stringify({ error: "Payload Too Large" }), {
                    status: 413,
                    headers: { ...responseHeaders, "Content-Type": "application/json" },
                });
            }

            // 2. Parse Request
            let { url } = await request.json();
            if (!url) {
                return new Response(JSON.stringify({ error: "URL is required" }), {
                    status: 400,
                    headers: { ...responseHeaders, "Content-Type": "application/json" },
                });
            }

            // --- RATE LIMITING (SEC-002) — Sliding window approach ---
            // Uses a time-bucketed key to create a sliding window.
            // NOTE: KV is eventually consistent and not atomic. This is best-effort
            // rate limiting — sufficient for abuse prevention but not a hard guarantee.
            const ip = request.headers.get("CF-Connecting-IP") || "unknown";
            const minuteSlot = Math.floor(Date.now() / 60000);
            const rateKey = `rate:${ip}:${minuteSlot}`;

            let rateCount = await env.SCANTXUNGO_CACHE.get(rateKey);
            rateCount = rateCount ? parseInt(rateCount, 10) : 0;

            if (rateCount >= 10) { // Limit: 10 requests per minute window
                return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
                    status: 429,
                    headers: {
                        ...responseHeaders,
                        "Content-Type": "application/json",
                        "Retry-After": "60",
                    },
                });
            }

            // Increment counter with 120s TTL (covers current + next window) in background
            ctx.waitUntil(
                env.SCANTXUNGO_CACHE.put(rateKey, (rateCount + 1).toString(), { expirationTtl: 120 })
                    .catch(err => console.error("KV rate limit update failed:", err))
            );
            // ---------------------

            // Normalize and validate URL
            try {
                url = new URL(url).toString();
            } catch (e) {
                return new Response(JSON.stringify({ error: "Invalid URL format" }), {
                    status: 400,
                    headers: { ...responseHeaders, "Content-Type": "application/json" },
                });
            }

            // --- API Key Check (SEC-004) — No architecture details exposed ---
            const apiKey = env.VIRUSTOTAL_API_KEY;
            if (!apiKey) {
                console.error("[ScanTxungoQR] Missing VIRUSTOTAL_API_KEY");
                return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
                    status: 503,
                    headers: { ...responseHeaders, "Content-Type": "application/json" },
                });
            }

            // 3. Generate URL ID (Base64 of SHA-256)
            const encoder = new TextEncoder();
            const data = encoder.encode(url);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
            const urlId = hashHex;

            // --- CACHE CHECK ---
            // Try to get result from KV first
            const cachedResult = await env.SCANTXUNGO_CACHE.get(urlId, { type: "json" });
            if (cachedResult) {
                return new Response(JSON.stringify({
                    ...cachedResult,
                    cached: true // Helper flag for frontend
                }), {
                    headers: { ...responseHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
                });
            }

            // 4. Check VirusTotal (GET Report)
            const vtUrl = `https://www.virustotal.com/api/v3/urls/${urlId}`;
            let vtResponse = await fetch(vtUrl, {
                method: "GET",
                headers: { "x-apikey": apiKey },
            });

            if (vtResponse.status === 404) {
                // URL not found in cache, submit for scanning
                const scanUrl = "https://www.virustotal.com/api/v3/urls";
                const formData = new FormData();
                formData.append("url", url);

                const scanResponse = await fetch(scanUrl, {
                    method: "POST",
                    headers: { "x-apikey": apiKey },
                    body: formData,
                });

                if (!scanResponse.ok) {
                    // Log error internally, don't expose to client
                    const errText = await scanResponse.text();
                    console.error("[ScanTxungoQR] VT scan submit failed:", errText);
                    throw new Error("Upstream scan service unavailable");
                }

                // Return a "pending" status
                return new Response(JSON.stringify({
                    positives: 0,
                    total: 0,
                    details: ["Scan started. Please try again in a few seconds."],
                    status: "queued"
                }), {
                    headers: { ...responseHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
                });
            }

            if (!vtResponse.ok) {
                // Log error internally, don't expose to client
                const errText = await vtResponse.text();
                console.error("[ScanTxungoQR] VT API error:", vtResponse.status, errText);
                throw new Error("Upstream analysis service unavailable");
            }

            const vtData = await vtResponse.json();
            const stats = vtData.data.attributes.last_analysis_stats;
            const results = vtData.data.attributes.last_analysis_results;

            // Extract malicious engines
            const details = [];
            if (stats.malicious > 0) {
                for (const [engine, result] of Object.entries(results)) {
                    if (result.category === "malicious") {
                        details.push(`${engine}: ${result.result}`);
                    }
                }
            }

            const finalResult = {
                positives: stats.malicious,
                total: stats.malicious + stats.harmless + stats.undetected + stats.suspicious,
                details: details,
            };

            // --- SAVE TO CACHE ---
            // Cache successful results for 24 hours (86400 seconds) in background
            ctx.waitUntil(
                env.SCANTXUNGO_CACHE.put(urlId, JSON.stringify(finalResult), { expirationTtl: 86400 })
                    .catch(err => console.error("KV cache save failed:", err))
            );

            // 5. Return Result
            return new Response(JSON.stringify(finalResult), {
                headers: { ...responseHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
            });

        } catch (error) {
            // Log internally but never expose internal details to client
            console.error("[ScanTxungoQR API Error]", error.message);
            return new Response(JSON.stringify({ error: "An internal error occurred. Please try again later." }), {
                status: 500,
                headers: { ...responseHeaders, "Content-Type": "application/json" },
            });
        }
    },
};
