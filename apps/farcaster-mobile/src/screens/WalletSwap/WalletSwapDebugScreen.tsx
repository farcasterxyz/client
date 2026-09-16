import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SwapTokensDebug,
  useEmbeddedWallet,
  useWalletGeoRestricted,
  WalletNotAvailableInRegion,
  WalletNotConnected,
} from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletSwapStackParamList } from '~/types';

type WalletSwapDebugScreenProps = NativeStackScreenProps<
  WalletSwapStackParamList,
  'WalletSwapDebug'
>;

export const WalletSwapDebug = buildScreen<WalletSwapDebugScreenProps>(
  {
    name: 'WalletSwapDebug',
    insetTop: Platform.OS === 'android',
    insetBottom: true,
    themeV2: true,
  },
  () => {
    const { evmAddress } = useEmbeddedWallet();
    const geoRestricted = useWalletGeoRestricted();

    if (geoRestricted) {
      return <WalletNotAvailableInRegion />;
    }

    if (!evmAddress) {
      return <WalletNotConnected source="wallet-swap" />;
    }

    return <SwapTokensDebug />;
  },
);
