import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { base64ToBase64Url } from '../../../utils';

const useDeleteSyncChannel = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      base64PublicKey,
      base64Signature,
      channelId,
    }: {
      base64PublicKey: string;
      base64Signature: string;
      channelId: string;
    }) => {
      apiClient.deleteSyncChannel({
        base64PublicKey: base64ToBase64Url(base64PublicKey),
        base64Signature: base64ToBase64Url(base64Signature),
        channelId,
      });
    },
    [apiClient],
  );
};

export { useDeleteSyncChannel };
