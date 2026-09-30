import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToNotificationGroupMiniApps = () => {
  const navigate = useNavigate();

  return useCallback(
    ({
      groupId,
      openInNewTab = false,
    }: {
      groupId: string;
      openInNewTab?: boolean;
    }) => {
      return navigate({
        to: 'notificationGroupMiniApps',
        params: {},
        searchParams: { groupId },
        options: { openInNewTab },
      });
    },
    [navigate],
  );
};

export { useNavigateToNotificationGroupMiniApps };
