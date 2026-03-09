/**
 * Triggers a short haptic vibration if the device supports it.
 */
export const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }
};
