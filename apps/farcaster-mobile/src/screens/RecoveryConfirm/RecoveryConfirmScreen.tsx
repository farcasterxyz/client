import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useInitiateRecovery } from 'farcaster-client-hooks';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { openInbox } from 'react-native-email-link';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { UnauthedStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { normalizeEmail } from '~/utils/RecoveryTelemetry';

type RecoveryConfirmScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'RecoveryConfirm'
>;

const RecoveryConfirmScreen = buildScreen<RecoveryConfirmScreenProps>(
  {
    name: 'RecoveryConfirm',
    insetBottom: true,
  },
  ({ route }) => {
    const t = useTheme();
    const toast = useToast();
    const { trackEvent } = useAnalytics();

    const initiateRecovery = useInitiateRecovery();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const email = route.params.email;
    const normalizedEmail = email ? normalizeEmail(email) : undefined;

    useEffect(() => {
      trackEvent(
        AnalyticsOnlyEvent.RecoveryConfirmScreenShown,
        normalizedEmail ? { email: normalizedEmail } : {},
      );
    }, [normalizedEmail, trackEvent]);

    const submit = async () => {
      try {
        setIsSubmitting(true);
        await initiateRecovery({ email: email.trim() });
        trackEvent(
          AnalyticsOnlyEvent.RecoveryEmailResendPressed,
          normalizedEmail
            ? { email: normalizedEmail, is_resend: true }
            : { is_resend: true },
        );
      } catch (e) {
        const wrappedError = new Error('Failed to initiate recovery', {
          cause: e,
        });
        trackError(wrappedError);
        trackEvent(AnalyticsOnlyEvent.RecoveryEmailError, {
          error_message: (e instanceof Error ? e.message : String(e)).slice(
            0,
            500,
          ),
          is_resend: true,
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
        });
        toast.show('Failed to initiate recovery', { type: 'danger' });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <View style={[t.hFull, t.justifyBetween, t.pX4, t.pB3]}>
        <View style={[t.flexGrow]}>
          <Text style={[t.texts.primary, t.textBase]}>
            To recover your account, click the link in the email sent to:
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold, t.mT1]}>
            {email || '–'}
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.texts.secondary, t.mT6]}>
            <Text style={[t.fontSemibold]}>Note:</Text> The link needs to be
            opened on this device
          </Text>
        </View>
        <View style={[t.justifyEnd]}>
          <ButtonV2
            title="Resend email"
            variant="tertiary"
            disabled={isSubmitting}
            onPress={async () => {
              try {
                await submit();
                toast.show(`Sent confirmation email to ${email}`, {
                  placement: 'top',
                });
              } catch {
                toast.show('Error resending confirmation email.', {
                  type: 'danger',
                  placement: 'top',
                });
              }
            }}
          />
          <ButtonV2
            title="Open email app"
            margin={{ marginTop: sizes.s3 }}
            onPress={() => {
              openInbox({ removeText: true });
            }}
          />
        </View>
      </View>
    );
  },
);

export { RecoveryConfirmScreen };
