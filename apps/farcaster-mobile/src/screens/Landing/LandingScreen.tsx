import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
} from 'expo-updates';
import { AnalyticsEvent } from 'farcaster-analytics';
import { AppError } from 'farcaster-client-data';
import {
  MILLIS_PER_SECOND,
  useCachedOnboardingState,
  useClientConfig,
} from 'farcaster-client-hooks';
import {
  authenticatePasskey,
  getStoredPasskeys,
  isPasskeyCancellation,
  isPasskeyNoCredential,
  isPasskeysSupported,
  StoredPasskey,
} from 'farcaster-cryptography';
import {
  AnimatedPressable,
  BottomSheetContentContainer,
  BottomSheetModal,
  ButtonV2,
  Text2,
  Typography,
  useBottomSheetModalRef,
} from 'farcaster-expo';
import compact from 'lodash/compact';
import { ChevronRightIcon } from 'lucide-react-native';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '~/components/Avatar';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LogoFull } from '~/components/images/LogoFull';
import { Onboarding } from '~/components/Onboarding/Onboarding';
import { buildScreen } from '~/components/Screen';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { isDev } from '~/constants/Env';
import { mnemonicStorageKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { DEVICE_SUPPORTS_RELOAD } from '~/contexts/CheckForOverTheAirUpdateProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
// import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { useSplash } from '~/contexts/SplashProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useImportWalletFromMnemonic } from '~/hooks/data/useImportWalletFromMnemonic';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import {
  CouldNotImportWalletError,
  CouldNotInitPasskeysError,
  UnauthedStackParamList,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';
import { sleep } from '~/utils/PromiseUtils';
import { getSecureItem } from '~/utils/SecureStorageUtils';
import { AnalyticsEventUsernameFallback } from '~/utils/UserUtils';

const estimatedPasskeyItemSize = 80;
const maxPasskeysToShowWithoutScrolling = 3.4;

const DEVICE_SUPPORTS_OTA_UPDATES = isEnabled && !isDev && Device.isDevice;

type LandingScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'Landing'
>;

type LandingMenuItem = {
  address: string;
  name: string;
  subtitle: string | undefined;
  onPress: () => void;
  icon: React.ReactNode;
  isLoading: boolean;
};

const PasskeyItem = ({ item }: { item: LandingMenuItem }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={item.onPress}
      style={{
        paddingHorizontal: 14,
        marginTop: 10,
      }}
    >
      <View style={[t.pY3, t.justifyBetween, t.flexRow, t.itemsCenter]}>
        <View style={[t.gap2, t.flexRow]}>
          {item.icon}
          <View>
            <Typography label="Medium/Base" color="primary">
              {item.name}
            </Typography>
            <Typography label="Regular/Base" color="secondary">
              {item.subtitle}
            </Typography>
          </View>
        </View>
        <ChevronRightIcon size={24} color={t.colors.text.primary} />
      </View>
    </Pressable>
  );
};

const renderPasskey: ListRenderItem<LandingMenuItem> = ({ item }) => {
  return <PasskeyItem item={item} />;
};

