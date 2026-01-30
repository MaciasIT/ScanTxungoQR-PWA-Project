export default {
    async fetch(request, env, ctx) {
        // 1. Handle CORS
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*", // Allow all origins for now (or restrict to your Pages URL)
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
        }

        try {
            // 2. Parse Request
            let { url } = await request.json();
            if (!url) {
                return new Response(JSON.stringify({ error: "URL is required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // --- RATE LIMITING ---
            const ip = request.headers.get("CF-Connecting-IP") || "unknown";
            const rateKey = `rate:${ip}`;

            // Increment the count for this IP. 
            // Since KV doesn't have atomic increment, we get, increment, and put.
            // This is "soft" rate limiting (race conditions possible), but sufficient for abuse prevention.
            let rateCount = await env.SCANTXUNGO_CACHE.get(rateKey);
            rateCount = rateCount ? parseInt(rateCount) : 0;

            if (rateCount >= 10) { // Limit: 10 requests per minute
                return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), {
                    status: 429,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Update stats (expiration 60s)
            await env.SCANTXUNGO_CACHE.put(rateKey, (rateCount + 1).toString(), { expirationTtl: 60 });
            // ---------------------

            // Normalize URL (e.g. add trailing slash) to match VT keys
            try {
                url = new URL(url).toString();
            } catch (e) {
                // If invalid URL, proceed as is and let it fail later or be rejected
            }

            const apiKey = env.VIRUSTOTAL_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({ error: "Server misconfiguration: Missing API Key" }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
                    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
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
                    const errText = await scanResponse.text();
                    throw new Error(`Failed to submit URL for scanning: ${errText}`);
                }

                // Return a "pending" status
                return new Response(JSON.stringify({
                    positives: 0,
                    total: 0,
                    details: ["Scan started. Please try again in a few seconds."],
                    status: "queued"
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
                });
            }

            if (!vtResponse.ok) {
                const errText = await vtResponse.text();
                throw new Error(`VirusTotal API Error: ${vtResponse.status} ${errText}`);
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
            // Cache successful results for 24 hours (86400 seconds)
            await env.SCANTXUNGO_CACHE.put(urlId, JSON.stringify(finalResult), { expirationTtl: 86400 });

            // 5. Return Result
            return new Response(JSON.stringify(finalResult), {
                headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    },
};
