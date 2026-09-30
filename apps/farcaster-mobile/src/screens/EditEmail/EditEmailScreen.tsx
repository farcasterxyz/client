import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useSendVerificationEmail } from 'farcaster-client-hooks';
import { useRequireBiometricAuth } from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useOnboardingState } from '~/hooks/data/useOnboardingState';
import { useAuthedHeaderHeight } from '~/hooks/navigation/useAuthedHeaderHeight';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { usePop } from '~/hooks/navigation/usePop';
import { HomeStackParamList } from '~/types';
import { isEmailValid } from '~/utils/EmailUtils';
import { trackError } from '~/utils/ErrorUtils';
import { sleep } from '~/utils/PromiseUtils';

type EditEmailScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'EditEmail'
>;

const EditEmailScreen = buildScreen<EditEmailScreenProps>(
  { name: 'EditEmail' },
  () => {
    const t = useTheme();
    const { account } = useWallet();

    const biometricAuthPromise = useRequireBiometricAuth();

    const {
      result: {
        state: { email: currentEmail },
      },
    } = useOnboardingState();
    const sendVerificationEmail = useSendVerificationEmail();

    const [email, setEmail] = useState(currentEmail || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pop = usePop();
    const toast = useToast();
    const { trackEvent } = useAnalytics();
    const submit = useCallback(async () => {
      setIsSubmitting(true);
      await biometricAuthPromise;
      try {
        await sendVerificationEmail({
          email,
          invalidateOnboardingStateAfterUpdate: false,
          account: account!,
        });
        await sleep(1000); // Wait a second for invalidations
        toast.show('Verification email sent');
        trackEvent(AnalyticsEvent.UpdateEmail, {});
        pop();
      } catch (err) {
        trackError(err);
        toast.show('Error updating email', {
          type: 'danger',
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [
      biometricAuthPromise,
      email,
      pop,
      sendVerificationEmail,
      account,
      toast,
      trackEvent,
    ]);

    const { setOptions } = useNavigation();
    const goBack = useGoBack();
    useEffect(() => {
      setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={goBack}>
            <Ionicons
              name="close"
              size={28}
              style={[t.texts.secondary, t._mL2]}
            />
          </TouchableOpacity>
        ),
      });
    }, [setOptions, goBack, t.texts.secondary, t._mL2]);

    const [isFocused, setIsFocused] = useState(true);
    const onFocus = React.useCallback(() => {
      setIsFocused(true);
    }, []);
    const onBlur = React.useCallback(() => {
      setIsFocused(false);
    }, []);

    const headerHeight = useAuthedHeaderHeight();
    const canSubmit = email && email !== currentEmail && isEmailValid(email);
    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={[t.p4, t.flex1, t.justifyBetween]}
        keyboardVerticalOffset={headerHeight}
      >
        <View>
          <Text style={[t.textBase, t.texts.secondary, t.mT2]}>
            Email is used for notifications; not publicly visible.
          </Text>
          <TextInput
            autoFocus={true}
            keyboardType="email-address"
            maxLength={254}
            onChangeText={setEmail}
            value={email}
            placeholder="Enter a valid email"
            autoCapitalize="none"
            variant="well"
            inputStyle={[t.border0]}
            onFocus={onFocus}
            onBlur={onBlur}
            containerStyle={[
              t.mY4,
              t.p2,
              t.roundedLg,
              t.borderHairline,
              isFocused ? t.borderActive : t.borderDefault,
            ]}
            clearButtonMode="always"
          />
        </View>
        <View style={t.pB4}>
          <ButtonV2
            disabled={!canSubmit}
            loading={isSubmitting}
            title="Done"
            onPress={submit}
            variant="primary"
          />
        </View>
      </KeyboardAvoidingView>
    );
  },
);

EditEmailScreen.displayName = 'EditEmailScreen';

export { EditEmailScreen };