const LandingScreen = buildScreen<LandingScreenProps>(
  { name: 'Landing', insetBottom: true, customSplashHandlerDefined: true },
  () => {
    const t = useTheme();
    const push = usePush();
    const { trackEvent } = useAnalytics();
    const { keyStore } = useFarcasterCryptographyKeyStore();

    const { preGenerateWallet, generateWallet, address } = useWallet();
    const { signOut } = useAuthToken();

    const onboardingState = useCachedOnboardingState();
    const pendingSignup =
      address && onboardingState && onboardingState.result.state.email;

    const { data } = useClientConfig();
    const importWalletFromMnemonic = useImportWalletFromMnemonic();

    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [passkeys, setPasskeys] = useState<StoredPasskey[]>([]);
    const bottomSheetRef = useBottomSheetModalRef();

    useEffect(() => {
      const init = async () => {
        try {
          const isSupported = await isPasskeysSupported({ keyStore });
          if (isSupported) {
            const storedPasskeys = await getStoredPasskeys({ keyStore });
            setPasskeys(storedPasskeys);
          }
        } catch (error) {
          trackError(new CouldNotInitPasskeysError({ error }));
        }

        // Get the latest over the air update on landing screen load - always
        if (DEVICE_SUPPORTS_OTA_UPDATES) {
          try {
            const update = await checkForUpdateAsync();
            if (update.isAvailable) {
              await fetchUpdateAsync();
              if (DEVICE_SUPPORTS_RELOAD) {
                await reloadAsync();
              }
            }
          } catch (e) {
            trackError(e);
          }
        }

        setIsInitialized(true);
      };

      if (!isInitialized) {
        init();
      }
    }, [isInitialized, keyStore, trackEvent]);

    const serverMaintenanceOn = useMemo(() => {
      return data.result.server.maintenance ?? false;
    }, [data?.result.server.maintenance]);

    const onPasskeyPress = useCallback(
      async (credentialId?: string) => {
        const storedPasskey = passkeys.find(
          (p) => p.credentialId === credentialId,
        );
        const passkeyContext = {
          fid: storedPasskey?.fid,
          username: storedPasskey?.username,
          domain: storedPasskey?.domain,
        };

        trackEvent(AnalyticsEvent.AuthAttemptSignInWithPasskeys, undefined);
        try {
          const {
            mnemonic,
            credentialId: discoveredCredentialId,
            domain,
          } = await authenticatePasskey({
            keyStore,
            credentialId,
          });

          trackEvent(AnalyticsEvent.AuthPasskeyNativeAuthSucceeded, undefined);

          if (!mnemonic) {
            trackEvent(
              AnalyticsEvent.AuthPasskeyLargeBlobMissing,
              passkeyContext,
            );
            trackError(
              new CouldNotImportWalletError({
                error: new Error('Passkey largeBlob was empty after auth'),
              }),
              passkeyContext,
            );
            return;
          }

          // TODO: Figure out why we have this manual sleep applied here. Is this so we have
          // some spinner showing on the passkey lines on landing?
          await sleep(500);

          trackEvent(AnalyticsEvent.AuthClickLogInWithPasskeys, undefined);

          const normalizedMnemonic = mnemonic.trim().toLowerCase();
          await importWalletFromMnemonic({
            mnemonic: normalizedMnemonic,
            passkeyDiscovery: {
              credentialId: discoveredCredentialId,
              domain,
            },
            onSuccess: ({ username }) => {
              trackEvent(AnalyticsEvent.AuthCompletedSignInWithPasskeys, {
                usernameFromWallet: username || AnalyticsEventUsernameFallback,
              });
            },
            onExternalUserNeedsOnboarding: () => {
              push('Onboarding', { error: undefined });
            },
            onExternalUserSignerFailed: () => {
              Alert.alert(
                'Sign in failed',
                "We couldn't finish setting up your account. Please try again.",
                [{ text: 'OK', style: 'default' }],
              );
            },
            onUserDoesNotExist: () => {
              Alert.alert(
                'No account found',
                'Use your recovery phrase to sign into this account',
                [
                  {
                    text: 'Ok',
                    isPreferred: true,
                    style: 'default',
                  },
                ],
              );

              trackError(
                new AppError('User does not exist', {
                  location: 'LandingScreen',
                  name: 'NoUserForImportedAccountError',
                }),
              );
            },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logErrorInDevOnly(error);

          if (isPasskeyCancellation(error)) {
            return;
          }

          if (isPasskeyNoCredential(error)) {
            Alert.alert(
              'No passkey found',
              'No passkey is available on this device. Please try another sign-in method.',
              [{ text: 'OK', style: 'default' }],
            );
            return;
          }

          trackError(new CouldNotImportWalletError({ error }), {
            ...passkeyContext,
            originalError: errorMessage,
          });
          trackEvent(AnalyticsEvent.AuthFailedSignInWithPasskeys, {
            ...passkeyContext,
            errorMessage,
          });

          if (
            error instanceof Error &&
            (error.message === 'Passkey did not return recovery data' ||
              error.message === 'LargeBlobMissing')
          ) {
            Alert.alert(
              'Sign in failed',
              "This passkey doesn't have recovery data. Please use your recovery phrase instead.",
              [{ text: 'OK', style: 'default' }],
            );
            return;
          }

          Alert.alert(
            'Sign in failed',
            'Unable to sign in with this passkey. Please try again or use your recovery phrase.',
            [{ text: 'OK', style: 'default' }],
          );
        }
      },
      [importWalletFromMnemonic, keyStore, passkeys, push, trackEvent],
    );

    const copyMnemonic = useCallback(({ previous }: { previous: boolean }) => {
      getSecureItem({ key: mnemonicStorageKey, fallback: '' })
        .then((mnemonic) => {
          if (mnemonic) {
            Clipboard.setStringAsync(mnemonic);
            Alert.alert(
              previous
                ? 'Save your previous account recovery phrase'
                : 'Save your recovery phrase',
              previous
                ? 'The recovery phrase from your previous account creation is copied to your clipboard. Keep it safe. You may need it to sign in and finish setting up your account.'
                : "Your recovery phrase is copied to your clipboard. Keep it safe. You'll need it to sign in or finish setting up your account.",
              [
                {
                  text: 'OK, I saved it',
                  isPreferred: true,
                  style: 'default',
                },
              ],
            );
          } else {
            Alert.alert(
              'Sadly we could not find a mnemonic in your keychain\n:(',
            );
          }
        })
        .catch((err) => {
          alert(`Error reading mnemonic: ${err.message}`);
        });
    }, []);

    const clearMnemonic = useCallback(() => {
      signOut({ reason: 'user_initiated' });
    }, [signOut]);

    const navigate = useNavigate();
    const pregeneratedOnce = React.useRef(false);

    useEffect(() => {
      if (pregeneratedOnce.current === false) {
        pregeneratedOnce.current = true;
        preGenerateWallet();
      }
    }, [preGenerateWallet]);

    const createWalletAndStartOnboarding = React.useCallback(async () => {
      await generateWallet();
      navigate('Onboarding', {
        error: undefined,
      });
    }, [generateWallet, navigate]);

    const continueSignUp = useCallback(async () => {
      trackEvent(AnalyticsEvent.PressContinueSignUp);

      if (address) {
        push('Onboarding', { error: undefined });
      } else {
        await createWalletAndStartOnboarding();
      }
    }, [address, createWalletAndStartOnboarding, push, trackEvent]);

    const onContinue = pendingSignup ? continueSignUp : undefined;
    // const onContinue = () => {
    //   generateWallet({ onGenerated: async () => {} });
    // };

    const newSignUp = useCallback(async () => {
      trackEvent(AnalyticsEvent.PressSignUp, { version: 3 });
      await createWalletAndStartOnboarding();
    }, [createWalletAndStartOnboarding, trackEvent]);

    const onSignUp = useCallback(async () => {
      return newSignUp();
    }, [newSignUp]);

    const onSignIn = useCallback(() => {
      if (pendingSignup) {
        trackEvent(AnalyticsEvent.ViewAbandonAccountCreation, undefined);
        bottomSheetRef.current?.present();
        return;
      }

      trackEvent(AnalyticsEvent.AuthClickLogInOption, undefined);
      push('OnboardingSignIn', {});
    }, [bottomSheetRef, pendingSignup, push, trackEvent]);

    const dismissAbandonSheet = useCallback(() => {
      trackEvent(AnalyticsEvent.CancelAbandonAccountCreation, undefined);
      bottomSheetRef.current?.dismiss();
    }, [bottomSheetRef, trackEvent]);

    const abandon = useCallback(() => {
      trackEvent(AnalyticsEvent.AbandonAccountCreation, undefined);
      push('OnboardingSignIn', {});
    }, [push, trackEvent]);

    const { onAppInitialized } = useSplash();

    React.useEffect(() => {
      if (isInitialized) {
        setTimeout(onAppInitialized, MILLIS_PER_SECOND / 2);
      }
    }, [isInitialized, onAppInitialized]);

    React.useEffect(() => {
      // Verifying new onboarding flow is working on OTA updates or not
      trackEvent(AnalyticsEvent.LaunchScreenLanded, {
        version: 1,
      });
    }, [trackEvent]);

    const { top, bottom } = useSafeAreaInsets();

    if (!isInitialized) {
      return <FullScreenLoadingIndicator debugName="LandingScreen" />;
    }

    return (
      <LinearGradient
        colors={t.dark ? ['#6A3CFF', '#121212'] : ['#6A3CFF', '#E3E9FF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          t.backgrounds.default,
          {
            position: 'absolute',
            bottom: 0,
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
          },
        ]}
      >
        <View
          style={[
            t.hFull,
            t.justifyBetween,
            t.pX4,
            { paddingTop: top, paddingBottom: bottom + 20 },
          ]}
        >
          <View style={[t.itemsCenter, t.flexGrow, t.pT46, t.relative]}>
            <Pressable
              onLongPress={() => {
                Alert.prompt(
                  'Secret Menu',
                  'What are you trying to do?',
                  (value) => {
                    switch (value.trim()) {
                      case 'copy_mnemonic':
                        copyMnemonic({ previous: false });
                        break;
                      case 'clear_mnemonic':
                        clearMnemonic();
                        break;
                      default:
                        Alert.alert('Unrecognized command');
                    }
                  },
                );
              }}
            >
              <LogoFull size={64} />
            </Pressable>
          </View>
          {passkeys.length > 0 ? (
            <LandingScreenContentWithExistingAccount
              disabled={serverMaintenanceOn}
              passkeys={passkeys}
              onPasskeyPress={onPasskeyPress}
              onContinue={onContinue}
              onSignUp={onSignUp}
              onSignIn={onSignIn}
            />
          ) : (
            <LandingScreenContentNoExistingAccount
              disabled={serverMaintenanceOn}
              onContinue={onContinue}
              onSignUp={onSignUp}
              onSignIn={onSignIn}
            />
          )}

          {/* Bottom Sheet */}
          <LandingBottomSheet
            ref={bottomSheetRef}
            cancel={dismissAbandonSheet}
            abandon={abandon}
          />
        </View>
      </LinearGradient>
    );
  },
);
LandingScreen.displayName = 'LandingScreen';

const LandingBottomSheet = React.forwardRef<
  React.ComponentRef<typeof BottomSheetModal>,
  { cancel: () => void; abandon: () => void }
>(({ cancel, abandon }, ref) => {
  const t = useTheme();
  const onboardingState = useCachedOnboardingState();

  return (
    <BottomSheetModal
      ref={ref}
      name="LandingAbandonAccount"
      enableDynamicSizing
    >
      <BottomSheetContentContainer>
        <Text2 size="2xl" weight="semibold">
          Abandon your account?
        </Text2>
        <Text2 style={[t.mT3]}>
          You haven't finished setting up your account. You may lose any
          payments you've made.
        </Text2>
        <View style={{ marginVertical: 20 }}>
          <View
            style={[
              t.backgrounds.secondary,
              { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <View>
                <SimplerRemoteImage
                  uri={defaultAvatars[2]}
                  width={40}
                  height={40}
                  style={t.roundedFull}
                />
              </View>
              <View style={[t.justifyBetween]}>
                <Text2 weight="medium" numberOfLines={1}>
                  {onboardingState.result.state.user?.username ??
                    onboardingState.result.state.email ??
                    'New account'}
                </Text2>
              </View>
            </View>
          </View>
        </View>
        <View style={[t.flexRow, { gap: 8 }]}>
          <ButtonV2
            variant="destructive"
            width="flex1"
            onPress={abandon}
            title="Yes, abandon"
          />
          <ButtonV2
            variant="secondary"
            width="flex1"
            onPress={cancel}
            title="Cancel"
          />
        </View>
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
});

interface LandingScreenContentNoExistingAccountProps {
  disabled: boolean;
  onContinue: (() => void) | undefined;
  onSignUp: () => void;
  onSignIn: () => void;
}

const defaultAvatars = [
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/95e044eb-c3e1-47ca-ae1a-6cfce9f2ce00/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/5a2717bd-8a5e-4596-12ba-67e920d4f600/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/13cd6c7b-8fd2-4768-48ca-e32ac3620100/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/5567fc3e-c6a7-4b6d-b410-a5c46554ab00/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/be8deecf-57c0-45e4-0124-f4f136e1a700/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/924d8eed-3ab3-42b8-4e17-a7450a8b4800/original',
];

const LandingScreenContentNoExistingAccount: FC<
  LandingScreenContentNoExistingAccountProps
> = ({ disabled, onSignUp, onSignIn, onContinue }) => {
  const t = useTheme();
  const onboardingState = useCachedOnboardingState();

  return (
    <View style={[t.flex, t.flexCol, { gap: 12 }]}>
      {onContinue ? (
        <>
          <AnimatedPressable
            onPress={onContinue}
            style={[
              t.backgrounds.brandLight,
              { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
            ]}
          >
            <View style={[t.flexRow, { gap: 8 }]}>
              <View>
                <SimplerRemoteImage
                  uri={defaultAvatars[2]}
                  width={40}
                  height={40}
                  style={t.roundedFull}
                />
              </View>
              <View>
                <Text2 weight="medium" numberOfLines={1}>
                  {onboardingState.result.state.user?.username ??
                    onboardingState.result.state.email ??
                    'New account'}
                </Text2>
                <Text2 weight="medium" color="brand">
                  Create account
                </Text2>
              </View>
            </View>
          </AnimatedPressable>
          <Onboarding.SecondaryButton hierarchy="secondary" onPress={onSignIn}>
            Sign in
          </Onboarding.SecondaryButton>
        </>
      ) : (
        <>
          <Onboarding.Button onPress={onSignUp} disabled={disabled}>
            Create account
          </Onboarding.Button>
          <Onboarding.SecondaryButton hierarchy="secondary" onPress={onSignIn}>
            Sign in
          </Onboarding.SecondaryButton>
        </>
      )}
    </View>
  );
};

interface LandingScreenContentWithExistingAccountProps {
  disabled: boolean;
  passkeys: StoredPasskey[];
  onPasskeyPress: (credentialId: string) => Promise<void>;
  onContinue: (() => void) | undefined;
  onSignUp: () => void;
  onSignIn: () => void;
}

const LandingScreenContentWithExistingAccount: FC<
  LandingScreenContentWithExistingAccountProps
> = ({ passkeys, onPasskeyPress, ...rest }) => {
  const t = useTheme();

  const extraData = useCommonFlatListExtraData();
  const height =
    Math.min(passkeys.length, maxPasskeysToShowWithoutScrolling) *
    estimatedPasskeyItemSize;

  const [passkeysLoading, setPasskeysLoading] = useState<
    Record<string, boolean>
  >({});

  const menuItems = useMemo((): LandingMenuItem[] => {
    return compact([
      ...passkeys.map((p) => {
        return {
          address: p.address,
          name: p.displayName ? p.displayName : '@' + p.username,
          subtitle: '@' + p.username,
          onPress: async () => {
            setPasskeysLoading((prevPassKeysLoading) => ({
              ...prevPassKeysLoading,
              [p.credentialId]: true,
            }));

            try {
              await onPasskeyPress(p.credentialId);
            } finally {
              setPasskeysLoading((prevPassKeysLoading) => ({
                ...prevPassKeysLoading,
                [p.credentialId]: false,
              }));
            }
          },
          icon: <Avatar pfpUrl={p.pfpUrl} diameter={40} />,
          isLoading: !!passkeysLoading[p.credentialId],
        };
      }),
    ]);
  }, [onPasskeyPress, passkeys, passkeysLoading]);

  return (
    <>
      <View
        style={[
          {
            height: height,
            maxHeight: 248,
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 0.5,
            backgroundColor: t.dark ? '#00000040' : '#FFFFFF40',
            marginBottom: 10,
          },
          t.borders.primary,
        ]}
      >
        <FlashList<LandingMenuItem>
          data={menuItems}
          extraData={extraData}
          keyExtractor={({ address }: { address: string }) => address}
          showsVerticalScrollIndicator={false}
          bounces={false}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderPasskey}
        />
      </View>
      <View style={[t.mT4]}>
        <LandingScreenContentNoExistingAccount {...rest} />
      </View>
    </>
  );
};

export { LandingScreen };
