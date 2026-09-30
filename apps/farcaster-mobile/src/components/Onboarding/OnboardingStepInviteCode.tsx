import { AnalyticsEvent } from 'farcaster-analytics';
import { Text2 } from 'farcaster-expo';
import React from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { Onboarding } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingSteps } from './StepsProvider';

function XIcon({ fill, size }: { fill: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M9.12201 1.125H10.776L7.16251 5.255L11.4135 10.875H8.08501L5.47801 7.4665L2.49501 10.875H0.840014L4.70501 6.4575L0.627014 1.125H4.04001L6.39651 4.2405L9.12201 1.125ZM8.54151 9.885H9.45801L3.54201 2.063H2.55851L8.54151 9.885Z"
        fill={fill}
      />
    </Svg>
  );
}
function OnboardingStepInviteCode() {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const [inviteCode, setInviteCode] = React.useState('');

  const [{ registrationError, twitterVerificationsDisabled }, dispatch] =
    useOnboardingSteps();

  const normalizedInviteCode = inviteCode.replace(/\s+/g, '');
  const disabled = normalizedInviteCode.length === 0;
  const onContinuePress = React.useCallback(() => {
    if (disabled) {
      return;
    }

    trackEvent(AnalyticsEvent.UseInviteCodeToRegister, {});

    dispatch({ type: 'SetRegistrationError', error: undefined });
    dispatch({
      type: 'SetInviteCode',
      inviteCode: normalizedInviteCode.toUpperCase(),
    });
    dispatch({
      type: 'SetStep',
      step: 'ChooseUsername',
      direction: 'forwards',
    });
  }, [disabled, dispatch, normalizedInviteCode, trackEvent]);

  const onChangeText = React.useCallback(
    (text: string) => {
      setInviteCode(text.replace(/\s+/g, ''));
    },
    [setInviteCode],
  );

  const [showOptions, setShowOptions] = React.useState<boolean>(false);

  const onSkipPress = React.useCallback(async () => {
    Keyboard.dismiss();

    trackEvent(AnalyticsEvent.TryAnotherWayPressOnInviteCode, {
      registrationError,
    });

    requestAnimationFrame(() => {
      setShowOptions(true);
    });
  }, [registrationError, trackEvent]);

  const onOptionsModalDismiss = React.useCallback(() => {
    setShowOptions(false);
  }, []);

  const onJoinFreeWithXPress = React.useCallback(() => {
    onOptionsModalDismiss();

    trackEvent(AnalyticsEvent.MoveToOptionVerifyX, {
      on: 'invite code',
      registrationError,
    });

    setTimeout(() => {
      dispatch({
        type: 'SetStep',
        step: 'VerifyWithX',
        direction: 'backwards',
      });
    }, 1e2);
  }, [dispatch, onOptionsModalDismiss, registrationError, trackEvent]);

  const onPayPress = React.useCallback(() => {
    onOptionsModalDismiss();

    trackEvent(AnalyticsEvent.MoveToOptionIAP, {
      on: 'invite code',
      registrationError,
    });

    setTimeout(() => {
      dispatch({
        type: 'SetStep',
        step: 'PayWithIAP',
        direction: 'backwards',
      });
    }, 1e2);
  }, [dispatch, onOptionsModalDismiss, registrationError, trackEvent]);

  return (
    <Onboarding.Layout onBackPress={undefined} onSkipPress={undefined}>
      <Onboarding.Title>Enter your invite code</Onboarding.Title>
      <Onboarding.Text>
        Use the invite code that you got from someone on Farcaster.
      </Onboarding.Text>
      <View style={[t.flex1, t.flexCol, { marginTop: 12, gap: 12 }]}>
        <Onboarding.Input
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'default'}
          autoFocus={true}
          placeholder="Invite code"
          onChangeText={onChangeText}
          value={inviteCode}
        />
        {typeof registrationError !== 'undefined' &&
          registrationError === 'invalid_invite_code' && (
            <Text2 color="danger" size="sm" weight="regular">
              This invite code isn't valid.
            </Text2>
          )}
      </View>
      <OnboardingPortal.Portal>
        {typeof registrationError !== 'undefined' &&
          registrationError !== 'invalid_invite_code' && (
            <Onboarding.Alert>
              Failed to register. Please try again later.
            </Onboarding.Alert>
          )}
        <Onboarding.Button onPress={onContinuePress} disabled={disabled}>
          Continue
        </Onboarding.Button>
        {twitterVerificationsDisabled && (
          <Onboarding.LinkButton onPress={onPayPress}>
            Pay an onchain fee
          </Onboarding.LinkButton>
        )}
        {!twitterVerificationsDisabled && (
          <Onboarding.LinkButton onPress={onSkipPress}>
            Try another way
          </Onboarding.LinkButton>
        )}
      </OnboardingPortal.Portal>
      {showOptions && (
        <OptionsModal
          onDismiss={onOptionsModalDismiss}
          onJoinFreeWithXPress={onJoinFreeWithXPress}
          onPayPress={onPayPress}
        />
      )}
    </Onboarding.Layout>
  );
}

export function OptionsModal({
  onDismiss,
  onJoinFreeWithXPress,
  onPayPress,
}: {
  onDismiss: () => void;
  onJoinFreeWithXPress: () => void;
  onPayPress: () => void;
}) {
  const t = useTheme();

  const buttonGroupOptions = React.useMemo(() => {
    const options: ButtonGroupOption[] = [
      {
        label: 'Pay an onchain fee',
        onPress: onPayPress,
        icon: ({ color, size }) => (
          <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <Path
              d="M16.6667 4.16602H3.33335C2.41288 4.16602 1.66669 4.91221 1.66669 5.83268V14.166C1.66669 15.0865 2.41288 15.8327 3.33335 15.8327H16.6667C17.5872 15.8327 18.3334 15.0865 18.3334 14.166V5.83268C18.3334 4.91221 17.5872 4.16602 16.6667 4.16602Z"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M1.66669 8.33398H18.3334"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
        destructive: false,
        enableHaptics: true,
      },
      {
        label: 'Sign in with X',
        onPress: onJoinFreeWithXPress,
        icon: ({ size }) => <XIcon fill={t.colors.text.primary} size={size} />,
        destructive: false,
        enableHaptics: true,
      },
    ];

    return options;
  }, [onJoinFreeWithXPress, onPayPress, t.colors.text.primary]);

  const modalRef = React.useRef<{ dismiss: () => void }>(null);

  return (
    <AutoDisplayingBottomSheetModal
      name="registrationOptionsModal"
      onDismiss={onDismiss}
      ref={modalRef}
    >
      <ButtonGroup options={buttonGroupOptions} />
    </AutoDisplayingBottomSheetModal>
  );
}

export { OnboardingStepInviteCode };
