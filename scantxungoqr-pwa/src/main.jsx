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
  const [isScanning, setIsScanning] = useState(true); // Nuevo estado para controlar el escáner

  const analyzeUrl = async (url) => {
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
      setIsScanning(false); // Detener el escaneo después de una lectura exitosa
      analyzeUrl(url);
    }
  };

  const handleScanAgain = () => {
    setScannedResult('');
    setAnalysisResult(null);
    setError(null);
    setIsScanning(true); // Reactivar el escaneo
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
                    onError={(e) => setError(e?.message)}
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
