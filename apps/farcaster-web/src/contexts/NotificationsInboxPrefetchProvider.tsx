import {
  usePrefetchNotificationsForTab,
  useUnseen,
} from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode } from 'react';

import { useUserAppContext } from './UserAppContextProvider';

type NotificationsInboxPrefetchProviderProps = {
  children: ReactNode;
};

const NotificationsInboxPrefetchProvider: FC<NotificationsInboxPrefetchProviderProps> =
  memo(({ children }) => {
    const { registerNotificationsCountListener } = useUnseen();

    const { notificationTabs } = useUserAppContext();

    const prefetch = usePrefetchNotificationsForTab();

    const prefetchFirstNotificationsTab = React.useCallback(() => {
      if (
        typeof notificationTabs !== 'undefined' &&
        notificationTabs !== null &&
        notificationTabs.length !== 0
      ) {
        prefetch(notificationTabs[0].id);
      }
    }, [notificationTabs, prefetch]);

    React.useEffect(() => {
      prefetchFirstNotificationsTab();
    }, [prefetchFirstNotificationsTab]);

    React.useEffect(() => {
      return registerNotificationsCountListener({
        cbReferenceId: 'inbox-prefetch',
        listener: ({ notificationsCount }) => {
          if (notificationsCount !== 0) {
            prefetchFirstNotificationsTab();
          }
        },
      });
    }, [prefetchFirstNotificationsTab, registerNotificationsCountListener]);

    return <>{children}</>;
  });

NotificationsInboxPrefetchProvider.displayName =
  'NotificationsInboxPrefetchProvider';

export { NotificationsInboxPrefetchProvider };
