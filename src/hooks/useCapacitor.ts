import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export function useCapacitor() {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    setPlatform(Capacitor.getPlatform());

    if (native) {
      initializeNativeFeatures();
    }
  }, []);

  const initializeNativeFeatures = async () => {
    try {
      // Hide splash screen after app loads
      await SplashScreen.hide();

      // Configure status bar for iOS
      if (Capacitor.getPlatform() === 'ios') {
        await StatusBar.setStyle({ style: Style.Light });
      }

      // Setup keyboard listeners
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.setProperty('--keyboard-height', '0px');
      });
    } catch (error) {
      console.log('Native feature initialization error:', error);
    }
  };

  // Haptic feedback functions
  const hapticImpact = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isNative) return;
    
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };

    try {
      await Haptics.impact({ style: styleMap[style] });
    } catch (error) {
      console.log('Haptic impact error:', error);
    }
  };

  const hapticNotification = async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isNative) return;

    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };

    try {
      await Haptics.notification({ type: typeMap[type] });
    } catch (error) {
      console.log('Haptic notification error:', error);
    }
  };

  const hapticVibrate = async (duration: number = 300) => {
    if (!isNative) return;

    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.log('Haptic vibrate error:', error);
    }
  };

  return {
    isNative,
    platform,
    hapticImpact,
    hapticNotification,
    hapticVibrate,
  };
}
