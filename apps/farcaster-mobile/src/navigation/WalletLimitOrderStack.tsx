import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  WalletLimitOrderParams,
  WalletLimitOrderProvider,
} from 'farcaster-expo';
import React from 'react';
import { InteractionManager } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

import { DismissibleSheet } from '~/components/DismissibleSheet';
import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { WalletLimitOrderStackParamList, WalletStackParamList } from '~/types';

type WalletLimitOrderStackProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletLimitOrder'
>;

const Stack = createNativeStackNavigator<WalletLimitOrderStackParamList>();

export const WalletLimitOrderDismissScrollContext = React.createContext<
  SharedValue<number> | undefined
>(undefined);

export function WalletLimitOrderStack(props: WalletLimitOrderStackProps) {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const params: WalletLimitOrderParams = props.route.params;
  const goBack = useGoBack();
  const slideProgress = useSharedValue(1);
  const scrollOffset = useSharedValue(0);

  const initialRouteName: keyof WalletLimitOrderStackParamList =
    params?.initialToken
      ? 'WalletLimitOrderMain'
      : 'WalletLimitOrderSelectToken';

  const handleDismiss = React.useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      goBack();
    });
  }, [goBack]);

  return (
    <WalletLimitOrderProvider {...params}>
      <DismissibleSheet
        slideProgress={slideProgress}
        onDismiss={handleDismiss}
        scrollOffset={scrollOffset}
        skipEntryAnimation
        solidBackground
      >
        <WalletLimitOrderDismissScrollContext.Provider value={scrollOffset}>
          <Stack.Navigator
            screenOptions={{
              ...defaultStackScreenOptions,
              contentStyle: { backgroundColor: 'transparent' },
            }}
            initialRouteName={initialRouteName}
          >
            <Stack.Screen
              key="WalletLimitOrderMain"
              name="WalletLimitOrderMain"
              component={
                require('~/screens/WalletLimitOrder/WalletLimitOrderScreen')
                  .WalletLimitOrderScreen
              }
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              key="WalletLimitOrderSelectToken"
              name="WalletLimitOrderSelectToken"
              component={
                require('~/screens/WalletLimitOrder/WalletLimitOrderSelectTokenScreen')
                  .WalletLimitOrderSelectTokenScreen
              }
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              key="WalletLimitOrderSelectFundingToken"
              name="WalletLimitOrderSelectFundingToken"
              component={
                require('~/screens/WalletLimitOrder/WalletLimitOrderSelectFundingTokenScreen')
                  .WalletLimitOrderSelectFundingTokenScreen
              }
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </WalletLimitOrderDismissScrollContext.Provider>
      </DismissibleSheet>
    </WalletLimitOrderProvider>
  );
}
