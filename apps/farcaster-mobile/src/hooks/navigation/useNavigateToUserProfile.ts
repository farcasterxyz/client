import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { getFeedSourceOn, useTrackEvent } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useNavigate } from './useNavigate';

const useNavigateToUserProfile = () => {
  const navigate = useNavigate();
  const {
    defaultEventProps: { castHash, on },
  } = useTrackEvent();

  return useCallback(
    ({
      fid,
      profileOpenIncludeReason,
    }: {
      fid: number;
      profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
    }) => {
      const sourceOn = getFeedSourceOn(on);

      return navigate('UserV2', {
        fid: fid,
        ...(profileOpenIncludeReason
          ? { profileOpenIncludeReason: profileOpenIncludeReason }
          : {}),
        ...(castHash ? { profileOpenCastHash: castHash } : {}),
        ...(sourceOn ? { sourceOn } : {}),
      });
    },
    [castHash, navigate, on],
  );
};

export { useNavigateToUserProfile };
