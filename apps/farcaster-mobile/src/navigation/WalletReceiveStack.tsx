import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';

const Stack = createNativeStackNavigator();

export function WalletReceiveStack() {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
      <Stack.Screen
        key="WalletReceive"
        name="WalletReceive"
        component={
          require('~/screens/WalletReceive/WalletReceiveScreen')
            .WalletReceiveScreen
        }
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        key="WalletReceiveOnChain"
        name="WalletReceiveOnChain"
        component={
          require('~/screens/WalletReceive/WalletReceiveOnChainScreen')
            .WalletReceiveOnChainScreen
        }
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
