import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
  } catch (e) {
    // Fallback to Web Vibrate
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(20); break;
        case 'heavy': navigator.vibrate(50); break;
        case 'success': navigator.vibrate([10, 30, 10]); break;
        case 'error': navigator.vibrate([50, 50, 50]); break;
      }
    }
  }
}
