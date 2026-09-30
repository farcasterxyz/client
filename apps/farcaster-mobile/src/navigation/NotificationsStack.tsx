import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC } from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { useScreenFreezeOptions } from '~/hooks/navigation/useScreenFreezeOptions';
import { NotificationsStackParamList } from '~/types';

import { CommonScreens } from './CommonScreens';

const NotificationsStack =
  createNativeStackNavigator<NotificationsStackParamList>();

const NotificationsStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const screenFreezeOptions = useScreenFreezeOptions();

  return (
    <NotificationsStack.Navigator screenOptions={defaultStackScreenOptions}>
      <NotificationsStack.Screen
        name="Notifications"
        getComponent={() =>
          require('~/screens/Notifications').NotificationsScreen
        }
        options={{
          headerShown: false,
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      <NotificationsStack.Screen
        name="NotificationsInGroup"
        getComponent={() =>
          require('~/screens/NotificationsInGroup').NotificationsInGroupScreen
        }
        options={{
          headerTitle: '', // We set this imperatively in the screen via `setOptions`
        }}
      />
      <NotificationsStack.Screen
        name="NotificationActorsInGroup"
        getComponent={() =>
          require('~/screens/NotificationActorsInGroup')
            .NotificationActorsInGroupScreen
        }
        options={{
          headerTitle: '', // We set this imperatively in the screen via `setOptions`
        }}
      />
      {CommonScreens(NotificationsStack)}
    </NotificationsStack.Navigator>
  );
};

NotificationsStackNavigator.displayName = 'NotificationsStackNavigator';

export { NotificationsStackNavigator };
