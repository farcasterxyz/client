import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

function useRecordArticleSeen() {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ articleId }: { articleId: string }) => {
      await apiClient.recordArticleSeen({ articleId });
    },
    [apiClient],
  );
}

export { useRecordArticleSeen };
