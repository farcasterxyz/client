import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ButtonV2 } from 'farcaster-expo';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useRecoveryStore } from '~/contexts/RecoveryStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePopToTop } from '~/hooks/navigation/usePoptoTop';
import { UnauthedStackParamList } from '~/types';
import { normalizeEmail } from '~/utils/RecoveryTelemetry';

// Must mirror resolveUniversalStartRecovery in DeepLinkUtils.ts so that
// `token_valid` in telemetry means exactly what the deep-link resolver
// considers valid.
const RECOVERY_TOKEN_REGEX = /^[a-zA-Z0-9_-]{8,256}$/;

type RecoveryStartScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'RecoveryStart'
>;

/**
 * This screen will be opened via deep link. It will check that the link contained
 * the necessary parameters and then start the recovery process.
 */
function RecoveryStartScreenContent({ route }: RecoveryStartScreenProps) {
  const t = useTheme();
  const popToTop = usePopToTop();
  const { trackEvent } = useAnalytics();
  const { token, email } = route.params;
  const { startRecovery } = useRecoveryStore();

  useEffect(() => {
    const tokenValid = !!token && RECOVERY_TOKEN_REGEX.test(token);
    const normalizedEmail = email ? normalizeEmail(email) : undefined;
    trackEvent(AnalyticsOnlyEvent.RecoveryDeepLinkOpened, {
      token_valid: tokenValid && !!email,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
    });

    if (token && email) {
      // No navigation is necessary, when the recovery is started the recovery
      // stack will get mounted and shown to the user.
      startRecovery({ token, email });
    }
  }, [startRecovery, token, email, trackEvent]);

  if (!token || !email) {
    return (
      <View style={[t.hFull, t.p4, t.pB8]}>
        <View style={[t.flexGrow, t.justifyCenter]}>
          <Text style={[t.texts.primary, t.textLg, t.textCenter]}>
            Invalid link. Please generate a new one and try again.
          </Text>
        </View>
        <View style={[t.flexNone]}>
          <ButtonV2 onPress={popToTop} title="Go back" />
        </View>
      </View>
    );
  }

  // This screen will immediately be unmounted.
  return null;
}

export const RecoveryStartScreen = buildScreen<RecoveryStartScreenProps>(
  {
    name: 'RecoveryStart',
  },
  RecoveryStartScreenContent,
);
