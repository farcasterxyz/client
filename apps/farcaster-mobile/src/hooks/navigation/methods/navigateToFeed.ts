import { useCallback } from 'react';

import { useUnmediatedNavigate } from './navigate';

export function useUnmediatedNavigateToFeed(): (feedKey: string) => void {
  const navigate = useUnmediatedNavigate();

  return useCallback(
    (channelKey: string) => {
      navigate('Channel', { channelKey });
    },
    [navigate],
  );
}
