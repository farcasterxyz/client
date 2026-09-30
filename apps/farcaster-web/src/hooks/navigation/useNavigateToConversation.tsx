import {
  ApiCastFeedIncludeReason,
  getCastHashPrefix,
} from 'farcaster-client-data';
import { getFeedSourceOn, useTrackEvent } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToConversation = () => {
  const navigate = useNavigate();
  const {
    defaultEventProps: { on },
  } = useTrackEvent();

  return useCallback(
    ({
      castHash,
      authorUsername,
      includeReason,
      openInNewTab = false,
    }: {
      castHash: string;
      authorUsername?: string;
      includeReason?: ApiCastFeedIncludeReason['type'];
      openInNewTab?: boolean;
    }) => {
      const sourceOn = getFeedSourceOn(on);
      const searchParams = {
        ...(includeReason ? { includeReason } : {}),
        ...(sourceOn ? { sourceOn } : {}),
      };

      if (authorUsername) {
        return navigate({
          to: 'conversationWithUsername',
          params: {
            castHashPrefix: getCastHashPrefix({ castHash }),
            username: authorUsername,
          },
          ...(Object.keys(searchParams).length > 0 ? { searchParams } : {}),
          options: { openInNewTab },
        });
      }

      return navigate({
        to: 'conversationWithoutUsername',
        params: { castHash },
        ...(Object.keys(searchParams).length > 0 ? { searchParams } : {}),
        options: { openInNewTab },
      });
    },
    [navigate, on],
  );
};

export { useNavigateToConversation };
