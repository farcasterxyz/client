import {
  usePrefetchNotificationsForTab,
  useUnseen,
} from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode } from 'react';

import { useUserAppContext } from './UserAppContextProvider';

type NotificationsInboxPrefetchProviderContextValue = {
  block: () => () => void;
};

const NotificationsInboxPrefetchProviderContext =
  React.createContext<NotificationsInboxPrefetchProviderContextValue>(
    {} as never,
  );

export const useNotificationsInboxPrefetch = () => {
  return React.useContext(NotificationsInboxPrefetchProviderContext);
};

type NotificationsInboxPrefetchProviderProps = {
  children: ReactNode;
};

const NotificationsInboxPrefetchProvider: FC<NotificationsInboxPrefetchProviderProps> =
  memo(({ children }) => {
    const [blockPrefetching, setBlockPrefetching] =
      React.useState<boolean>(false);

    const block = React.useCallback(() => {
      setBlockPrefetching(true);

      return () => {
        setBlockPrefetching(false);
      };
    }, []);

    const { registerNotificationsCountListener } = useUnseen();

    const { notificationTabs } = useUserAppContext();

    const prefetch = usePrefetchNotificationsForTab();

    const prefetchFirstNotificationsTab = React.useCallback(() => {
      if (
        typeof notificationTabs !== 'undefined' &&
        notificationTabs !== null &&
        notificationTabs.length !== 0 &&
        !blockPrefetching
      ) {
        prefetch(notificationTabs[0].id);
      }
    }, [blockPrefetching, notificationTabs, prefetch]);

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

    const contextValue = React.useMemo(() => ({ block }), [block]);

    return (
      <NotificationsInboxPrefetchProviderContext.Provider value={contextValue}>
        {children}
      </NotificationsInboxPrefetchProviderContext.Provider>
    );
  });

NotificationsInboxPrefetchProvider.displayName =
  'NotificationsInboxPrefetchProvider';

export { NotificationsInboxPrefetchProvider };
