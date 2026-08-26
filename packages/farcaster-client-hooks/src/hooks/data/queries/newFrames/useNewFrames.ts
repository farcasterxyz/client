import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';
import { useCallback, useState } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../../utils';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedFrame } from '../frameDetails';
import {
  buildNewFramesFetcher,
  NewFramesMetadata,
} from './buildNewFramesFetcher';
import { buildNewFramesKey } from './buildNewFramesKey';

export function useNewFrames() {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGlobalCache = useBatchMergeIntoGloballyCachedFrame();
  const [metadata, setMetadata] = useState<NewFramesMetadata>({});

  const onMetadata = useCallback(
    (data: NewFramesMetadata) => {
      if (metadata.description) {
        return;
      }
      setMetadata(data);
    },
    [metadata],
  );

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildNewFramesKey(),
    queryFn: buildNewFramesFetcher({
      apiClient,
      params: { limit: 50 },
      batchMergeIntoGlobalCache,
      onMetadata,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: frameKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, {
    flatData,
    onEndReached,
    description: metadata.description,
  });
}
