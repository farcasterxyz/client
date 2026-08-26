// eslint-disable-next-line no-restricted-imports
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { ApiJsonFarcasterSignature } from 'farcaster-client-data';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';

export const useSilentSignManifestMutation = (
  options?: UseMutationOptions<ApiJsonFarcasterSignature, Error, string>,
) => {
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();

  return useMutation({
    mutationFn: (domain: string, timeoutMs: number = 750) => {
      return new Promise<ApiJsonFarcasterSignature>((resolve, reject) => {
        if (!embeddedWalletBridge) {
          reject(new Error('Embedded wallet bridge not found'));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Failed to sign manifest'));
        }, timeoutMs);

        // If wallet is locked, `silentlySignManifest` will throw an error, however it does at times timeout
        // so we need to handle both cases.
        embeddedWalletBridge
          .silentlySignManifest({ domain })
          .then(resolve)
          .catch(reject)
          .finally(() => {
            clearTimeout(timeoutId);
          });
      });
    },
    ...options,
  });
};
