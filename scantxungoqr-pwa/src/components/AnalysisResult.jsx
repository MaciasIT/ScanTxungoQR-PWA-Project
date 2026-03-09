import React from 'react';
import {
  Box, Typography, CircularProgress, Alert, Button, IconButton, Paper,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { motion } from 'framer-motion';

const AnalysisResult = ({
  isLoading,
  error,
  analysisResult,
  scannedResult,
  onClearError,
  onCopyToClipboard,
  onShare,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress size={80} thickness={2} sx={{ color: '#00e5ff' }} />
          <Box
            sx={{
              top: 0, left: 0, bottom: 0, right: 0,
              position: 'absolute', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
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
        <Alert severity="warning" sx={{ mt: 2, wordBreak: 'break-all', borderRadius: 2 }} onClose={onClearError}>
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
                onClick={() => onCopyToClipboard(scannedResult)}
                sx={{ py: 1.5 }}
              >
                Copiar (Peligro)
              </Button>
            )}

            <IconButton
              color="primary"
              onClick={onShare}
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

export default AnalysisResult;
