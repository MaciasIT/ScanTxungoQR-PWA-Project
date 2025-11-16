export default {
  async fetch(request, env, ctx) {
    // Definir las cabeceras CORS para permitir peticiones desde nuestra PWA
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Responder a las peticiones OPTIONS (pre-flight) para CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Solo permitir peticiones POST
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { status: 405, headers: corsHeaders });
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
        return new Response(JSON.stringify({ error: 'La clave de la API de VirusTotal no está configurada en el worker' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Paso 1: Enviar la URL a VirusTotal para que la analice
      const scanResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': vtApiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(urlToScan)}`,
      });

      if (!scanResponse.ok) {
        const errorText = await scanResponse.text();
        throw new Error(`Error al enviar la URL a VirusTotal: ${errorText}`);
      }

      const scanData = await scanResponse.json();
      const analysisId = scanData.data.id;

      // Paso 2: Obtener el reporte del análisis usando el ID
      const reportResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': vtApiKey },
      });

      if (!reportResponse.ok) {
        const errorText = await reportResponse.text();
        throw new Error(`Error al obtener el reporte de VirusTotal: ${errorText}`);
      }

      const reportData = await reportResponse.json();
      const stats = reportData.data.attributes.stats;
      const maliciousCount = stats.malicious + stats.suspicious;

      const result = {
        status: maliciousCount > 0 ? 'malicious' : 'clean',
        positives: maliciousCount,
        total: stats.harmless + stats.malicious + stats.suspicious + stats.undetected,
        scannedUrl: urlToScan,
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
