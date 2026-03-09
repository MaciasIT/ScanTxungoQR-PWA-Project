import React from 'react';
import { Box, Typography, TextField, Button, Divider } from '@mui/material';
import AnalysisResult from './AnalysisResult';

const ManualTab = ({
  manualUrl,
  onManualUrlChange,
  isLoading,
  scannedResult,
  error,
  analysisResult,
  onSubmit,
  onClearError,
  onCopyToClipboard,
  onShare,
}) => (
  <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
    <Typography variant="body1" gutterBottom color="text.secondary">
      Escribe o pega una URL para analizarla:
    </Typography>
    <TextField
      fullWidth
      variant="outlined"
      placeholder="https://ejemplo.com"
      value={manualUrl}
      onChange={(e) => onManualUrlChange(e.target.value)}
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

    {scannedResult && (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
        <AnalysisResult
          isLoading={isLoading}
          error={error}
          analysisResult={analysisResult}
          scannedResult={scannedResult}
          onClearError={onClearError}
          onCopyToClipboard={onCopyToClipboard}
          onShare={onShare}
        />
      </Box>
    )}
  </Box>
);

export default ManualTab;
