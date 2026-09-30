import { setBadgeCountAsync } from 'expo-notifications';
import { useUnseen } from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAppState } from '~/hooks/useAppState';

type NotificationsIconBadgeControllerProps = {
  children: ReactNode;
};

const NotificationsIconBadgeController: FC<NotificationsIconBadgeControllerProps> =
  memo(({ children }) => {
    const { registerBadgeCountListener, refreshGlobalCountsStatus } =
      useUnseen();

    const appState = useAppState();
    const isActive = appState === 'active';
    const lastBadgeCountRef = useRef<number | undefined>(undefined);

    const effectCalledOnce = useRef<boolean>(false);
    useEffect(() => {
      if (!isActive) {
        return;
      }

      if (!effectCalledOnce.current) {
        // We skip the first call because cold start is handled in UnseenProvider
        // We only need to handle subsequent foreground events here
        effectCalledOnce.current = true;
        return;
      }

      // Delayed a bit so that the backend settles after our requests, as we are
      // subject to race conditions, e.g. getting home feed status as unseen
      // while fetching it concurrently
      const timeoutId = setTimeout(refreshGlobalCountsStatus, 2000);

      return () => {
        clearTimeout(timeoutId);
      };
    }, [refreshGlobalCountsStatus, isActive]);

    useEffect(() => {
      return registerBadgeCountListener({
        cbReferenceId: 'icon-badge',
        listener: ({ notificationsCount, inboxCount }) => {
          if (Platform.OS === 'android') {
            return;
          }

          const nextBadgeCount = notificationsCount + inboxCount;
          if (lastBadgeCountRef.current === nextBadgeCount) {
            return;
          }

          lastBadgeCountRef.current = nextBadgeCount;
          setBadgeCountAsync(nextBadgeCount).catch(() => undefined);
        },
      });
    }, [registerBadgeCountListener]);

    return <>{children}</>;
  });

export { NotificationsIconBadgeController };
