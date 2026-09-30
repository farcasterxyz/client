import { Octicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { useMemo } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CoinbaseWalletLogo from '~/assets/images/coinbaseWalletLogo.webp';
import { Prompt } from '~/components/prompts/Prompt';
import { Text } from '~/components/Text';
import { installCoinbaseWalletPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

function InstallCoinbaseWalletPrompt() {
  const { activePromptKey, hideGlobalPrompt, globalData } = useGlobalPrompts();
  const castHash = globalData.installCoinbaseWallet?.castHash;
  const { trackEvent } = useAnalytics();

  const shouldPresent = React.useCallback(
    () => activePromptKey === installCoinbaseWalletPromptKey,
    [activePromptKey],
  );

  React.useEffect(() => {
    if (activePromptKey === installCoinbaseWalletPromptKey) {
      trackEvent(AnalyticsEvent.ShowInstallCoinbaseWalletPrompt, {});
    }
  }, [activePromptKey, trackEvent]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'100%'}
      enableDynamicSizing={true}
      storageKey={installCoinbaseWalletPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={true}
    >
      <InstallCoinbaseWalletBottomSheet
        castHash={castHash}
        onClose={hideGlobalPrompt}
      />
    </Prompt>
  );
}

export function InstallCoinbaseWalletBottomSheet({
  castHash,
  onClose,
}: {
  castHash?: string;
  onClose: () => void;
}) {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();

  const appStoreUrl = useMemo(() => {
    if (Platform.OS === 'android') {
      return 'https://play.google.com/store/apps/details?id=org.toshi&hl=en_US&gl=US';
    } else {
      return 'https://apps.apple.com/us/app/coinbase-wallet-nfts-crypto/id1278383455';
    }
  }, []);

  const buttonText = useMemo(() => {
    if (Platform.OS === 'android') {
      return 'Download in Play Store';
    } else {
      return 'Open in  App Store';
    }
  }, []);

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pT2,
          t.pB0,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <Image
            source={CoinbaseWalletLogo}
            style={[t.roundedLg, t.w15, t.h15]}
          />
          <View
            style={[t.wFull, t.mT5, t.mB3, t.itemsCenter, t.flex, t.flexRow]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.texts.primary,
                t.fontBold,
                t.text2xl,
                t.mR2,
              ]}
            >
              Get Coinbase Wallet
            </Text>
          </View>
          <View style={[t.mB5]}>
            <Text style={[t.texts.tertiary, t.textBase]}>
              A wallet that supports Mobile Wallet Protocol is needed to
              interact with frames. We recommend using Coinbase Wallet.
            </Text>
          </View>
        </View>
        <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
          <TouchableOpacity
            style={[
              t.bgActionFrameTx,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
            ]}
            activeOpacity={0.75}
            onPress={() => {
              trackEvent(AnalyticsEvent.PressInstallCoinbaseWallet, {});
              Linking.openURL(appStoreUrl);
              onClose();
            }}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
              {buttonText}
            </Text>
          </TouchableOpacity>
          {!!castHash && (
            <TouchableOpacity
              style={[
                t.mT1,
                t.roundedLg,
                t.flex,
                t.flexRow,
                t.justifyCenter,
                t.itemsCenter,
                t.pY4,
                t.pX3,
                t.roundedLg,
              ]}
              activeOpacity={0.75}
              onPress={async () => {
                await Clipboard.setStringAsync(
                  `https://farcaster.xyz/~/conversations/${castHash}`,
                );

                Alert.alert('Cast link copied to your clipboard', undefined, [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                    },
                  },
                ]);
              }}
            >
              <Text style={[t.texts.tertiary, t.textBase]}>
                Continue on desktop
              </Text>
              <Octicons
                name="arrow-right"
                size={12}
                style={[
                  t.mL1,
                  t.texts.tertiary,
                  { paddingTop: Platform.OS === 'android' ? 4.5 : 1.5 },
                ]}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BottomSheetView>
  );
}

export { InstallCoinbaseWalletPrompt };
