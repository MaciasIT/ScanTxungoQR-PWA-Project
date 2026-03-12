import React, { useRef, Suspense } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { motion } from 'framer-motion';
import AnalysisResult from './AnalysisResult';

// Lazy loading the heavy QR scanner component
const Scanner = React.lazy(() => import('@yudiel/react-qr-scanner').then(module => ({ default: module.Scanner })));
const ScanTab = ({
  scannedResult,
  isScanning,
  isLoading,
  error,
  analysisResult,
  onScan,
  onScanError,
  onScanAgain,
  onProcessUrl,
  onSetError,
  onClearError,
  onCopyToClipboard,
  onShare,
}) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, img.width, img.height);

        try {
          // Dinamically import jsQR only when an image is uploaded
          const jsQRModule = await import('jsqr');
          const jsQR = jsQRModule.default;
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            onProcessUrl(code.data);
          } else {
            onSetError("No se detectó ningún código QR en la imagen.");
          }
        } catch (err) {
          console.error("Failed to load jsQR dynamically", err);
          onSetError("Ocurrió un error al procesar la imagen.");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (!scannedResult && isScanning) {
    return (
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

          <Suspense fallback={<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: '#00e5ff' }} /></Box>}>
            <Scanner
              onScan={onScan}
              onError={onScanError}
              components={{ audio: false, finder: false }}
              constraints={{ facingMode: 'environment' }}
              formats={['qr_code']}
            />
          </Suspense>
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
    );
  }

  return (
    <Box>
      {scannedResult && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, borderLeft: '4px solid #00e5ff' }}>
          <Typography variant="caption" color="text.secondary" display="block">URL Detectada:</Typography>
          <Typography variant="body1" sx={{ wordBreak: 'break-all', fontWeight: '500', color: 'white' }}>
            {scannedResult}
          </Typography>
        </Box>
      )}

      <AnalysisResult
        isLoading={isLoading}
        error={error}
        analysisResult={analysisResult}
        scannedResult={scannedResult}
        onClearError={onClearError}
        onCopyToClipboard={onCopyToClipboard}
        onShare={onShare}
      />

      {!isLoading && (
        <Button
          variant="contained"
          onClick={onScanAgain}
          startIcon={<ReplayIcon />}
          fullWidth
          sx={{ mt: 4, py: 1.5, bgcolor: '#333' }}
        >
          Nuevo Escáner
        </Button>
      )}
    </Box>
  );
};

export default ScanTab;
