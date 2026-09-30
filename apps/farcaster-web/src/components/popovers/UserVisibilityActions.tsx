import { CircleSlashIcon, MuteIcon, UnmuteIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  useMarkVisible,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';

import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { useMuteUser } from '~/contexts/MuteUserProvider';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

interface UserVisibilityActionsProps {
  user: ApiUser;
  source: 'cast' | 'profile';
}

const UserVisibilityActions: FC<UserVisibilityActionsProps> = memo(
  ({ user, source }) => {
    const currentUserFid = useCachedCurrentUser()?.fid;
    const { trackEvent } = useTrackEvent();
    const markVisible = useMarkVisible();
    const { muteUser } = useMuteUser();

    const wappedMuteUser = useCallback(async () => {
      await muteUser({
        targetFid: user.fid,
        username: resolveUsername({ username: user.username, fid: user.fid }),
        source,
      });
    }, [muteUser, user, source]);

    const warppedBlockUser = useCallback(async () => {
      await muteUser({
        targetFid: user.fid,
        username: resolveUsername({ username: user.username, fid: user.fid }),
        source,
        block: true,
      });
    }, [muteUser, user, source]);

    const unmuteUser = useCallback(() => {
      if (user.viewerContext?.blocking) {
        trackEvent(AnalyticsEvent.ClickUnblock);
      } else {
        trackEvent(AnalyticsEvent.ClickUnmute);
      }
      void markVisible({ targetFid: user.fid });
    }, [user, markVisible, trackEvent]);

    return (
      <>
        {currentUserFid !== user.fid && user.viewerContext?.invisible && (
          <DropdownMenuItem
            name={user.viewerContext.blocking ? 'Unblock user' : 'Unmute user'}
            icon={<UnmuteIcon size="small" />}
            onSelect={unmuteUser}
          />
        )}
        {currentUserFid !== user.fid && !user.viewerContext?.invisible && (
          <DropdownMenuItem
            name="Mute user"
            icon={<MuteIcon size="small" />}
            onSelect={wappedMuteUser}
          />
        )}
        {currentUserFid !== user.fid && !user.viewerContext?.invisible && (
          <DropdownMenuItem
            name="Block user"
            icon={<CircleSlashIcon size="small" />}
            onSelect={warppedBlockUser}
            destructive
          />
        )}
      </>
    );
  },
);
UserVisibilityActions.displayName = 'UserVisibilityActions';

export { UserVisibilityActions };
