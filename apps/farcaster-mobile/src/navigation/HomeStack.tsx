import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC } from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { useScreenFreezeOptions } from '~/hooks/navigation/useScreenFreezeOptions';
import { HomeStackParamList } from '~/types';

import { CommonScreens } from './CommonScreens';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const screenFreezeOptions = useScreenFreezeOptions();

  return (
    <HomeStack.Navigator screenOptions={defaultStackScreenOptions}>
      <HomeStack.Screen
        name="Feed"
        getComponent={() => require('~/screens/Feed').HomeScreen}
        options={{
          headerShown: false,
          // Disabling screen freezes selectively on certain screens only for iOS.
          // This is to have a better state change between thread view updates on casts and
          // feeds.
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      {CommonScreens(HomeStack)}
    </HomeStack.Navigator>
  );
};

HomeStackNavigator.displayName = 'HomeStackNavigator';

export { HomeStackNavigator };
