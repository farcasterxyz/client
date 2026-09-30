import { ApiNotification } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToNotificationGroupCasts = () => {
  const navigate = useNavigate();

  return useCallback(
    ({
      groupId,
      type,
    }: {
      groupId: string;
      type: Extract<
        ApiNotification['type'],
        | 'new-cast'
        | 'new-cast-in-channel'
        | 'dormant-user-new-cast'
        | 'unfollowed-cast-reply'
        | 'trending-cast'
        | 'channel-pinned-cast'
      >;
    }) => {
      return navigate({
        to: 'notificationGroupCasts',
        params: { type },
        searchParams: { groupId },
      });
    },
    [navigate],
  );
};

export { useNavigateToNotificationGroupCasts };
