import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SwapTokens,
  useEmbeddedWallet,
  useWalletGeoRestricted,
  WalletNotAvailableInRegion,
  WalletNotConnected,
} from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletSwapStackParamList } from '~/types';

type WalletSwapScreenProps = NativeStackScreenProps<
  WalletSwapStackParamList,
  'WalletSwap'
>;

export const WalletSwap = buildScreen<WalletSwapScreenProps>(
  {
    name: 'WalletSwap',
    insetTop: Platform.OS === 'android',
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

    return <SwapTokens />;
  },
);
