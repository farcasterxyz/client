import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC } from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { useScreenFreezeOptions } from '~/hooks/navigation/useScreenFreezeOptions';
import { WalletStackParamList } from '~/types';

import { CommonScreens } from './CommonScreens';

const WalletStack = createNativeStackNavigator<WalletStackParamList>();

const WalletStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const screenFreezeOptions = useScreenFreezeOptions();

  return (
    <WalletStack.Navigator screenOptions={defaultStackScreenOptions}>
      <WalletStack.Screen
        name="Wallet"
        getComponent={() =>
          require('~/screens/Wallet/WalletScreen').WalletScreen
        }
        options={{
          headerShown: false,
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      <WalletStack.Group
        screenOptions={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          animationDuration: 150,
        }}
      >
        <WalletStack.Screen
          name="WalletSendCollectible"
          component={
            require('~/screens/WalletSendCollectible/WalletSendCollectibleScreen')
              .WalletSendCollectibleScreen
          }
          options={{
            headerShown: false,
          }}
        />
      </WalletStack.Group>
      {CommonScreens(WalletStack)}
    </WalletStack.Navigator>
  );
};
WalletStackNavigator.displayName = 'WalletStackNavigator';

export { WalletStackNavigator };
