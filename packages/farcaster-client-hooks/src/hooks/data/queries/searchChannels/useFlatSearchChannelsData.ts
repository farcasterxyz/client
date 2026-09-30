import { InfiniteData } from '@tanstack/react-query';
import {
  ApiChannel,
  ApiSearchChannels200Response,
} from 'farcaster-client-data';
import { useMemo } from 'react';

export function useFlatSearchChannelsData({
  data,
}: {
  data: InfiniteData<ApiSearchChannels200Response> | undefined;
}): ApiChannel[] | undefined {
  return useMemo(() => {
    if (!data || data.pages.length === 0) {
      return undefined;
    } else {
      return data.pages.flatMap((page) => page.result.channels);
    }
  }, [data]);
}
