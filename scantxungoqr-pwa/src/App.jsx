import React, { useState, useCallback } from 'react';
import {
  ThemeProvider, CssBaseline, Container, Card, CardContent,
  Tabs, Tab, Snackbar, Button, useMediaQuery,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HistoryIcon from '@mui/icons-material/History';

// Importar fuentes
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import cyberTheme from './theme';
import { analyzeUrl } from './services/api';
import { isValidUrl } from './utils/urlValidator';
import { triggerHaptic } from './utils/haptics';
import useHistory from './hooks/useHistory';
import useSnackbar from './hooks/useSnackbar';
import usePwaUpdate from './hooks/usePwaUpdate';

import Header from './components/Header';
import ScanTab from './components/ScanTab';
import ManualTab from './components/ManualTab';
import HistoryTab from './components/HistoryTab';
import InfoDialog from './components/InfoDialog';

const App = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [scannedResult, setScannedResult] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [manualUrl, setManualUrl] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);

  const isMobile = useMediaQuery(cyberTheme.breakpoints.down('sm'));
  const { history, addToHistory } = useHistory();
  const { snackbarOpen, snackbarMsg, showSnackbar, closeSnackbar } = useSnackbar();
  const { needRefresh, handleUpdate } = usePwaUpdate(showSnackbar);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('URL copiada al portapapeles');
  }, [showSnackbar]);

  const handleAnalyze = useCallback(async (url) => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const data = await analyzeUrl(url);
      setAnalysisResult(data);
      addToHistory(url, data);
    } catch (err) {
      setError(`Error al analizar la URL: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [addToHistory]);

  const processUrl = useCallback((url) => {
    if (!isValidUrl(url)) {
      setError("El texto no parece ser una URL web válida (http/https).");
      setIsScanning(false);
      return;
    }
    triggerHaptic();
    setScannedResult(url);
    setIsScanning(false);
    handleAnalyze(url);
  }, [handleAnalyze]);

  const handleScan = useCallback((detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      const rawValue = detectedCodes[0].rawValue;
      if (isScanning) {
        processUrl(rawValue);
      }
    }
  }, [isScanning, processUrl]);

  const handleScanError = useCallback(() => {}, []);

  const handleScanAgain = useCallback(() => {
    setScannedResult('');
    setAnalysisResult(null);
    setError(null);
    setIsScanning(true);
    setManualUrl('');
  }, []);

  const handleManualSubmit = useCallback((e) => {
    e.preventDefault();
    processUrl(manualUrl);
  }, [manualUrl, processUrl]);

  const handleShare = useCallback(async () => {
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
  }, [analysisResult, scannedResult, copyToClipboard]);

  const handleSnackbarAction = useCallback(() => {
    if (needRefresh) {
      handleUpdate();
    }
    closeSnackbar();
  }, [needRefresh, handleUpdate, closeSnackbar]);

  return (
    <ThemeProvider theme={cyberTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 2 } }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card sx={{ minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: isMobile ? 2 : 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

              <Header onInfoOpen={() => setInfoOpen(true)} />

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

              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div key="scan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                    <ScanTab
                      scannedResult={scannedResult}
                      isScanning={isScanning}
                      isLoading={isLoading}
                      error={error}
                      analysisResult={analysisResult}
                      onScan={handleScan}
                      onScanError={handleScanError}
                      onScanAgain={handleScanAgain}
                      onProcessUrl={processUrl}
                      onSetError={setError}
                      onClearError={() => setError(null)}
                      onCopyToClipboard={copyToClipboard}
                      onShare={handleShare}
                    />
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div key="manual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                    <ManualTab
                      manualUrl={manualUrl}
                      onManualUrlChange={setManualUrl}
                      isLoading={isLoading}
                      scannedResult={scannedResult}
                      error={error}
                      analysisResult={analysisResult}
                      onSubmit={handleManualSubmit}
                      onClearError={() => setError(null)}
                      onCopyToClipboard={copyToClipboard}
                      onShare={handleShare}
                    />
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                    <HistoryTab history={history} onCopyToClipboard={copyToClipboard} />
                  </motion.div>
                )}
              </AnimatePresence>

            </CardContent>
          </Card>
        </motion.div>
      </Container>

      <InfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={needRefresh ? null : 4000}
        onClose={closeSnackbar}
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

export default App;
