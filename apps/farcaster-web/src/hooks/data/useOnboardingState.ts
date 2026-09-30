import {
  useFarcasterApiClient,
  // eslint-disable-next-line no-restricted-imports
  useOnboardingState as useActualOnboardingState,
} from 'farcaster-client-hooks';
import { useEffect } from 'react';

import { useAuth } from '~/contexts/AuthProvider';

// Convenience wrapper for `useOnboardingState`
// which sets `enabled` based on whether we have a wallet yet.
const useOnboardingState = () => {
  const { apiClient } = useFarcasterApiClient();
  const { authToken } = useAuth();

  const response = useActualOnboardingState({ enabled: !!authToken });

  useEffect(() => {
    apiClient.updateOptions({ meta: { fid: response.result.state.user?.fid } });
  }, [apiClient, response.result.state.user?.fid]);

  return response;
};

export { useOnboardingState };
