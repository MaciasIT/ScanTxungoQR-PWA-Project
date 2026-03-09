/**
 * Sends a URL to the ScanTxungoQR API for VirusTotal analysis.
 * @param {string} url - The URL to analyze.
 * @returns {Promise<Object>} The analysis result from the API.
 * @throws {Error} If the request fails or the server returns an error.
 */
export const analyzeUrl = async (url) => {
  const response = await fetch(import.meta.env.VITE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errData = await response.json();
    const errMsg = errData.error || 'Error en la respuesta del servidor';
    throw new Error(errMsg);
  }

  return response.json();
};
