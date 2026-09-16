import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getImageAspectRatio } from '../../../../utils';
import { buildImageAspectRatiosCacheKey } from './buildImageAspectRatiosCacheKey';

type ManuallySetDimensions = {
  width: number;
  height: number;
};

const activeRequests: Map<string, Promise<ManuallySetDimensions>> = new Map();

type ImageAspectRatiosCacheValue =
  | { width: number; height: number; aspectRatio: number }
  | undefined;

const useImageAspectRatiosCache = ({
  imageUrl,
  fetcher,
}: {
  imageUrl: string;
  fetcher: ({
    imageUrl,
  }: {
    imageUrl: string;
  }) => Promise<{ width: number; height: number }>;
}) => {
  const queryKey = useMemo(
    () => buildImageAspectRatiosCacheKey({ imageUrl }),
    [imageUrl],
  );

  const queryResult = useSuspenseQuery<ImageAspectRatiosCacheValue>({
    queryKey: queryKey,

    queryFn: async () => {
      const existingPromiseOrCacheRes =
        activeRequests.get(imageUrl) || fetcher({ imageUrl });

      activeRequests.set(imageUrl, existingPromiseOrCacheRes);

      const res = await existingPromiseOrCacheRes;

      const cache: ImageAspectRatiosCacheValue = {
        width: res.width,
        height: res.height,
        aspectRatio: getImageAspectRatio({ w: res.width, h: res.height }),
      };

      return cache;
    },

    staleTime: Infinity,
  });

  return useMemo(() => queryResult.data, [queryResult.data]);
};

export { useImageAspectRatiosCache };
