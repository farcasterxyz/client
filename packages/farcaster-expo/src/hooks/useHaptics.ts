// eslint-disable-next-line no-restricted-imports
import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
} from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

function useHaptics() {
  const triggerImpactAsync = useCallback(() => {
    if (Platform.OS === 'web') {
      return;
    }
    impactAsync(ImpactFeedbackStyle.Light);
  }, []);

  const triggerMediumImpactAsync = useCallback(() => {
    if (Platform.OS === 'web') {
      return;
    }
    impactAsync(ImpactFeedbackStyle.Medium);
  }, []);

  const triggerSuccessNotificationAsync = useCallback(() => {
    if (Platform.OS === 'web') {
      return;
    }
    notificationAsync(NotificationFeedbackType.Success);
  }, []);

  const triggerHeavyImpactAsync = useCallback(() => {
    if (Platform.OS === 'web') {
      return;
    }
    impactAsync(ImpactFeedbackStyle.Heavy);
  }, []);

  const triggerLightImpactAsync = useCallback(() => {
    if (Platform.OS === 'web') {
      return;
    }
    impactAsync(ImpactFeedbackStyle.Light);
  }, []);

  return {
    triggerImpactAsync,
    triggerMediumImpactAsync,
    triggerSuccessNotificationAsync,
    triggerHeavyImpactAsync,
    triggerLightImpactAsync,
  };
}

export { useHaptics };
