import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToNotificationChannelRoleInvites = () => {
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
        to: 'notificationGroupChannelRoleInvites',
        params: {},
        searchParams: { groupId },
        options: { openInNewTab },
      });
    },
    [navigate],
  );
};

export { useNavigateToNotificationChannelRoleInvites };
