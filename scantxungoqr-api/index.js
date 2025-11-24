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
            const { url } = await request.json();
            if (!url) {
                return new Response(JSON.stringify({ error: "URL is required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            const apiKey = env.VIRUSTOTAL_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({ error: "Server misconfiguration: Missing API Key" }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // 3. Generate URL ID (Base64 of SHA-256)
            // VT requires the ID to be the base64 representation of the SHA-256 hash of the URL
            const encoder = new TextEncoder();
            const data = encoder.encode(url);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            // Convert to hex string first? No, VT docs say:
            // "URL identifiers are the SHA-256 hash of the URL." -> Actually, it's just the SHA256 hex.
            // Wait, let's double check. VT v3: "URL identifiers are the SHA-256 hash of the URL."
            // BUT for /urls/{id}, the ID is the SHA-256.

            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
            const urlId = hashHex;

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
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
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

            // 5. Return Result
            return new Response(JSON.stringify({
                positives: stats.malicious,
                total: stats.malicious + stats.harmless + stats.undetected + stats.suspicious, // Approximate total
                details: details,
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    },
};
