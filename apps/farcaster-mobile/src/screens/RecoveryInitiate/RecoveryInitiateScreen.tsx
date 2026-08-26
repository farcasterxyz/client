import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useCachedOnboardingState,
  useInitiateRecovery,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import { OnboardingFormField } from '~/components/OnboardingFormField';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { UnauthedStackParamList } from '~/types';
import { isEmailValid } from '~/utils/EmailUtils';
import { trackError } from '~/utils/ErrorUtils';
import {
  classifyRecoveryIntent,
  normalizeEmail,
} from '~/utils/RecoveryTelemetry';

type RecoveryInitiateScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'RecoveryInitiate'
>;

const RecoveryInitiateScreen = buildScreen<RecoveryInitiateScreenProps>(
  {
    avoidKeyboard: true,
    insetBottom: true,
    name: 'RecoveryInitiate',
  },
  ({ route }) => {
    const t = useTheme();
    const push = usePush();
    const toast = useToast();
    const { trackEvent, alias, identify, registerUserProperty } =
      useAnalytics();
    const initiateRecovery = useInitiateRecovery();
    const onboardingState = useCachedOnboardingState();

    const [email, setEmail] = useState(route.params.email ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const intentRegisteredRef = useRef(false);
    useEffect(() => {
      if (intentRegisteredRef.current) return;
      intentRegisteredRef.current = true;

      const cachedState = onboardingState.result.state;
      const hasCachedUsername = !!cachedState?.user?.username;
      const hasCachedFid = !!cachedState?.hasFid;
      const prefilledEmail = !!route.params.email;
      const intent = classifyRecoveryIntent({
        hasCachedFid,
        hasCachedUsername,
        prefilledEmail,
      });

      registerUserProperty({ recovery_intent: intent });
      trackEvent(AnalyticsOnlyEvent.RecoveryIntentClassified, {
        recovery_intent: intent,
        has_cached_fid: hasCachedFid,
        has_cached_username: hasCachedUsername,
        prefilled_email: prefilledEmail,
      });
      trackEvent(AnalyticsOnlyEvent.RecoveryInitiateScreenShown, {
        recovery_intent: intent,
        prefilled_email: prefilledEmail,
      });
    }, [onboardingState, registerUserProperty, route.params.email, trackEvent]);

    const submit = async () => {
      try {
        setIsSubmitting(true);

        if (email.trim() === onboardingState.result.state.email) {
          Alert.alert(
            'Account recovered',
            'This account was found on your device.',
            [
              {
                onPress: () => push('Onboarding', { error: undefined }),
                text: 'Continue',
              },
            ],
          );
          return;
        }

        const normalizedEmail = normalizeEmail(email);

        // Switch the analytics distinct_id to the normalized email BEFORE
        // firing the recovery email submit. The backend emits
        // `recovery_email.sent` keyed by the same email, so both sides end
        // up on the same person and the funnel step 1 -> 2 stitches without
        // waiting for the later `alias(fid)` on poll.
        //
        // `alias` here merges the current anon history (screen_shown,
        // intent_classified, deep_link_opened if already in this session)
        // INTO the email-keyed person. `identify` then sets person
        // properties so support can search by raw email.
        alias(normalizedEmail);
        identify(normalizedEmail, { email: normalizedEmail });

        await initiateRecovery({ email: normalizedEmail });
        trackEvent(AnalyticsEvent.SubmitRequestRecoveryLink, {
          email: normalizedEmail,
        });
        push('RecoveryConfirm', { email: normalizedEmail });
      } catch (e) {
        const error = new Error('Failed to initiate recovery', { cause: e });
        trackError(error);
        trackEvent(AnalyticsOnlyEvent.RecoveryEmailError, {
          error_message: (e instanceof Error ? e.message : String(e)).slice(
            0,
            500,
          ),
          is_resend: false,
        });
        toast.show('Failed to initiate recovery', { type: 'danger' });
      } finally {
        setIsSubmitting(false);
      }
    };

    const canVerifyEmail = useMemo(() => {
      return email && isEmailValid(email);
    }, [email]);

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
            onChangeText={(nextEmail) => setEmail(nextEmail.trim())}
            value={email}
          />
          <Text style={[t.textSm, t.texts.secondary, t.mT2]}>
            We'll send you an email now to verify it.
          </Text>
        </View>
        <View style={[t.itemsCenter, t.justifyEnd]}>
          <View style={[t.wFull]}>
            <ButtonV2
              title="Continue"
              onPress={submit}
              loading={isSubmitting}
              disabled={!canVerifyEmail}
            />
          </View>
        </View>
      </View>
    );
  },
);

export { RecoveryInitiateScreen };
