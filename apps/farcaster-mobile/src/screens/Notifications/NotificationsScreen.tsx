import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

import { buildScreen } from '~/components/Screen';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { NotificationsScreenContent } from '~/screens/Notifications/NotificationsScreenContent';
import { NotificationsStackParamList } from '~/types';

type NotificationsScreenProps = NativeStackScreenProps<
  NotificationsStackParamList,
  'Notifications'
>;

const NotificationsScreen = buildScreen<NotificationsScreenProps>(
  { name: 'Notifications', insetTop: true },
  () => {
    const { notificationTabs } = useUserAppContext();

    if (!notificationTabs) {
      return null;
    }

    return <NotificationsScreenContent tabs={notificationTabs} />;
  },
);

NotificationsScreen.displayName = 'NotificationsScreen';

export { NotificationsScreen };
