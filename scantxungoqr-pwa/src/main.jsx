import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ThemeProvider, createTheme, CssBaseline, Container, Card, CardContent, Typography, Box, CircularProgress, Alert, Button, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReplayIcon from '@mui/icons-material/Replay';

// Importar la fuente Roboto
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// Crear un tema oscuro personalizado
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const App = () => {
  const [scannedResult, setScannedResult] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [debugLogs, setDebugLogs] = useState([]); // Array of log strings

  // Helper to add logs with timestamp
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  React.useEffect(() => {
    addLog('App mounted. Initializing...');
  }, []);

  const analyzeUrl = async (url) => {
    addLog(`Starting analysis for URL: ${url}`);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const response = await fetch('https://scantxungoqr-api.michelmacias-it.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        const errMsg = errData.error || 'Error en la respuesta del servidor';
        throw new Error(errMsg);
      }
      
      const data = await response.json();
      addLog(`Analysis success: ${JSON.stringify(data)}`);
      setAnalysisResult(data);
    } catch (err) {
      const errMsg = `Error al analizar la URL: ${err.message}`;
      addLog(errMsg);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      const url = detectedCodes[0].rawValue;
      // Only log if it's a new scan or we are currently scanning
      if (isScanning) {
         addLog(`QR Detected: ${url}`);
         setScannedResult(url);
         setIsScanning(false); // Stop scanning
         analyzeUrl(url);
      }
    } else {
       // Log but don't stop scanning if it's just a frame with no QR
       // Note: The scanner might fire this often, so maybe only log errors
       if (detectedCodes?.length > 0) {
           addLog(`Scan event with no valid URL: ${JSON.stringify(detectedCodes)}`);
       }
    }
  };

  const handleScanError = (err) => {
      // Limit error logging to avoid flooding if it's the same error repeatedly?
      // For now, log everything to be safe.
      addLog(`Scanner Error: ${err?.message || err}`);
      // Don't set main error state for minor scanner glitches unless critical
  };

  const handleScanAgain = () => {
    addLog('User requested: Scan Again');
    setScannedResult('');
    setAnalysisResult(null);
    setError(null);
    setIsScanning(true);
  };

  const renderAnalysis = () => {
    if (isLoading) {
      return <CircularProgress sx={{ mt: 2 }} />;
    }
    if (error) {
      return <Alert severity="warning" sx={{ mt: 2, wordBreak: 'break-all' }}>{error}</Alert>;
    }
    if (!analysisResult) {
      return null;
    }

    const isMalicious = analysisResult.positives > 0;
    return (
      <Box sx={{ mt: 2, textAlign: 'left' }}>
        <Alert
          severity={isMalicious ? 'error' : 'success'}
          action={!isMalicious && (
            <Button
              color="inherit"
              size="small"
              href={scannedResult}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visitar
            </Button>
          )}
        >
          <Typography variant="body1" component="div"><b>{isMalicious ? '¡Peligro! URL Maliciosa' : 'URL Segura'}</b></Typography>
          <small>Detectado por {analysisResult.positives} de {analysisResult.total} motores.</small>
        </Alert>

        {isMalicious && analysisResult.details && analysisResult.details.length > 0 && (
          <Accordion sx={{ mt: 1, bgcolor: 'background.paper' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">Ver detalles de la amenaza</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense>
                {analysisResult.details.map((engine, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={engine} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Card sx={{ borderRadius: 3, boxShadow: 5 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <QrCodeScannerIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                ScanTxungoQR
              </Typography>
            </Box>
            
            {isScanning ? (
              <>
                <Typography variant="body1" color="text.secondary">
                  Apunta la cámara a un código QR para analizar su seguridad.
                </Typography>
                <Box sx={{ maxWidth: '400px', margin: '20px auto', borderRadius: 2, overflow: 'hidden' }}>
                  <Scanner
                    onScan={handleScan}
                    onError={handleScanError}
                    components={{ audio: false, finder: true }}
                    constraints={{ facingMode: 'environment' }}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ mt: 4, mb: 2 }}>
                <Button variant="contained" onClick={handleScanAgain} startIcon={<ReplayIcon />}>
                  Escanear de nuevo
                </Button>
              </Box>
            )}

            {scannedResult && (
              <Box sx={{ mt: 2, p: 2, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">URL Escaneada:</Typography>
                <Typography sx={{ wordBreak: 'break-all' }}>{scannedResult}</Typography>
              </Box>
            )}
            {renderAnalysis()}

            {/* Debug Log Section */}
            <Box sx={{ mt: 4, p: 2, background: '#000', borderRadius: 2, textAlign: 'left', maxHeight: '200px', overflowY: 'auto', border: '1px solid #333' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                 <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>DEBUG LOGS</Typography>
                 <Button size="small" onClick={() => setDebugLogs([])} sx={{ fontSize: '0.6rem', minWidth: 'auto' }}>Clear</Button>
              </Box>
              {debugLogs.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>No logs yet...</Typography>
              ) : (
                debugLogs.map((log, index) => (
                  <Typography key={index} variant="caption" display="block" sx={{ fontFamily: 'monospace', color: '#0f0', mb: 0.5 }}>
                    {log}
                  </Typography>
                ))
              )}
            </Box>

          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
