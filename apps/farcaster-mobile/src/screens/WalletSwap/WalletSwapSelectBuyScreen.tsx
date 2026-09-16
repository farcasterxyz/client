import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiTokenLink } from 'farcaster-client-data';
import {
  ExploreTokens,
  useEmbeddedWallet,
  useSwapTokens,
  useWalletGeoRestricted,
  WalletNotAvailableInRegion,
  WalletNotConnected,
} from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletSwapStackParamList } from '~/types';

type WalletSwapSelectBuyScreenProps = NativeStackScreenProps<
  WalletSwapStackParamList,
  'WalletSwapSelectBuy'
>;

export const WalletSwapSelectBuy = buildScreen<WalletSwapSelectBuyScreenProps>(
  {
    name: 'WalletSwapSelectBuy',
    insetTop: Platform.OS === 'android',
    themeV2: true,
  },
  ({ navigation }) => {
    const { evmAddress } = useEmbeddedWallet();
    const {
      setBuyToken,
      platformType,
      attributedDomain,
      onSuccess,
      onError,
      onSwapExecuted,
    } = useSwapTokens();
    const geoRestricted = useWalletGeoRestricted();

    const onSelectToken = React.useCallback(
      (token: ApiTokenLink) => {
        setBuyToken(token);
        const state = navigation.getState();
        const canGoBackInStack = state ? state.index > 0 : false;
        if (canGoBackInStack) {
          navigation.goBack();
        } else {
          navigation.replace('WalletSwap', {
            platformType,
            attributedDomain,
            onSuccess,
            onError,
            onSwapExecuted,
            isBuy: true,
          });
        }
      },
      [
        navigation,
        setBuyToken,
        platformType,
        attributedDomain,
        onSuccess,
        onError,
        onSwapExecuted,
      ],
    );

    if (geoRestricted) {
      return <WalletNotAvailableInRegion />;
    }

    if (!evmAddress) {
      return <WalletNotConnected source="wallet-swap" />;
    }

    return <ExploreTokens onSelectToken={onSelectToken} />;
  },
);
