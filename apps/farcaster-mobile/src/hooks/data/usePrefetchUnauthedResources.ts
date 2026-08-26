import {
  usePrefetchClientConfig,
  usePrefetchProductCatalog,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

const usePrefetchUnauthedResources = () => {
  const prefetchClientConfig = usePrefetchClientConfig();
  const prefetchProductCatalog = usePrefetchProductCatalog();

  return useCallback(async () => {
    await Promise.all([prefetchClientConfig(), prefetchProductCatalog()]);
  }, [prefetchClientConfig, prefetchProductCatalog]);
};

export { usePrefetchUnauthedResources };
