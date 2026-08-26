import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  SOLANA_NATIVE_ASSET_ADDRESS,
  USDC_ADDRESSES,
} from 'farcaster-expo';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useGlobalGate } from '~/contexts/GlobalGateProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';

import { MenuItems, SimpleMenu } from './MenuItem';

type DebugMenuScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugMenu'
>;

const DebugMenuScreen = buildScreen<DebugMenuScreenProps>(
  { name: 'DebugMenu' },
  () => {
    const t = useTheme();
    const push = usePush();
    const isAdmin = useIsAdmin();

    const { checkGate } = useGlobalGate();

    const menuItems: MenuItems = useMemo(() => {
      const items: MenuItems = [
        {
          name: 'Benchmarks',
          onPress: () => {
            push('DebugBenchmarks', {});
          },
        },
        {
          name: 'Cryptography',
          onPress: () => {
            push('DebugCryptography', {});
          },
        },
        {
          name: 'Errors',
          onPress: () => {
            push('DebugErrors', {});
          },
        },
        {
          name: 'Logs',
          onPress: () => {
            push('DebugLogs', {});
          },
        },
        {
          name: 'Feed',
          onPress: () => {
            push('DebugFeed', {});
          },
        },
        {
          name: 'Images',
          onPress: () => {
            push('DebugImages', {});
          },
        },
        {
          name: 'Navigate To',
          onPress: () => {
            push('DebugNavigateTo', {});
          },
        },
        {
          name: 'Navigation History',
          onPress: () => {
            push('DebugNavigationHistory', {});
          },
        },
        {
          name: 'Push Notifications',
          onPress: () => {
            push('DebugPushNotifications', {});
          },
        },
        {
          name: 'Release',
          onPress: () => {
            push('DebugRelease', {});
          },
        },
        {
          name: 'App Attest',
          onPress: () => {
            push('DebugAppAttest', {});
          },
        },
        {
          name: 'Storage',
          onPress: () => {
            push('DebugStorage', {});
          },
        },
        {
          name: 'Storefront',
          onPress: () => {
            push('DebugStorefront', {});
          },
        },
        {
          name: 'Sync Channel',
          onPress: () => {
            push('DebugSyncChannel', {});
          },
        },
        {
          name: 'Timeout History',
          onPress: () => {
            push('DebugTimeoutHistory', {});
          },
        },
        {
          name: 'Onboarding',
          onPress: () => {
            push('DebugNewOnboarding', {});
          },
        },
        {
          name: 'Deposit Bonuses',
          onPress: () => {
            push('DepositBonusesIntro', {});
          },
        },
        {
          name: 'Test Solana SOL Purchase',
          onPress: () => {
            push('CoinbaseCommerceCallback', {
              callbackUrl: '',
              queryParams: {
                network: 'solana',
                tokenAddress: SOLANA_NATIVE_ASSET_ADDRESS,
                onramp_result: 'success',
              },
            });
          },
        },
        {
          name: 'Test Base USDC Purchase',
          onPress: () => {
            push('CoinbaseCommerceCallback', {
              callbackUrl: '',
              queryParams: {
                network: 'base',
                tokenAddress: USDC_ADDRESSES.base!,
                onramp_result: 'success',
              },
            });
          },
        },
        {
          name: 'Test Base ETH Purchase',
          onPress: () => {
            push('CoinbaseCommerceCallback', {
              callbackUrl: '',
              queryParams: {
                network: 'base',
                tokenAddress: EIP7528_NATIVE_ASSET_ADDRESS,
                onramp_result: 'success',
              },
            });
          },
        },
        {
          name: 'Test Callback (No Query Params)',
          onPress: () => {
            push('CoinbaseCommerceCallback', {
              callbackUrl: '',
              queryParams: {
                onramp_result: 'success',
              },
            });
          },
        },
      ];

      if (isAdmin) {
        items.push(
          {
            name: 'In-app Purchases',
            onPress: () => {
              push('DebugInAppPurchases', {});
            },
          },
          {
            name: 'Connect Wallet',
            onPress: () => {
              push('DebugConnectWallet', {});
            },
          },
          {
            name: 'Scanner',
            onPress: () => {
              push('DebugCamera', {});
            },
          },
          {
            name: 'User Quality',
            onPress: () => {
              push('DebugUserQuality', {});
            },
          },
          {
            name: 'Admin Tools',
            onPress: () => {
              push('DebugAdminTools', {});
            },
          },
          {
            name: 'Embedded Wallet',
            onPress: () => {
              push('DebugEmbeddedWallet', {});
            },
          },
          {
            name: 'In-App Browser',
            onPress: () => {
              push('DebugInAppBrowserLauncher', {});
            },
          },
          {
            name: 'Advanced Protection',
            onPress: () => {
              push('DebugSecureMode', {});
            },
          },
          {
            name: 'Verifications',
            onPress: () => {
              push('DebugVerificationRemoval', {});
            },
          },
          {
            name: 'NUX Tasks',
            onPress: () => {
              push('DebugNuxTasks', {});
            },
          },
          {
            name: 'Collectible Casts',
            onPress: () => {
              push('DebugCollectibleCasts', {});
            },
          },
          {
            name: 'Reported Tokens',
            onPress: () => {
              push('AllReportedTokens', {});
            },
          },
        );
      }

      return items;
    }, [push, isAdmin]);

    const { value: mobileDebugMenuAccess } = checkGate(
      'mobile_debug_menu_access',
    );

    if (!mobileDebugMenuAccess) {
      return <View style={[t.hFull]} />;
    }

    return (
      <View style={[t.hFull]}>
        <ScrollView style={[t.flex1]} contentContainerStyle={{ padding: 12 }}>
          <SimpleMenu items={menuItems} />
        </ScrollView>
      </View>
    );
  },
);

DebugMenuScreen.displayName = 'DebugMenuScreen';

export { DebugMenuScreen };
