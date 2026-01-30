import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Scanner } from '@yudiel/react-qr-scanner';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThemeProvider, createTheme, CssBaseline, Container, Card, CardContent, Typography, Box,
  CircularProgress, Alert, Button, Accordion, AccordionSummary, AccordionDetails, List,
  ListItem, ListItemText, Tabs, Tab, TextField, IconButton, Snackbar, Divider, Paper, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReplayIcon from '@mui/icons-material/Replay';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Importar fuentes
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { useRegisterSW } from 'virtual:pwa-register/react';

// --- THEME DEFINITION: CYBER / GLASS ---
const cyberTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff', // Cyber Blue
    },
    secondary: {
      main: '#f50057', // Cyber Pink
    },
    background: {
      default: '#0a0a12', // Deep Dark
      paper: 'rgba(30, 30, 40, 0.7)', // Semi-transparent for Glassmorphism
    },
    success: {
      main: '#00e676',
    },
    error: {
      main: '#ff1744',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '1px',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(circle at 50% 10%, #1a1a2e 0%, #000000 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px)',
          background: 'rgba(25, 25, 35, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1rem',
        },
      },
    },
  },
});

const App = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [scannedResult, setScannedResult] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [manualUrl, setManualUrl] = useState('');
  const [history, setHistory] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const fileInputRef = useRef(null);
  const isMobile = useMediaQuery(cyberTheme.breakpoints.down('sm'));

  // PWA Update Logic
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setSnackbarMsg("Nueva versión disponible. Haz click para actualizar.");
      setSnackbarOpen(true);
    }
  }, [needRefresh]);

  const handleSnackbarAction = () => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
    setSnackbarOpen(false);
  };

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('scanHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(200); // 200ms vibration
    }
  };

  const addToHistory = (url, result) => {
    const newEntry = {
      url,
      timestamp: new Date().toISOString(),
      malicious: result.positives > 0,
      positives: result.positives,
      total: result.total
    };

    const updatedHistory = [newEntry, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
  };

  const analyzeUrl = async (url) => {
    if (!url) return;

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
      setAnalysisResult(data);
      addToHistory(url, data);

    } catch (err) {
      const errMsg = `Error al analizar la URL: ${err.message}`;
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      const rawValue = detectedCodes[0].rawValue;
      if (isScanning) {
        processUrl(rawValue);
      }
    }
  };

  const processUrl = (url) => {
    if (!isValidUrl(url)) {
      setError("El texto no parece ser una URL web válida (http/https).");
      setIsScanning(false);
      return;
    }

    triggerHaptic(); // Vibrate on valid scan
    setScannedResult(url);
    setIsScanning(false);
    analyzeUrl(url);
  };

  const handleScanError = (err) => {
    // console.error(err);
  };

  const handleScanAgain = () => {
    setScannedResult('');
    setAnalysisResult(null);
    setError(null);
    setIsScanning(true);
    setManualUrl('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          processUrl(code.data);
        } else {
          setError("No se detectó ningún código QR en la imagen.");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processUrl(manualUrl);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbarMsg("URL copiada al portapapeles");
    setSnackbarOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share && analysisResult) {
      const isMalicious = analysisResult.positives > 0;
      const statusText = isMalicious ? "PELIGROSA 🔴" : "SEGURA 🟢";
      try {
        await navigator.share({
          title: 'Resultado de ScanTxungoQR',
          text: `He analizado esta URL y es ${statusText}: ${scannedResult}`,
          url: scannedResult,
        });
      } catch (err) {
        console.log('Error compartiendo', err);
      }
    } else {
      copyToClipboard(scannedResult);
    }
  };

  const renderAnalysis = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress size={80} thickness={2} sx={{ color: '#00e5ff' }} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCodeScannerIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 30 }} />
            </Box>
          </Box>
          <Typography sx={{ mt: 3, letterSpacing: 1 }} variant="body1">ANALIZANDO AMENAZAS...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity="warning" sx={{ mt: 2, wordBreak: 'break-all', borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </motion.div>
      );
    }

    if (!analysisResult) return null;

    const positives = analysisResult.positives || 0;
    const total = analysisResult.total || 0;
    const isMalicious = positives > 0;
    const isCached = analysisResult.cached || false;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <Box sx={{ mt: 3, textAlign: 'left' }}>
          <Paper
            elevation={10}
            sx={{
              p: 3,
              background: isMalicious
                ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.2) 0%, rgba(255, 23, 68, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(56, 142, 60, 0.2) 0%, rgba(0, 230, 118, 0.1) 100%)',
              border: `1px solid ${isMalicious ? '#ef5350' : '#00e676'}`,
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              boxShadow: isMalicious ? '0 0 20px rgba(255, 23, 68, 0.3)' : '0 0 20px rgba(0, 230, 118, 0.3)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" fontWeight="900"
                sx={{
                  color: isMalicious ? '#ff1744' : '#00e676',
                  textShadow: isMalicious ? '0 0 10px rgba(255, 23, 68, 0.5)' : '0 0 10px rgba(0, 230, 118, 0.5)'
                }}
              >
                {isMalicious ? 'AMENAZA DETECTADA' : 'URL SEGURA'}
              </Typography>
              {isCached && (
                <Typography variant="caption" sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  px: 1, py: 0.5, borderRadius: 1
                }}>
                  CACHÉ
                </Typography>
              )}
            </Box>

            <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
              Detectado por <b>{positives}</b> de <b>{total}</b> motores de seguridad.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isMalicious ? (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  component="a"
                  href={scannedResult}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ py: 1.5, fontSize: '1rem', boxShadow: '0 4px 14px 0 rgba(0, 230, 118, 0.39)' }}
                >
                  Abrir Enlace
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<ContentCopyIcon />}
                  onClick={() => copyToClipboard(scannedResult)}
                  sx={{ py: 1.5 }}
                >
                  Copiar (Peligro)
                </Button>
              )}

              <IconButton
                color="primary"
                onClick={handleShare}
                sx={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2 }}
              >
                <ShareIcon />
              </IconButton>
            </Box>

          </Paper>

          {isMalicious && analysisResult.details && analysisResult.details.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Accordion sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">Ver detalles de la amenaza</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List dense>
                    {analysisResult.details.map((engine, index) => (
                      <ListItem key={index} divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <ListItemText primary={engine} primaryTypographyProps={{ color: 'error.light' }} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          )}
        </Box>
      </motion.div>
    );
  };

  return (
    <ThemeProvider theme={cyberTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 2 } }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card sx={{ minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: isMobile ? 2 : 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                    <QrCodeScannerIcon sx={{ fontSize: 36, mr: 1, color: '#00e5ff', filter: 'drop-shadow(0 0 5px #00e5ff)' }} />
                  </motion.div>
                  <Typography variant="h5" component="h1" sx={{
                    background: 'linear-gradient(45deg, #00e5ff 30%, #f50057 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800
                  }}>
                    ScanTxungoQR
                  </Typography>
                </Box>
                <IconButton onClick={() => setInfoOpen(true)} sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)' }}>
                  <InfoOutlinedIcon />
                </IconButton>
              </Box>

              {/* Navigation Tabs */}
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                sx={{ mb: 3, borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <Tab icon={<QrCodeScannerIcon />} label="Escanear" />
                <Tab icon={<KeyboardIcon />} label="Manual" />
                <Tab icon={<HistoryIcon />} label="Historial" />
              </Tabs>

              {/* TABS CONTENT WITH ANIMATION */}
              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '100%' }}
                  >
                    {!scannedResult && isScanning ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: '2px solid rgba(0, 229, 255, 0.3)',
                          position: 'relative',
                          aspectRatio: '1/1',
                          mb: 3,
                          boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)'
                        }}>
                          {/* LASER SCANNER ANIMATION */}
                          <motion.div
                            style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0,
                              height: '4px',
                              background: 'linear-gradient(90deg, transparent, #f50057, transparent)',
                              boxShadow: '0 0 10px #f50057',
                              zIndex: 10
                            }}
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />

                          <Scanner
                            onScan={handleScan}
                            onError={handleScanError}
                            components={{ audio: false, finder: false }} // Custom finder
                            constraints={{ facingMode: 'environment' }}
                            formats={['qr_code']}
                          />
                        </Box>

                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                        />
                        <Button
                          variant="outlined"
                          startIcon={<UploadFileIcon />}
                          onClick={() => fileInputRef.current.click()}
                          fullWidth
                          sx={{ mb: 2 }}
                        >
                          Subir Imagen QR
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        {scannedResult && (
                          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, borderLeft: '4px solid #00e5ff' }}>
                            <Typography variant="caption" color="text.secondary" display="block">URL Detectada:</Typography>
                            <Typography variant="body1" sx={{ wordBreak: 'break-all', fontWeight: '500', color: 'white' }}>
                              {scannedResult}
                            </Typography>
                          </Box>
                        )}

                        {renderAnalysis()}

                        {(!isLoading) && (
                          <Button
                            variant="contained"
                            onClick={handleScanAgain}
                            startIcon={<ReplayIcon />}
                            fullWidth
                            sx={{ mt: 4, py: 1.5, bgcolor: '#333' }}
                          >
                            Nuevo Escáner
                          </Button>
                        )}
                      </Box>
                    )}
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '100%' }}
                  >
                    <Box component="form" onSubmit={handleManualSubmit} sx={{ mt: 2 }}>
                      <Typography variant="body1" gutterBottom color="text.secondary">
                        Escribe o pega una URL para analizarla:
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="https://ejemplo.com"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        sx={{ mb: 3, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        autoFocus
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={!manualUrl || isLoading}
                        sx={{ py: 1.5, background: 'linear-gradient(45deg, #00e5ff 30%, #2979ff 90%)' }}
                      >
                        {isLoading ? 'Analizando...' : 'Analizar URL'}
                      </Button>

                      {scannedResult && activeTab === 1 && (
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                          {renderAnalysis()}
                        </Box>
                      )}
                    </Box>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '100%' }}
                  >
                    <List sx={{ width: '100%', bgcolor: 'transparent', borderRadius: 2 }}>
                      {history.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center', opacity: 0.5 }}>
                          <HistoryIcon sx={{ fontSize: 60, mb: 2 }} />
                          <Typography>No hay escaneos recientes</Typography>
                        </Box>
                      ) : (
                        history.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <ListItem
                              alignItems="flex-start"
                              sx={{
                                mb: 1,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                borderLeft: `4px solid ${item.malicious ? '#ff1744' : '#00e676'}`
                              }}
                              secondaryAction={
                                <IconButton edge="end" aria-label="copy" onClick={() => copyToClipboard(item.url)}>
                                  <ContentCopyIcon fontSize="small" sx={{ opacity: 0.5 }} />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Typography
                                    sx={{ color: item.malicious ? '#ff1744' : '#00e676', fontWeight: 'bold' }}
                                    component="span"
                                    variant="body2"
                                  >
                                    {item.malicious ? 'PELIGROSO' : 'SEGURO'}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2" color="white" sx={{ display: 'block', wordBreak: 'break-all', my: 0.5, opacity: 0.8 }}>
                                      {item.url}
                                    </Typography>
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      {new Date(item.timestamp).toLocaleString()}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          </motion.div>
                        ))
                      )}
                    </List>
                  </motion.div>
                )}
              </AnimatePresence>

            </CardContent>
          </Card>
        </motion.div>
      </Container>

      {/* Info Dialog */}
      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(25, 25, 35, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: 3,
            minWidth: '300px'
          }
        }}
      >
        <DialogTitle sx={{ color: '#00e5ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoOutlinedIcon /> Sobre la App
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph sx={{ color: 'white' }}>
            **ScanTxungoQR** es tu herramienta de defensa contra el phishing y el malware en códigos QR (Quishing).
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#f50057', mt: 2, fontWeight: 'bold' }}>
            🛡️ ¿Cómo funciona?
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Analizamos cada URL utilizando la API de **VirusTotal**, consultando más de 70 motores de antivirus mundiales para decirte si un enlace es seguro antes de que entres.
          </Typography>

          <Typography variant="subtitle2" sx={{ color: '#00e676', mt: 2, fontWeight: 'bold' }}>
            🔐 Privacidad
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Tu historial de escaneos se guarda **solo en tu dispositivo** (Local Storage). No guardamos logs de actividad personal en nuestros servidores, aunque las URLs anónimas son procesadas por Cloudflare para el análisis.
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
            <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              Desarrollado con ❤️ y Paranoia Security <br /> v2.0.0 (Cyber Edition)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInfoOpen(false)} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={needRefresh ? null : 4000} // Don't auto hide if it's an update prompt
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        action={
          needRefresh && (
            <Button color="secondary" size="small" onClick={handleSnackbarAction}>
              ACTUALIZAR
            </Button>
          )
        }
      />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
