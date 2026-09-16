import * as Notifications from 'expo-notifications';
import { NotificationBehavior } from 'expo-notifications';
import { UnreadDirectCastPushNotification } from 'farcaster-client-data';
import React, { FC, memo, ReactNode, useEffect, useRef } from 'react';

import { useFocusedScreen } from '~/contexts/FocusedScreenProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import {
  FocusedScreen,
  isDirectCastConversationParamsWithConversationId,
  isFocusedScreen,
  ScreenName,
} from '~/types';
import { getPushNotificationData } from '~/utils/PushNotificationUtils';

type InitPushNotificationsProps = {
  children: ReactNode;
};

const InitPushNotifications: FC<InitPushNotificationsProps> = memo(
  ({ children }) => {
    const isSignedIn = useIsSignedIn();
    const { focusedScreen: potentiallyStaleFocusedScreen } = useFocusedScreen();
    const focusedScreenRef = useRef<FocusedScreen<ScreenName> | undefined>(
      potentiallyStaleFocusedScreen,
    );
    focusedScreenRef.current = potentiallyStaleFocusedScreen;

    useEffect(() => {
      const showNotification = {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };

      const suppressNotification = {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };

      const handleUnreadDirectCasts = async ({
        data,
      }: {
        data: UnreadDirectCastPushNotification;
      }): Promise<NotificationBehavior> => {
        const shouldShow =
          // If the direct cast conversation screen isn't focused, we want to show the notification
          !isFocusedScreen(
            focusedScreenRef.current,
            'PlaintextDirectCastsConversation',
          ) ||
          // Type narrowing for the next check
          !isDirectCastConversationParamsWithConversationId(
            focusedScreenRef.current.params,
          ) ||
          // If the direct cast conversation screen is focused, but the user is viewing a different conversation, we want to show the notification
          data.conversationId !==
            focusedScreenRef.current.params.conversationId;

        return {
          shouldShowBanner: shouldShow,
          shouldShowList: shouldShow,
          shouldPlaySound: shouldShow,
          shouldSetBadge: shouldShow,
        };
      };

      Notifications.setNotificationHandler({
        handleNotification: async (
          notification: Notifications.Notification,
        ) => {
          // If the user isn't signed in, we shouldn't be receiving/showing push notifications
          // Also if a notification has no content (e.g. a badge update), we don't want to display anything to the user.
          if (!isSignedIn || !notification.request.content.title) {
            return suppressNotification;
          }

          const data = getPushNotificationData(notification);

          switch (data?.type) {
            case 'unread-direct-casts':
              return handleUnreadDirectCasts({ data });
            default:
              return showNotification;
          }
        },
      });
    }, [isSignedIn]);

    return <>{children}</>;
  },
);

InitPushNotifications.displayName = 'InitPushNotifications';

export { InitPushNotifications };
