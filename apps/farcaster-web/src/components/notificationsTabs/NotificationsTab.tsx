import { ApiNotificationGroup } from 'farcaster-client-data';
import {
  usePurgedNotificationsForTab,
  useRefreshNotificationsForTabFirstPage,
  useSetLastCheckedTimestamp,
  useUnseen,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import { FC, useCallback, useEffect, useMemo } from 'react';

import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { NotificationGroup } from '~/components/notifications/NotificationGroup';
import { useCameFromPopped } from '~/contexts/PopStateProvider';
import { useSetOnCurrentNavLinkClicked } from '~/hooks/data/useSetOnCurrentNavLinkClicked';
import { notificationGroupKeyExtractor } from '~/utils/keyExtractorUtils';

interface NotificationsTabProps {
  tab: string;
  isLinkedToUnseen: boolean;
}

const NotificationsTab: FC<NotificationsTabProps> = ({
  tab,
  isLinkedToUnseen,
}) => {
  const wasPopped = useCameFromPopped();

  const { data, onEndReached, isFetchingNextPage, refetch } =
    usePurgedNotificationsForTab({ tab, wasPopped });
  const { resetNotificationsCount, resetNotificationTabUnseenStatus } =
    useUnseen();
  const setLastCheckedTimestamp = useSetLastCheckedTimestamp();

  // Clear tab-specific unseen on mount. Unfortunately, there is no simple way to know if this tab has
  // unseen status enabled as the unseen status can come much later async. Therefore we
  // hardcode the tabs for which unseen is enabled on the backend to skip calls for other tabs.
  useEffect(() => {
    if (tab === 'channels' || tab === 'apps') {
      resetNotificationTabUnseenStatus(tab);
    }

    if (isLinkedToUnseen) {
      setLastCheckedTimestamp();
    }
  }, [
    isLinkedToUnseen,
    resetNotificationTabUnseenStatus,
    setLastCheckedTimestamp,
    tab,
  ]);

  const refreshFirstPage = useRefreshNotificationsForTabFirstPage(tab, refetch);
  const resetNotificationsCountAndRefreshFirstPage = useCallback(async () => {
    await refreshFirstPage();
    resetNotificationsCount();
    setLastCheckedTimestamp();
  }, [refreshFirstPage, resetNotificationsCount, setLastCheckedTimestamp]);

  // This only work on the main notification tab to which the sidebar nav item is linked
  useSetOnCurrentNavLinkClicked(resetNotificationsCountAndRefreshFirstPage);

  const groups = useMemo(
    () =>
      uniqBy(
        data?.pages.flatMap((page) => page.result.notifications) || [],
        (group) => group.id,
      ),
    [data],
  );

  return (
    <FlatList
      data={groups}
      renderItem={renderItem}
      keyExtractor={notificationGroupKeyExtractor}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      emptyView={<DefaultEmptyListView message="No notifications yet." />}
    />
  );
};

const renderItem = ({ item }: { item: ApiNotificationGroup }) => {
  return <NotificationGroup notificationGroup={item} />;
};

NotificationsTab.displayName = 'NotificationsTab';

export { NotificationsTab };
