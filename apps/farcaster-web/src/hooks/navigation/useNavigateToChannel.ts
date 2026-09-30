import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToChannel = () => {
  const navigate = useNavigate();

  return useCallback(
    ({
      channelKey,
      openInNewTab = false,
    }: {
      channelKey: string;
      openInNewTab?: boolean;
    }) => {
      return navigate({
        to: 'channel',
        params: { channelKey },
        options: { openInNewTab },
      });
    },
    [navigate],
  );
};

export { useNavigateToChannel };
