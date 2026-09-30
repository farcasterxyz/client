import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { SwapTokensProvider, WalletSwapParams } from 'farcaster-expo';
import React from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { WalletSwapStackParamList } from '~/types';

type WalletSwapScreenProps = NativeStackScreenProps<
  WalletSwapStackParamList,
  'WalletSwap'
>;

const Stack = createNativeStackNavigator();

export function WalletSwapStack(props: WalletSwapScreenProps) {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const params: WalletSwapParams = props.route.params || {};

  const initialRouteName: keyof WalletSwapStackParamList =
    params.isBuy && !params.swapIntent?.buy?.address
      ? 'WalletSwapSelectBuy'
      : params.isSell && !params.swapIntent?.sell?.address
        ? 'WalletSwapSelectSell'
        : 'WalletSwap';

  return (
    <SwapTokensProvider {...params}>
      <Stack.Navigator
        screenOptions={defaultStackScreenOptions}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen
          key="WalletSwap"
          name="WalletSwap"
          component={
            require('~/screens/WalletSwap/WalletSwapScreen').WalletSwap
          }
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          key="WalletSwapSelectSell"
          name="WalletSwapSelectSell"
          component={
            require('~/screens/WalletSwap/WalletSwapSelectSellScreen')
              .WalletSwapSelectSell
          }
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          key="WalletSwapSelectBuy"
          name="WalletSwapSelectBuy"
          component={
            require('~/screens/WalletSwap/WalletSwapSelectBuyScreen')
              .WalletSwapSelectBuy
          }
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          key="WalletSwapDebug"
          name="WalletSwapDebug"
          component={
            require('~/screens/WalletSwap/WalletSwapDebugScreen')
              .WalletSwapDebug
          }
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </SwapTokensProvider>
  );
}
