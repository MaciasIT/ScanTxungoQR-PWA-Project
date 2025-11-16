export default {
  async fetch(request, env, ctx) {
    // Permitir CORS para peticiones desde cualquier origen
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Responder a las peticiones OPTIONS de pre-vuelo de CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Se requiere el método POST' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { url } = await request.json();
      if (!url) {
        return new Response(JSON.stringify({ error: 'Falta la URL en el cuerpo de la petición' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const apiKey = env.VIRUSTOTAL_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'La API Key de VirusTotal no está configurada en el backend' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 1. Enviar la URL a VirusTotal para análisis
      const urlId = btoa(url).replace(/=/g, '');
      const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        headers: { 'x-apikey': apiKey },
      });

      if (!analysisResponse.ok) {
        // Si la URL no se ha analizado antes, la enviamos para un nuevo análisis
        if (analysisResponse.status === 404) {
            const scanResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
                method: 'POST',
                headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `url=${encodeURIComponent(url)}`,
            });
            if (!scanResponse.ok) {
                throw new Error('Error al enviar la URL para un nuevo escaneo en VirusTotal');
            }
        }
        // Para cualquier otro error o para el caso 404, devolvemos un estado pendiente
        return new Response(JSON.stringify({ status: 'pending', message: 'El análisis está en curso. Inténtalo de nuevo en un momento.' }), {
            status: 202, // Accepted
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await analysisResponse.json();
      const attributes = data.data.attributes;
      const stats = attributes.last_analysis_stats;
      const results = attributes.last_analysis_results;

      const positives = stats.malicious + stats.suspicious;
      const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected;
      const status = positives > 0 ? 'malicious' : 'safe';

      // NUEVA LÓGICA: Extraer los detalles de los motores que dieron positivo
      const details = [];
      if (positives > 0) {
        for (const engine in results) {
          if (results[engine].category === 'malicious' || results[engine].category === 'suspicious') {
            details.push(results[engine].engine_name);
          }
        }
      }

      return new Response(JSON.stringify({ status, positives, total, details }), {
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
