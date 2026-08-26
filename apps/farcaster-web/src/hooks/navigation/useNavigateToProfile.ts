import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import { getFeedSourceOn, useTrackEvent } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToProfile = () => {
  const navigate = useNavigate();
  const {
    defaultEventProps: { castHash, on },
  } = useTrackEvent();

  return useCallback(
    ({
      user,
      includeReason,
      openInNewTab = false,
    }: {
      user: ApiUser;
      includeReason?: ApiCastFeedIncludeReason['type'];
      openInNewTab?: boolean;
    }) => {
      const sourceOn = getFeedSourceOn(on);
      const searchParams = {
        ...(includeReason ? { includeReason } : {}),
        ...(sourceOn ? { sourceOn } : {}),
        ...(castHash ? { castHash } : {}),
      };
      const searchParamsProp =
        Object.keys(searchParams).length !== 0 ? { searchParams } : {};

      if (user.username) {
        return navigate({
          to: 'profileCastsWithUsername',
          params: { username: user.username },
          ...searchParamsProp,
          options: { openInNewTab },
        });
      }

      return navigate({
        to: 'profileCastsWithoutUsername',
        params: { fid: user.fid },
        ...searchParamsProp,
        options: { openInNewTab },
      });
    },
    [castHash, navigate, on],
  );
};

export { useNavigateToProfile };
