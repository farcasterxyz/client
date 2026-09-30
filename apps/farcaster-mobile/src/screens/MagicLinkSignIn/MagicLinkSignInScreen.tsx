import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useOnboardingScreen } from '~/hooks/useOnboardingScreen';
import { UnauthedStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type MagicLinkSignInScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'MagicLinkSignIn'
>;

const MagicLinkSignInScreen = buildScreen<MagicLinkSignInScreenProps>(
  { name: 'MagicLinkSignIn' },
  ({ route, navigation }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const { apiClient } = useFarcasterApiClient();
    const { setAuthToken } = useAuthToken();

    useOnboardingScreen({ title: 'Signing in…', noBackWarning: false });

    const [error, setError] = useState<string>();
    const lastAttemptedKeyRef = useRef<string | null>(null);

    useEffect(() => {
      const { token, address } = route.params;
      const attemptKey = `${token}:${address}`;
      if (lastAttemptedKeyRef.current === attemptKey) return;
      lastAttemptedKeyRef.current = attemptKey;
      setError(undefined);

      apiClient
        .completeMagicLink({ token, address })
        .then(async (response) => {
          const apiToken = response.data.result.token;
          await setAuthToken({ authToken: apiToken, persist: true });
          trackEvent(AnalyticsEvent.AuthCompletedSignInWithMagicLink, {});
          // AuthTokenProvider observes the new token and switches to the authed
          // stack automatically — no manual navigation needed.
        })
        .catch((e) => {
          lastAttemptedKeyRef.current = null;
          trackError(e);
          setError(
            'The sign-in link is invalid or has expired. Please request a new one.',
          );
        });
    }, [apiClient, route.params, setAuthToken, trackEvent]);

    return (
      <View style={[t.hFull, t.itemsCenter, t.justifyCenter, t.pX4, t.gap4]}>
        {error ? (
          <>
            <Text style={[t.textBase, t.texts.primary, t.textCenter]}>
              {error}
            </Text>
            <ButtonV2
              title="Go back"
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('OnboardingSignIn', {});
                }
              }}
            />
          </>
        ) : (
          <Text style={[t.textBase, t.texts.secondary, t.textCenter]}>
            Signing you in…
          </Text>
        )}
      </View>
    );
  },
);

MagicLinkSignInScreen.displayName = 'MagicLinkSignInScreen';

export { MagicLinkSignInScreen };
