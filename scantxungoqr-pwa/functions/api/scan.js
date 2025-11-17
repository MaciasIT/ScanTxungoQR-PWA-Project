export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS requests are part of the CORS preflight check.
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url: urlToScan } = await request.json();
    if (!urlToScan) {
      return new Response(JSON.stringify({ error: 'Falta la URL en el cuerpo de la petición' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vtApiKey = env.VIRUSTOTAL_API_KEY;
    if (!vtApiKey) {
      return new Response(JSON.stringify({ error: 'La clave de la API de VirusTotal no está configurada' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const urlId = btoa(urlToScan).replace(/=/g, '');

    let vtResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      method: 'GET',
      headers: { 'x-apikey': vtApiKey }
    });

    let vtData;
    if (vtResponse.status === 404) {
      const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': vtApiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${encodeURIComponent(urlToScan)}`
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Error al enviar URL a VirusTotal: ${submitResponse.status} - ${errorText}`);
      }
      return new Response(JSON.stringify({
        status: 'pending',
        message: 'URL enviada para análisis. Vuelve a consultarla en unos momentos.',
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } else if (!vtResponse.ok) {
      const errorText = await vtResponse.text();
      throw new Error(`Error al consultar VirusTotal: ${vtResponse.status} - ${errorText}`);
    } else {
      vtData = await vtResponse.json();
    }
    
    if (!vtData || !vtData.data || !vtData.data.attributes) {
        throw new Error('Respuesta inesperada de VirusTotal: faltan datos.');
    }

    const stats = vtData.data.attributes.last_analysis_stats;
    const positives = stats.malicious;
    const total = stats.harmless + stats.suspicious + stats.malicious + stats.undetected;
    const status = positives > 0 ? 'malicious' : 'safe';

    const details = [];
    const analysisResults = vtData.data.attributes.last_analysis_results;
    if (analysisResults) {
      for (const engineKey in analysisResults) {
        const engineResult = analysisResults[engineKey];
        if (engineResult.category === 'malicious' || engineResult.category === 'suspicious') {
          details.push(engineResult.engine_name);
        }
      }
    }

    return new Response(JSON.stringify({ status, positives, total, details, scannedUrl: urlToScan }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
