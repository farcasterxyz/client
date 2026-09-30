import { ResetKeyTransportError } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { dataStore, keyStore } from '~/utils/cryptographyUtils';
import { trackError } from '~/utils/errorUtils';

const useClearKeyTransport = () => {
  return useCallback(async () => {
    try {
      const crypto = await import('farcaster-cryptography');

      const transport = await crypto.getKeyTransport({ keyStore, dataStore });
      transport.resetKeyTransport();
    } catch (error) {
      trackError(new ResetKeyTransportError({ error }));
    }
  }, []);
};

export { useClearKeyTransport };
