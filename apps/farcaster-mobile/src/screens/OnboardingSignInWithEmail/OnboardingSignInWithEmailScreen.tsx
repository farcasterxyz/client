import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import { OnboardingFormField } from '~/components/OnboardingFormField';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useOnboardingScreen } from '~/hooks/useOnboardingScreen';
import { UnauthedStackParamList } from '~/types';
import { isEmailValid } from '~/utils/EmailUtils';
import { trackError } from '~/utils/ErrorUtils';

type OnboardingSignInWithEmailScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingSignInWithEmail'
>;

const OnboardingSignInWithEmailScreen =
  buildScreen<OnboardingSignInWithEmailScreenProps>(
    {
      avoidKeyboard: true,
      insetBottom: true,
      name: 'OnboardingSignInWithEmail',
    },
    () => {
      const t = useTheme();
      const toast = useToast();
      const { trackEvent } = useAnalytics();
      const { apiClient } = useFarcasterApiClient();

      useOnboardingScreen({
        title: 'Sign in with email',
        noBackWarning: false,
      });

      const [email, setEmail] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [sentTo, setSentTo] = useState<string>();

      const canSubmit = useMemo(() => isEmailValid(email), [email]);

      const sendLink = async () => {
        const trimmedEmail = email.trim();
        if (!isEmailValid(trimmedEmail)) return;

        try {
          setIsSubmitting(true);
          await apiClient.initiateMagicLink({
            email: trimmedEmail,
            source: 'mobile',
          });
          trackEvent(AnalyticsEvent.AuthSentMagicLinkFromMobile, {
            resend: !!sentTo,
          });
          setSentTo(trimmedEmail);
        } catch (e) {
          trackError(e);
          toast.show('Failed to send email. Please try again.', {
            type: 'danger',
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <View style={[t.hFull, t.justifyBetween, t.pX4, t.pB3]}>
          <View style={[t.flexGrow]}>
            <OnboardingFormField
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              label=""
              maxLength={254}
              onChangeText={(next) => {
                const trimmed = next.trim();
                setEmail(trimmed);
                // Clear the sent confirmation when the address changes so the
                // UI never shows stale delivery info while a resend is in-flight.
                if (trimmed !== sentTo) setSentTo(undefined);
              }}
              value={email}
            />
            {sentTo ? (
              <Text style={[t.textSm, t.texts.secondary, t.mT2]}>
                We sent a sign-in link to {sentTo}. Tap it on this device to
                sign in.
              </Text>
            ) : (
              <Text style={[t.textSm, t.texts.secondary, t.mT2]}>
                We'll send you a sign-in link. Tap it on this device to sign in.
              </Text>
            )}
          </View>
          <View style={[t.itemsCenter, t.justifyEnd]}>
            <View style={[t.wFull]}>
              <ButtonV2
                title={sentTo ? 'Resend email' : 'Send sign-in link'}
                onPress={sendLink}
                loading={isSubmitting}
                disabled={!canSubmit || isSubmitting}
              />
            </View>
          </View>
        </View>
      );
    },
  );

OnboardingSignInWithEmailScreen.displayName = 'OnboardingSignInWithEmailScreen';

export { OnboardingSignInWithEmailScreen };
