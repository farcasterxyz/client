import { ApiNotificationType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToNotificationGroupUsers = () => {
  const navigate = useNavigate();

  return useCallback(
    ({
      groupId,
      title,
      type,
      openInNewTab = false,
    }: {
      groupId: string;
      title?: string;
      type: ApiNotificationType;
      openInNewTab?: boolean;
    }) => {
      return navigate({
        to: 'notificationGroupUsers',
        params: { groupId, type },
        searchParams: { title },
        options: { openInNewTab: openInNewTab },
      });
    },
    [navigate],
  );
};

export { useNavigateToNotificationGroupUsers };
