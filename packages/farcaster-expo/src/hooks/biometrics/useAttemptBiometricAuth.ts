import * as LocalAuthentication from 'expo-local-authentication';
import { AnalyticsEvent } from 'farcaster-analytics';
import * as React from 'react';
import { Platform } from 'react-native';

import { useSharedTelemetry } from '../../contexts';

type BiometricAuthResult = {
  success: boolean;
  enrolledLevel?: LocalAuthentication.SecurityLevel;
};

const AMP_EVENTS: Record<LocalAuthentication.SecurityLevel, string> = {
  [LocalAuthentication.SecurityLevel.NONE]: 'no enrolled auth',
  [LocalAuthentication.SecurityLevel.SECRET]: 'non-biometric auth',
  [LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK]: 'weak biometric auth',
  [LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG]: 'strong biometric auth',
};

function useAttemptBiometricAuth(): () => Promise<BiometricAuthResult> {
  const { trackEvent } = useSharedTelemetry();
  return React.useCallback(async () => {
    if (__DEV__ || Platform.OS === 'web') {
      return { success: true };
    }

    // Special case for no enrolled auth (no PIN, biometrics, etc.)
    const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
    if (enrolledLevel === LocalAuthentication.SecurityLevel.NONE) {
      trackEvent(AnalyticsEvent.ClickCast, {
        type: AMP_EVENTS[LocalAuthentication.SecurityLevel.NONE],
      });
      return {
        success: true,
        enrolledLevel: LocalAuthentication.SecurityLevel.NONE,
      };
    }

    // Biometric or passcode auth
    const { success } = await LocalAuthentication.authenticateAsync();
    trackEvent(AnalyticsEvent.ClickCast, {
      type: AMP_EVENTS[enrolledLevel] ?? 'unknown',
    });

    return { success, enrolledLevel };
  }, [trackEvent]);
}

export { useAttemptBiometricAuth };
