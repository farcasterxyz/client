import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildChannelSettingsKey } from './buildChannelSettingsKey';

const useInvalidateChannelSettings = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ key }: { key: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildChannelSettingsKey({ key }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateChannelSettings };
