import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiTokenLink } from 'farcaster-client-data';
import {
  SwapTokensSelectSell,
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

type WalletSwapSelectSellScreenProps = NativeStackScreenProps<
  WalletSwapStackParamList,
  'WalletSwapSelectSell'
>;

export const WalletSwapSelectSell =
  buildScreen<WalletSwapSelectSellScreenProps>(
    {
      name: 'WalletSwapSelectSell',
      insetTop: Platform.OS === 'android',
      themeV2: true,
    },
    ({ navigation }) => {
      const { evmAddress } = useEmbeddedWallet();
      const geoRestricted = useWalletGeoRestricted();
      const {
        setSellToken,
        setAssetPickerType,
        platformType,
        attributedDomain,
        onSuccess,
        onError,
        onSwapExecuted,
      } = useSwapTokens();

      const onSelectToken = React.useCallback(
        (token: ApiTokenLink) => {
          setSellToken(token);
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
              isSell: true,
            });
          }
        },
        [
          navigation,
          setSellToken,
          platformType,
          attributedDomain,
          onSuccess,
          onError,
          onSwapExecuted,
        ],
      );

      const onSelectCash = React.useCallback(() => {
        setAssetPickerType('cash');
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
            isSell: true,
          });
        }
      }, [
        navigation,
        setAssetPickerType,
        platformType,
        attributedDomain,
        onSuccess,
        onError,
        onSwapExecuted,
      ]);

      if (geoRestricted) {
        return <WalletNotAvailableInRegion />;
      }

      if (!evmAddress) {
        return <WalletNotConnected source="wallet-swap" />;
      }

      return (
        <SwapTokensSelectSell
          onSelectToken={onSelectToken}
          onSelectCash={onSelectCash}
        />
      );
    },
  );
