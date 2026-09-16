import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import * as React from 'react';

import { RootStackParamList } from '~/types';

import { AuthedDrawerNavigator } from './Drawer';

const Stack = createStackNavigator<RootStackParamList>();

const screenOptions = {
  headerShown: false,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
};

const videoScreenOptions = {
  presentation: 'transparentModal',
  gestureDirection: 'vertical',
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  transitionSpec: {
    open: { animation: 'timing', config: { duration: 150 } },
    close: { animation: 'timing', config: { duration: 150 } },
  },
} as const;

const drawerScreenOptions = { headerShown: false };

const getVideoScreenComponent = () =>
  require('~/screens/VideoScreen/VideoScreen').VideoScreen;

// We keep VideoScreen in a @react-navigation/stack instead of our normal
// @react-navigation/native-stack RootNativeStack because transparentModal is
// broken on the old arch. We can merge this back into RootNativeStack after we
// migrate to the new arch.
const RootStack: React.FC = React.memo(() => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name="Drawer"
      component={AuthedDrawerNavigator}
      options={drawerScreenOptions}
    />
    <Stack.Screen
      name="VideoScreen"
      getComponent={getVideoScreenComponent}
      options={videoScreenOptions}
    />
  </Stack.Navigator>
));

export { RootStack };
