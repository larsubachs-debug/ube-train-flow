import { useState, useEffect } from 'react';

interface HapticOptions {
  pattern?: number | number[];
  type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

const hapticPatterns: Record<string, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 100, 50],
  tap: 10,
  double: [10, 30, 10],
};

export function useHapticFeedback() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('vibrate' in navigator);
  }, []);

  const vibrate = (options: HapticOptions = {}) => {
    if (!isSupported) return false;

    const pattern = options.pattern || 
      (options.type ? hapticPatterns[options.type] : hapticPatterns.light);

    try {
      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  };

  // Preset haptic functions
  const tap = () => vibrate({ type: 'light' });
  const success = () => vibrate({ type: 'success' });
  const warning = () => vibrate({ type: 'warning' });
  const error = () => vibrate({ type: 'error' });
  const heavy = () => vibrate({ type: 'heavy' });

  return {
    isSupported,
    vibrate,
    tap,
    success,
    warning,
    error,
    heavy,
  };
}

// Component wrapper for haptic feedback on click
interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

export function useHapticClick(
  callback?: () => void,
  type: HapticOptions['type'] = 'light'
) {
  const { vibrate } = useHapticFeedback();

  return () => {
    vibrate({ type });
    callback?.();
  };
}
