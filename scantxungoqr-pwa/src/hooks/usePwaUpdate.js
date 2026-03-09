import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Custom hook wrapping PWA service worker update logic.
 * @param {Function} showSnackbar - Function to display a snackbar message.
 * @returns {{ needRefresh: boolean, handleUpdate: Function }}
 */
const usePwaUpdate = (showSnackbar) => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {},
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      showSnackbar('Nueva versión disponible. Haz click para actualizar.');
    }
  }, [needRefresh, showSnackbar]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return { needRefresh, handleUpdate };
};

export default usePwaUpdate;
