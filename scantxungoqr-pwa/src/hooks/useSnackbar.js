import { useState } from 'react';

/**
 * Custom hook for managing snackbar state and messages.
 */
const useSnackbar = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const showSnackbar = (msg) => {
    setSnackbarMsg(msg);
    setSnackbarOpen(true);
  };

  const closeSnackbar = () => {
    setSnackbarOpen(false);
  };

  return { snackbarOpen, snackbarMsg, showSnackbar, closeSnackbar };
};

export default useSnackbar;
