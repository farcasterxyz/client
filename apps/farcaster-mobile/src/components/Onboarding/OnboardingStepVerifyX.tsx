import {
  dismissAuthSession,
  dismissBrowser,
  openAuthSessionAsync,
} from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useStartOnboardingXAuthLink } from 'farcaster-client-hooks';
import { Typography } from 'farcaster-expo';
import React from 'react';
import { Linking, Platform, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { resolveUniversalLink } from '~/utils/DeepLinkUtils';
import { parseUrl } from '~/utils/UrlUtils';

import { Onboarding, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingSteps } from './StepsProvider';

function CheckIcon({ fill }: { fill: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OnboardingStepVerifyX() {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const [{ twitterVerificationError, registrationError }, dispatch] =
    useOnboardingSteps();

  const getXAuthLink = useStartOnboardingXAuthLink();

  const { account } = useWallet();

  const onDeepLink = React.useCallback(
    ({ url }: { url: string }) => {
      const parsedUrl = new URL(url);

      const resolved = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });

      if (
        resolved &&
        (resolved.type === 'navigate' || resolved.type === 'push') &&
        resolved.name === 'Onboarding'
      ) {
        if (Platform.OS === 'ios') {
          dismissBrowser();
        }

        if (typeof resolved.params.error !== 'undefined') {
          trackEvent(AnalyticsOnlyEvent.OnboardingXVerificationError, {
            error_type: resolved.params.error,
            error_message: resolved.params.error,
          });
          dispatch({
            type: 'SetTwitterVerifcationError',
            error: resolved.params.error,
          });
          dispatch({
            type: 'SetStep',
            step: 'PayWithIAP',
            direction: 'forwards',
          });
        } else {
          dispatch({
            type: 'SetStep',
            step: 'ChooseUsername',
            direction: 'forwards',
          });
        }
      }
    },
    [dispatch, trackEvent],
  );

  React.useEffect(() => {
    const linkingSubscription = Linking.addEventListener('url', onDeepLink);
    return () => {
      linkingSubscription.remove();
    };
  }, [onDeepLink]);

  const onContinuePress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.PressContinueWithXVerify, {});

    try {
      const { result } = await getXAuthLink({ account: account! });

      await openAuthSessionAsync(result.url)
        .then((authSessionResult) => {
          if (authSessionResult.type === 'success') {
            const parsedUrl = parseUrl(
              authSessionResult.url.replace(
                /farcaster:\/\//gi,
                'https://farcaster.xyz',
              ),
            );

            if (!parsedUrl) {
              if (Platform.OS === 'ios') {
                dismissAuthSession();
              }

              dispatch({
                type: 'SetTwitterVerifcationError',
                error: 'unknown',
              });

              return;
            }

            const resolved = resolveUniversalLink({
              url: parsedUrl.href,
              pathname: parsedUrl.pathname,
              searchParams: parsedUrl.searchParams,
            });

            if (
              resolved &&
              (resolved.type === 'navigate' || resolved.type === 'push') &&
              resolved.name === 'Onboarding'
            ) {
              // Pretty sure this actually does not do anything and the deeplink resolver
              // for auth using farcaster:// dismisses the dialog overall. Keeping it in here
              // just for the time being.
              if (Platform.OS === 'ios') {
                dismissBrowser();
              }

              if (typeof resolved.params.error !== 'undefined') {
                trackEvent(AnalyticsOnlyEvent.OnboardingXVerificationError, {
                  error_type: resolved.params.error,
                  error_message: resolved.params.error,
                });

                dispatch({
                  type: 'SetTwitterVerifcationError',
                  error: resolved.params.error,
                });

                trackEvent(AnalyticsEvent.RedirectToIAPFromFailedX, {
                  error: resolved.params.error,
                });

                dispatch({
                  type: 'SetStep',
                  step: 'PayWithIAP',
                  direction: 'forwards',
                });
              } else {
                dispatch({
                  type: 'SetStep',
                  step: 'VerifyingX',
                  direction: 'forwards',
                });
              }
            }
          }
        })
        .catch(() => {
          if (Platform.OS === 'ios') {
            dismissAuthSession();
          }

          dispatch({
            type: 'SetTwitterVerifcationError',
            error: 'unknown',
          });
        });
    } catch (e) {
      if (Platform.OS === 'ios') {
        dismissAuthSession();
      }

      trackOnboardingError(e, 'verify_x');

      dispatch({
        type: 'SetTwitterVerifcationError',
        error: 'unknown',
      });
    }
  }, [dispatch, getXAuthLink, account, trackEvent]);

  const [showOptions, setShowOptions] = React.useState<boolean>(false);

  const onSkipPress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.TryAnotherWayPressOnVerifyX, {
      twitterVerificationError,
      registrationError,
    });

    setShowOptions(true);
  }, [registrationError, trackEvent, twitterVerificationError]);

  const onOptionsModalDismiss = React.useCallback(() => {
    setShowOptions(false);
  }, []);

  const onPayPress = React.useCallback(() => {
    onOptionsModalDismiss();

    trackEvent(AnalyticsEvent.MoveToOptionIAP, {
      on: 'verify x',
      twitterVerificationError,
      registrationError,
    });

    setTimeout(() => {
      dispatch({ type: 'SetStep', step: 'PayWithIAP', direction: 'forwards' });
    }, 1e2);
  }, [
    dispatch,
    onOptionsModalDismiss,
    registrationError,
    trackEvent,
    twitterVerificationError,
  ]);

  const onInviteCodePress = React.useCallback(() => {
    onOptionsModalDismiss();

    trackEvent(AnalyticsEvent.MoveToOptionInviteCode, {
      on: 'verify x',
      twitterVerificationError,
      registrationError,
    });

    setTimeout(() => {
      dispatch({
        type: 'SetStep',
        step: 'UseInviteCode',
        direction: 'forwards',
      });
    }, 1e2);
  }, [
    dispatch,
    onOptionsModalDismiss,
    registrationError,
    trackEvent,
    twitterVerificationError,
  ]);

  return (
    <Onboarding.Layout onBackPress={undefined} onSkipPress={undefined}>
      <Onboarding.Title>Sign in with 𝕏</Onboarding.Title>
      <View style={[t.flex, t.flexCol, t.mT2, t.gap4]}>
        <View style={[t.flex, t.flexRow, t.itemsStart, t.wFull, t.gap4]}>
          <CheckIcon fill={t.colors.text.primary} />
          <View style={[t.flex1, t.flexCol, t.gap2]}>
            <Onboarding.Sub>Join for free</Onboarding.Sub>
            <Typography
              adjustsFontSizeToFit
              label="Medium/Base"
              color="secondary"
            >
              Verify your X account and skip the signup fee, which unverified
              accounts have to pay. This reduces spam and bots on Farcaster.
            </Typography>
          </View>
        </View>
        <View style={[t.flex, t.flexRow, t.itemsStart, t.wFull, t.gap4]}>
          <CheckIcon fill={t.colors.text.primary} />
          <View style={[t.flex1, t.flexCol, t.gap2]}>
            <Onboarding.Sub>Find people you know</Onboarding.Sub>
            <Typography
              adjustsFontSizeToFit
              label="Medium/Base"
              color="secondary"
            >
              Discover people you know on X and connect with them here. Your
              followers on X will also be notified if they are on Farcaster.
            </Typography>
          </View>
        </View>
        <View style={[t.flex, t.flexRow, t.itemsStart, t.wFull, t.gap4]}>
          <CheckIcon fill={t.colors.text.primary} />
          <View style={[t.flex1, t.flexCol, t.gap2]}>
            <Onboarding.Sub>Import your profile</Onboarding.Sub>
            <Typography
              adjustsFontSizeToFit
              label="Medium/Base"
              color="secondary"
            >
              Bring in your photo, bio and display name from X so that you can
              start using the app immediately.
            </Typography>
          </View>
        </View>
      </View>
      <OnboardingPortal.Portal>
        {typeof twitterVerificationError !== 'undefined' && (
          <Onboarding.Alert>
            Failed to verify.{' '}
            {twitterVerificationError === 'already_connected' &&
              'Account is already connected to another Farcaster account.'}
            {twitterVerificationError === 'not_eligible' &&
              'Account is not eligible for free signup.'}
          </Onboarding.Alert>
        )}
        {typeof registrationError !== 'undefined' && (
          <Onboarding.Alert>
            Failed to register. Please try again later.
          </Onboarding.Alert>
        )}
        <Onboarding.Button onPress={onContinuePress}>
          Continue with 𝕏
        </Onboarding.Button>
        <Onboarding.LinkButton onPress={onSkipPress}>
          Don't have 𝕏? Try another way
        </Onboarding.LinkButton>
      </OnboardingPortal.Portal>
      {showOptions && (
        <OptionsModal
          onDismiss={onOptionsModalDismiss}
          onPayPress={onPayPress}
          onInviteCodePress={onInviteCodePress}
        />
      )}
    </Onboarding.Layout>
  );
}

export function OptionsModal({
  onDismiss,
  onPayPress,
  onInviteCodePress,
}: {
  onDismiss: () => void;
  onPayPress: () => void;
  onInviteCodePress: () => void;
}) {
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
        label: 'Use an invite code',
        onPress: onInviteCodePress,
        icon: ({ color, size }) => (
          <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
            <Path
              d="M5.83331 12.5C7.21402 12.5 8.33331 11.3807 8.33331 10C8.33331 8.61929 7.21402 7.5 5.83331 7.5C4.4526 7.5 3.33331 8.61929 3.33331 10C3.33331 11.3807 4.4526 12.5 5.83331 12.5Z"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M8.33331 7.5V12.5"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M14.1667 12.5C15.5474 12.5 16.6667 11.3807 16.6667 10C16.6667 8.61929 15.5474 7.5 14.1667 7.5C12.786 7.5 11.6667 8.61929 11.6667 10C11.6667 11.3807 12.786 12.5 14.1667 12.5Z"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M11.6667 5.83398V12.5007"
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
    ];
    return options;
  }, [onInviteCodePress, onPayPress]);

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

export { OnboardingStepVerifyX };
