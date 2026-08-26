import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { getFeedSourceOn, useTrackEvent } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { UserScreenInitialTab } from '~/types';

import { usePush } from './usePush';
import { useReplace } from './useReplace';

const usePushToUserProfile = () => {
  const push = usePush();
  const {
    defaultEventProps: { castHash, on },
  } = useTrackEvent();

  return useCallback(
    ({
      fid,
      initialTab,
      profileOpenIncludeReason,
    }: {
      fid: number;
      initialTab?: UserScreenInitialTab;
      profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
    }) => {
      const sourceOn = getFeedSourceOn(on);

      return push('UserV2', {
        fid,
        initialTab,
        ...(profileOpenIncludeReason
          ? { profileOpenIncludeReason: profileOpenIncludeReason }
          : {}),
        ...(castHash ? { profileOpenCastHash: castHash } : {}),
        ...(sourceOn ? { sourceOn } : {}),
      });
    },
    [castHash, on, push],
  );
};

export const useReplaceToUserProfile = () => {
  const replace = useReplace();

  return useCallback(
    ({ fid }: { fid: number }) => {
      return replace('UserV2', {
        fid: fid,
      });
    },
    [replace],
  );
};

const usePushToUserProfileWithUsername = () => {
  const push = usePush();
  const {
    defaultEventProps: { castHash, on },
  } = useTrackEvent();

  return useCallback(
    ({ username }: { username: string }) => {
      const sourceOn = getFeedSourceOn(on);

      return push('DeeplinkOnlyUserV2', {
        username: username,
        ...(castHash ? { profileOpenCastHash: castHash } : {}),
        ...(sourceOn ? { sourceOn } : {}),
      });
    },
    [castHash, on, push],
  );
};

export { usePushToUserProfile, usePushToUserProfileWithUsername };
