/**
 * Haptic feedback hook using the Vibration API
 * Provides tactile feedback on supported mobile devices
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [30, 50, 30],
  error: [50, 30, 50, 30, 50],
};

export const useHapticFeedback = () => {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = (type: HapticType = 'light') => {
    if (!isSupported) return false;
    
    try {
      const pattern = hapticPatterns[type];
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  };

  const light = () => trigger('light');
  const medium = () => trigger('medium');
  const heavy = () => trigger('heavy');
  const success = () => trigger('success');
  const warning = () => trigger('warning');
  const error = () => trigger('error');

  return {
    isSupported,
    trigger,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
  };
};

// Standalone function for use outside React components
export const haptic = {
  isSupported: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  
  trigger: (type: HapticType = 'light') => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;
    try {
      return navigator.vibrate(hapticPatterns[type]);
    } catch {
      return false;
    }
  },
  
  light: () => haptic.trigger('light'),
  medium: () => haptic.trigger('medium'),
  heavy: () => haptic.trigger('heavy'),
  success: () => haptic.trigger('success'),
  warning: () => haptic.trigger('warning'),
  error: () => haptic.trigger('error'),
};
