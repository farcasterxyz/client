import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC } from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { useScreenFreezeOptions } from '~/hooks/navigation/useScreenFreezeOptions';
import { YourAppsHeaderRight } from '~/screens/AppsHome/YourAppsScreen';
import { AppsHomeStackParamList } from '~/types';

import { CommonScreens } from './CommonScreens';
const AppsHomeStack = createNativeStackNavigator<AppsHomeStackParamList>();

const AppsHomeStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const screenFreezeOptions = useScreenFreezeOptions();

  return (
    <AppsHomeStack.Navigator screenOptions={defaultStackScreenOptions}>
      <AppsHomeStack.Screen
        name="AppsHome"
        getComponent={() => require('~/screens/AppsHome').AppsHomeScreen}
        options={{
          headerShown: false,
          // Disabling screen freezes selectively on certain screens only for iOS.
          // This is to have a better state change between inbox and convos being marked unread.
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      <AppsHomeStack.Screen
        name="DiscoverApps"
        getComponent={() => require('~/screens/AppsHome').DiscoverAppsScreen}
        options={{ title: 'Discover Apps' }}
      />
      <AppsHomeStack.Screen
        name="AppsCategory"
        getComponent={() => require('~/screens/AppsHome').AppsCategoryScreen}
      />
      <AppsHomeStack.Screen
        name="YourApps"
        getComponent={() => require('~/screens/AppsHome').YourAppsScreen}
        options={{
          headerTitle: 'Installed Apps',
          headerRight: () => <YourAppsHeaderRight />,
        }}
      />
      <AppsHomeStack.Screen
        name="YourAppsSettings"
        getComponent={() =>
          require('~/screens/AppsHome').YourAppsSettingsScreen
        }
        options={{ title: 'Manage Your Apps' }}
      />
      <AppsHomeStack.Screen
        name="AppSettings"
        getComponent={() => require('~/screens/AppsHome').AppSettingsScreen}
        options={{ title: 'App Settings' }}
      />
      <AppsHomeStack.Screen
        name="Studio"
        getComponent={() => require('~/screens/Studio').StudioScreen}
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />
      {CommonScreens(AppsHomeStack)}
    </AppsHomeStack.Navigator>
  );
};
AppsHomeStackNavigator.displayName = 'AppsHomeStackNavigator';

export { AppsHomeStackNavigator };
