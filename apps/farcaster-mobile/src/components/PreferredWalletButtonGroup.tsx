import { Ionicons, Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useWalletGeoRestricted,
  WALLET_CONFIGS,
  WalletType,
  WalletTypeWithoutCoinbase,
} from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';

import WarpcastAppIcon from '~/assets/images/icon-ios.png';
import RainbowWalletAppIcon from '~/assets/images/RainbowWalletAppIcon.webp';
import {
  BottomSheetContentContainer,
  BottomSheetHeader,
} from '~/components/BottomSheet';
import { ButtonGroup } from '~/components/ButtonGroup';
import { ButtonV2 } from '~/components/ButtonV2';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export type PreferredWalletButtonGroupProps = {
  preferredWallet: WalletTypeWithoutCoinbase | undefined;
  onSelect: (type: WalletTypeWithoutCoinbase) => void;
};

export function PreferredWalletButtonGroup({
  preferredWallet,
  onSelect,
}: PreferredWalletButtonGroupProps) {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const geoRestricted = useWalletGeoRestricted();

  const [walletInstallStatus, setWalletInstallStatus] = useState<
    Record<WalletTypeWithoutCoinbase, boolean | null>
  >({
    rainbow: null,
    warpcast: true,
  });

  useEffect(() => {
    const checkWallets = async () => {
      const rainbowInstalled = await checkIfInstalled('rainbow');

      setWalletInstallStatus({
        rainbow: rainbowInstalled,
        warpcast: true,
      });

      if (!rainbowInstalled) {
        trackEvent(AnalyticsEvent.ShowInstallWalletPrompt, {
          rainbowInstalled,
        });
      }
    };
    checkWallets();
  }, [trackEvent]);

  const handleWalletPress = useCallback(
    async (walletType: WalletTypeWithoutCoinbase) => {
      const config = WALLET_CONFIGS[walletType];
      const isInstalled = walletInstallStatus[walletType];

      if (!isInstalled && config.type !== 'warpcast') {
        const installUrl =
          Platform.OS === 'android'
            ? config.installUrls?.android
            : config.installUrls?.ios;

        if (installUrl) {
          await Linking.openURL(installUrl);
          trackEvent(AnalyticsEvent.ClickAppStore, { name: config.name });
        }
        return;
      }

      if (preferredWallet === walletType) {
        return;
      }

      try {
        trackEvent(AnalyticsEvent.ClickSetPreferredWallet, {
          name: config.name,
        });

        onSelect(walletType);
      } catch (e) {
        trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
          name: config.name,
          action: 'initialize_error',
          error: (e as Error).toString(),
        });
      }
    },
    [onSelect, preferredWallet, trackEvent, walletInstallStatus],
  );

  if (Object.values(walletInstallStatus).some((status) => status === null)) {
    return <LoadingIndicator />;
  }

  const getWalletIcon = (walletType: WalletTypeWithoutCoinbase) => {
    switch (walletType) {
      case 'rainbow':
        return RainbowWalletAppIcon;
      case 'warpcast':
        return WarpcastAppIcon;
    }
  };

  const availableWallets: WalletTypeWithoutCoinbase[] = (
    Object.keys(WALLET_CONFIGS) as WalletType[]
  ).filter((wallet) => {
    if (wallet === 'coinbase') {
      return false;
    }
    if (wallet === 'warpcast') {
      return !geoRestricted;
    }
    return true;
  }) as WalletTypeWithoutCoinbase[];

  return (
    <ButtonGroup
      options={availableWallets.map((wallet: WalletTypeWithoutCoinbase) => {
        const config = WALLET_CONFIGS[wallet];
        const isInstalled = walletInstallStatus[wallet];

        return {
          label: config.name,
          iconLeft: ({ size }) => (
            <Image
              source={getWalletIcon(wallet)}
              style={[{ height: size, width: size }, t.roundedFull]}
            />
          ),
          icon: ({ size }) =>
            !isInstalled && wallet !== 'warpcast' ? (
              <InstallWallet />
            ) : preferredWallet === wallet ? (
              <Ionicons
                name="checkmark-outline"
                size={size}
                color={t.colors.text.primary}
              />
            ) : null,
          onPress: () => handleWalletPress(wallet),
        };
      })}
    />
  );
}

function InstallWallet() {
  const t = useTheme();

  return (
    <View
      style={[
        t.bgElevated,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.pY1,
        t.pX2,
      ]}
    >
      <Text2 style={[t.mR2, t.texts.tertiary]}>Install</Text2>
      <Octicons style={[t.texts.tertiary]} name="link-external" size={16} />
    </View>
  );
}

export function RelaunchWarpcastBottomSheet({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  const t = useTheme();

  return (
    <BottomSheetContentContainer>
      <BottomSheetHeader
        Icon={<Octicons name="sync" size={24} color="#8565cb" />}
        iconBgColor="purple"
        title="Relaunch Farcaster"
      />

      <View style={[t.mB5]}>
        <Text2>To apply your changes, please close and reopen the app.</Text2>
      </View>

      <ButtonV2 title="Continue" onPress={onConfirm} />
    </BottomSheetContentContainer>
  );
}

const checkIfInstalled = async (wallet: WalletTypeWithoutCoinbase) => {
  if (wallet === 'rainbow') {
    return await Linking.canOpenURL('rainbow://');
  } else if (wallet === 'warpcast') {
    return true;
  }
  return false;
};
