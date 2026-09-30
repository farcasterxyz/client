import { isFarcasterApiError } from 'farcaster-client-data';

import { logError } from '~/utils/logUtils';

const getErrorDescription = (error: unknown) => {
  if (isFarcasterApiError(error)) {
    if (error.isNetworkError) {
      return 'Could not reach Farcaster. Check your connection.';
    }
    if (error.hasTimedOut) {
      return 'Receiving data from Farcaster is taking too long. Check your connection.';
    }

    return 'Error retrieving data. Please try again.';
  }

  return 'We encountered an unexpected error.';
};

const trackError = (error: unknown) => {
  if (import.meta.env.MODE === 'development') {
    logError(error);
  }
};

export { getErrorDescription, trackError };
