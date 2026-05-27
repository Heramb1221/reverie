import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  // Guard clause checking to safely ignore physical haptic patterns on browser engines
  const isWeb = Platform.OS === 'web';

  const light = () => {
    if (isWeb) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.warn('Haptics not supported:', e);
    }
  };

  const medium = () => {
    if (isWeb) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn('Haptics not supported:', e);
    }
  };

  const success = () => {
    if (isWeb) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('Haptics not supported:', e);
    }
  };

  const error = () => {
    if (isWeb) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      console.warn('Haptics not supported:', e);
    }
  };

  const select = () => {
    if (isWeb) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {
      console.warn('Haptics not supported:', e);
    }
  };

  return {
    light,
    medium,
    success,
    error,
    select,
  };
}