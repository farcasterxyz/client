import { ApiGetOnchainAction200Response } from 'farcaster-client-data';
import { useRefreshOnchainAction } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { trackError } from '~/utils/ErrorUtils';

const interval = 3000;

const usePollForOnchainAction = () => {
  const refreshOnchainAction = useRefreshOnchainAction();

  return useCallback(
    ({ onchainActionId }: { onchainActionId: string }) => {
      return new Promise<ApiGetOnchainAction200Response['result']>(
        (resolve) => {
          const scheduleCheckForOnchainAction = () => {
            setTimeout(checkForOnchainAction, interval);
          };

          const checkForOnchainAction = async () => {
            try {
              const { onchainAction } = await refreshOnchainAction({
                onchainActionId,
              });

              if (onchainAction.state !== 'pending') {
                resolve({ onchainAction });
              } else {
                scheduleCheckForOnchainAction();
              }
            } catch (error) {
              trackError(error);
              scheduleCheckForOnchainAction();
            }
          };

          checkForOnchainAction();
        },
      );
    },
    [refreshOnchainAction],
  );
};

export { usePollForOnchainAction };
