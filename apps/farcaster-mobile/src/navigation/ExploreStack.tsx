import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC } from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { ExploreStackParamList } from '~/types';

import { CommonScreens } from './CommonScreens';

const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();

const ExploreStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();

  return (
    <ExploreStack.Navigator screenOptions={defaultStackScreenOptions}>
      <ExploreStack.Screen
        name="Explore"
        getComponent={() => require('~/screens/Explore').ExploreScreen}
        options={{ headerShown: false }}
      />
      {CommonScreens(ExploreStack)}
    </ExploreStack.Navigator>
  );
};

ExploreStackNavigator.displayName = 'ExploreStackNavigator';

export { ExploreStackNavigator };
