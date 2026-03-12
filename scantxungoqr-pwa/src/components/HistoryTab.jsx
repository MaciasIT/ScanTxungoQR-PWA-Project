import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { motion } from 'framer-motion';

const HistoryTab = ({ history, onCopyToClipboard }) => (
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
              borderLeft: `4px solid ${item.malicious ? '#ff1744' : '#00e676'}`,
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
                transform: 'translateY(-2px)',
                boxShadow: item.malicious ? '0 4px 12px rgba(255, 23, 68, 0.15)' : '0 4px 12px rgba(0, 230, 118, 0.15)'
              }
            }}
            secondaryAction={
              <IconButton edge="end" aria-label="copy" onClick={() => onCopyToClipboard(item.url)}>
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
);

export default HistoryTab;
