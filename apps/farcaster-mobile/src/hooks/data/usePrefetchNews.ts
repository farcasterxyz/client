import { Image } from 'expo-image';
import {
  NewsCache,
  usePrefetchNews as usePrefechNewsInternal,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { imageRequestHeaders } from '~/constants/Images';

function usePrefetchNews() {
  const prefetchNews = usePrefechNewsInternal();

  const onResponse = useCallback(({ cache }: { cache: NewsCache }) => {
    if (typeof cache === 'undefined') {
      return;
    }

    const imagesToPrefetch = cache.news.map((article) => article.imageUrl);

    Image.prefetch(imagesToPrefetch, {
      cachePolicy: 'memory-disk',
      headers: imageRequestHeaders,
    });
  }, []);

  return useCallback(async () => {
    await prefetchNews({ onResponse });
  }, [onResponse, prefetchNews]);
}

export { usePrefetchNews };
