import { useCallback } from 'react';

import { buildMiniappsHostedManifestFetcher } from './buildMiniappsHostedManifestFetcher';

const useFetchMiniappsHostedManifest = () => {
  return useCallback(async ({ id }: { id: string }) => {
    const result = await buildMiniappsHostedManifestFetcher({ id })();

    return result;
  }, []);
};

export { useFetchMiniappsHostedManifest };
