import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { motion } from 'framer-motion';

const Header = ({ onInfoOpen }) => (
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
    <IconButton onClick={onInfoOpen} sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)' }}>
      <InfoOutlinedIcon />
    </IconButton>
  </Box>
);

export default Header;
