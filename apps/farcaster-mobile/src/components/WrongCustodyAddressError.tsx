import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiWrongCustodyAddressError,
  formatEthAddress,
} from 'farcaster-client-data';
import { AtomsButton } from 'farcaster-expo';
import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useSplash } from '~/contexts/SplashProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useManuallyTrackView } from '~/hooks/datadog/useManuallyTrackView';

type WrongCustodyAddressErrorProps = {
  containerStyle?: ViewStyle[];
  error: ApiWrongCustodyAddressError;
  resetErrorBoundary: () => void;
};

const title = 'FID Transferred';

const WrongCustodyAddressError: FC<WrongCustodyAddressErrorProps> = memo(
  ({ error, resetErrorBoundary }) => {
    const t = useTheme();
    const { account } = useWallet();
    const { signOut } = useAuthToken();
    const { trackEvent } = useAnalytics();
    const { onAppInitialized } = useSplash();

    useManuallyTrackView({
      key: 'WrongCustodyAddressError',
      name: 'WrongCustodyAddressError',
      context: useMemo(
        () =>
          error instanceof Error
            ? {
                errorName: error.name,
                errorMessage: error.message,
                address: account?.address,
              }
            : {},
        [error, account?.address],
      ),
    });

    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
      trackEvent(AnalyticsEvent.HandledErrorShown, {
        key: 'wrong-custody-address-error',
        title,
      });
    }, [trackEvent]);

    useEffect(() => {
      // We call onAppInitialized to ensure that the faux splash screen
      // transitions out in cases where one of the top-level API requests
      // (e.g. fetching the current user profile + activity) fails
      // before we even get a chance to render the navigation container
      // and a screen that would typically trigger this behavior.
      onAppInitialized();
    }, [onAppInitialized]);

    const reset = async () => {
      await signOut({ reason: 'wrong_custody_address' });
      resetErrorBoundary();
    };

    return (
      <SafeAreaView>
        <View style={[t.hFull, t.p4, t.flex, t.flexCol]}>
          <ScrollView style={[t.flexGrow]}>
            <View style={[t.flex, t.flexCol]}>
              <Text
                style={[t.texts.primary, t.text3xl, t.textCenter, t.fontBold]}
              >
                {title}
              </Text>

              <View style={[t.mT20, t.pB4]}>
                <Text style={[t.texts.primary, t.textLg]}>
                  FID moved to address{' '}
                  {formatEthAddress(error.data.custodyAddress)}.
                </Text>
              </View>

              <Text style={[t.mT10, t.texts.primary, t.textLg]}>
                Remove the current address and log back in to continue. Back up
                the recovery phrase in case you need this address again.
              </Text>

              {!!account?.mnemonic && (
                <>
                  <View style={[t.mT6]}>
                    {isRevealed ? (
                      <View style={[t.mT2, t.p6, t.rounded, t.bgCodeSnippet]}>
                        <Text
                          style={[t.texts.secondary, t.fontMono, t.textBase]}
                          selectable
                        >
                          {account?.mnemonic}
                        </Text>
                      </View>
                    ) : (
                      <AtomsButton
                        onPress={() => {
                          setIsRevealed(!isRevealed);
                        }}
                        hierarchy="secondary"
                        size="m"
                      >
                        Reveal recovery phrase
                      </AtomsButton>
                    )}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
          <View style={[t.flexNone]}>
            <AtomsButton onPress={reset} hierarchy="danger" size="l">
              Remove {formatEthAddress(error.data.authenticatedAddress)}
            </AtomsButton>
          </View>
        </View>
      </SafeAreaView>
    );
  },
);

WrongCustodyAddressError.displayName = 'WrongCustodyAddressError';

export { WrongCustodyAddressError };
