import {
  getApiTokenAuthError,
  isApiTokenAuthError,
} from 'farcaster-client-data';
import React, { FC, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ViewStyle } from 'react-native';

import { WrongCustodyAddressError } from '~/components/WrongCustodyAddressError';
import { useErrorHistory } from '~/contexts/ErrorHistoryProvider';

type AuthErrorBoundaryProps = {
  children: ReactNode;
  containerStyle?: ViewStyle[];
};

/**
 * Error boundary to handle authorization errors related to our encrypted API
 * token.
 */
const ApiTokenAuthErrorBoundary: FC<AuthErrorBoundaryProps> = ({
  children,
}) => {
  const { addError } = useErrorHistory();

  return (
    <ErrorBoundary
      onError={(error) => {
        // Only handle API token auth errors, otherwise bubble up the error
        if (isApiTokenAuthError(error)) {
          addError(error);
        } else {
          throw error;
        }
      }}
      fallbackRender={({ error, resetErrorBoundary }) => {
        const authError = getApiTokenAuthError(error);

        // Only handle API token auth errors, otherwise bubble up the error
        if (authError) {
          return (
            <WrongCustodyAddressError
              error={authError}
              resetErrorBoundary={resetErrorBoundary}
            />
          );
        }

        // We should never get here since onError will have already thrown if
        // the error is not one this boundary handles.
        throw error;
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

ApiTokenAuthErrorBoundary.displayName = 'ApiTokenAuthErrorBoundary';

export { ApiTokenAuthErrorBoundary };
