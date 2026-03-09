import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Box,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const InfoDialog = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
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
        <strong>ScanTxungoQR</strong> es tu herramienta de defensa contra el phishing y el malware en códigos QR (Quishing).
      </Typography>

      <Typography variant="subtitle2" sx={{ color: '#f50057', mt: 2, fontWeight: 'bold' }}>
        🛡️ ¿Cómo funciona?
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Analizamos cada URL utilizando la API de <strong>VirusTotal</strong>, consultando más de 70 motores de antivirus mundiales para decirte si un enlace es seguro antes de que entres.
      </Typography>

      <Typography variant="subtitle2" sx={{ color: '#00e676', mt: 2, fontWeight: 'bold' }}>
        🔐 Privacidad
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Tu historial de escaneos se guarda <strong>solo en tu dispositivo</strong> (Local Storage). No guardamos logs de actividad personal en nuestros servidores, aunque las URLs anónimas son procesadas por Cloudflare para el análisis.
      </Typography>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
        <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Desarrollado con ❤️ y Paranoia Security <br /> v2.0.0 (Cyber Edition)
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
        Entendido
      </Button>
    </DialogActions>
  </Dialog>
);

export default InfoDialog;
