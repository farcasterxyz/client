import { Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { AppError } from 'farcaster-client-data';
import { useUnfocusInputs } from 'farcaster-expo';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { english } from 'viem/accounts';

import { ButtonV2 } from '~/components/ButtonV2';
import { Link } from '~/components/Link';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { Textarea } from '~/components/Textarea';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useImportWalletFromMnemonic } from '~/hooks/data/useImportWalletFromMnemonic';
import { usePush } from '~/hooks/navigation/usePush';
import { useSyncHeaderDisableCancel } from '~/hooks/navigation/useSyncHeaderDisableCancel';
import { useOnboardingScreen } from '~/hooks/useOnboardingScreen';
import { UnauthedStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';
import { AnalyticsEventUsernameFallback } from '~/utils/UserUtils';

type OnboardingImportWalletScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingImportWallet'
>;

const title = 'Log in with recovery phrase';

const OnboardingImportWalletScreen =
  buildScreen<OnboardingImportWalletScreenProps>(
    { avoidKeyboard: true, insetBottom: true, name: 'OnboardingImportWallet' },
    () => {
      const t = useTheme();

      const [mnemonic, setMnemonic] = useState('');
      const [error, setError] = useState<string | null>(null);
      const [isValid, setIsValid] = useState(false);
      const [isSubmitting, setIsSubmitting] = useState(false);

      const importWalletFromMnemonic = useImportWalletFromMnemonic();

      const push = usePush();
      const toast = useToast();

      const { setOptions } = useNavigation();

      const { trackEvent } = useAnalytics();

      useOnboardingScreen({ title, noBackWarning: true });

      useEffect(() => {
        if (isSubmitting) {
          setOptions({ headerBackVisible: false });
        } else {
          setOptions({ headerBackVisible: true });
        }
      }, [isSubmitting, setOptions]);

      const { unfocusInputs } = useUnfocusInputs();

      const normalizedMnemonic = mnemonic.trim().toLowerCase();

      useEffect(() => {
        if (normalizedMnemonic.length === 0) {
          return;
        }

        const words = normalizedMnemonic.split(' ');

        if (words.length !== 12 && words.length !== 24) {
          setIsValid(false);
          setError(null);
          return;
        }

        const invalidWords = words.filter(
          (word) => english.indexOf(word) === -1,
        );

        if (invalidWords.length) {
          setIsValid(false);
          setError(
            `The following word${
              invalidWords.length > 1 ? 's are' : ' is'
            } not valid:${'\n'}${invalidWords.join(', ')}`,
          );
        } else {
          setIsValid(true);
          setError(null);
        }
      }, [normalizedMnemonic]);

      useSyncHeaderDisableCancel(isSubmitting);

      return (
        <Pressable onPress={unfocusInputs}>
          <View style={[t.hFull, t.justifyBetween, t.pX4, t.pB3]}>
            <View style={[t.justifyStart, t.flexGrow]}>
              <Link
                onPress={() => {
                  push('OnboardingImportWalletHelp', {});
                }}
                disabled={isSubmitting}
                size="sm"
              >
                {/* Need the top padding due to a bug that causes the icon to be cut off */}
                <View style={[t.flexRow, t.itemsCenter, { paddingTop: 2 }]}>
                  <Octicons
                    name="question"
                    color={t.colors.text.brand}
                    size={15}
                  />
                  <Text style={[t.texts.brand, { marginLeft: 6 }]}>
                    How do I find my recovery phrase
                  </Text>
                </View>
              </Link>
              <View style={[t.wFull]}>
                <Textarea
                  testID="onboarding-mnemonic-input"
                  autoFocus
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  value={mnemonic}
                  height={120}
                  onChangeText={setMnemonic}
                  inputStyle={[t.texts.primary, t.textBase, t.fontMono]}
                  containerStyle={[t.pX3, t.pY2, t.mB3, t.mT2]}
                />
              </View>
              <View style={[t.flexRow, t.justifyEnd]}>
                <Link
                  title="Lost recovery phrase?"
                  size="sm"
                  disabled={isSubmitting}
                  onPress={() => {
                    trackEvent(
                      AnalyticsEvent.ClickLostRecoveryPhrase,
                      undefined,
                    );
                    push('RecoveryInitiate', {});
                  }}
                />
              </View>
              {error && (
                <Text style={[t.texts.danger, t.fontSemibold, t.mT6]}>
                  {error}
                </Text>
              )}
            </View>
            <ButtonV2
              testID="onboarding-continue"
              title="Continue"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              onPress={() => {
                setIsSubmitting(true);

                // Run async so that the UI has a chance to update
                const importMnemonic = async () => {
                  try {
                    trackEvent(
                      AnalyticsEvent.AuthClickLogInWithMnemonic,
                      undefined,
                    );

                    await importWalletFromMnemonic({
                      mnemonic: normalizedMnemonic,
                      onSuccess: ({ username }) => {
                        trackEvent(
                          AnalyticsEvent.AuthCompletedSignInWithMnemonic,
                          {
                            usernameFromWallet:
                              username || AnalyticsEventUsernameFallback,
                          },
                        );
                        trackEvent(AnalyticsEvent.ImportExistingMnemonic, {});
                      },
                      onExternalUserNeedsOnboarding: () => {
                        // An external FID (created outside Warpcast) just had a
                        // free signer minted and is now authenticated but not yet
                        // onboarded. Route into the existing onboarding flow to
                        // finish setup (username, profile, warplet).
                        push('Onboarding', { error: undefined });
                      },
                      onExternalUserSignerFailed: () => {
                        toast.show(
                          `We couldn't finish setting up your account. Please try again.`,
                          {
                            type: 'danger',
                            duration: 10000,
                          },
                        );

                        setIsSubmitting(false);
                      },
                      onUserDoesNotExist: () => {
                        trackError(
                          new AppError('User does not exist', {
                            location: 'OnboardingImportWallet',
                            name: 'NoUserForImportedAccountError',
                          }),
                        );

                        toast.show(
                          `This recovery phrase is not associated with an active Farcaster account. ` +
                            `Try with a different recovery phrase or attempt an account recovery.`,
                          {
                            type: 'danger',
                            duration: 10000,
                          },
                        );

                        setIsSubmitting(false);
                      },
                    });
                  } catch (err) {
                    logErrorInDevOnly(err);
                    trackError(new Error('Error importing wallet'));
                    toast.show('Error importing wallet', {
                      type: 'danger',
                    });
                    return;
                  } finally {
                    setIsSubmitting(false);
                  }
                };

                setTimeout(importMnemonic, 50);
              }}
            />
          </View>
        </Pressable>
      );
    },
  );

OnboardingImportWalletScreen.displayName = 'OnboardingImportWalletScreen';

export { OnboardingImportWalletScreen };
