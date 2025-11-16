import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Scanner } from '@yudiel/react-qr-scanner';

const App = () => {
  const [scannedResult, setScannedResult] = useState('No se ha escaneado nada aún.');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeUrl = async (url) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('https://scantxungoqr-api.michelmacias-it.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(`Error al analizar la URL: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const url = detectedCodes[0].rawValue;
      setScannedResult(url);
      analyzeUrl(url);
    }
  };

  const renderAnalysis = () => {
    if (isLoading) {
      return <p>Analizando...</p>;
    }
    if (error) {
      return <p style={{ color: 'orange' }}>{error}</p>;
    }
    if (!analysisResult) {
      return null;
    }

    const isMalicious = analysisResult.status === 'malicious';
    const resultColor = isMalicious ? 'red' : 'green';

    return (
      <div style={{ border: `2px solid ${resultColor}`, padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
        <h3 style={{ color: resultColor, margin: 0 }}>
          {isMalicious ? '¡Peligro! URL Maliciosa' : 'URL Segura'}
        </h3>
        <p>Detectado por {analysisResult.positives} de {analysisResult.total} motores de seguridad.</p>
      </div>
    );
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', padding: '1em' }}>
      <h1>Escáner QR PWA</h1>
      <p>Apunta la cámara a un código QR para escanearlo.</p>
      <div style={{ maxWidth: '500px', margin: '20px auto', border: '2px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <Scanner
          onScan={handleScan}
          onError={(e) => setError(e?.message)}
          components={{ audio: false }}
          constraints={{ facingMode: 'environment' }}
        />
      </div>
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '8px' }}>
        <p><strong>URL Escaneada:</strong></p>
        <p style={{ wordBreak: 'break-all' }}>{scannedResult}</p>
        {renderAnalysis()}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
