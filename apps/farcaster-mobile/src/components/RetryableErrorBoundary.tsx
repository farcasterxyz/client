import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { isRetryableError } from 'farcaster-client-data';
import React, { FC, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ViewStyle } from 'react-native';

import { useErrorHistory } from '~/contexts/ErrorHistoryProvider';
import { trackError } from '~/utils/ErrorUtils';

import { FullScreenRetryableError } from './FullScreenRetryableError';

type RetryableErrorBoundaryProps = {
  children: ReactNode;
  containerStyle?: ViewStyle[];
  onBack?: () => void;
};

const RetryableErrorBoundary: FC<RetryableErrorBoundaryProps> = ({
  children,
  containerStyle,
  onBack,
}) => {
  const { addError } = useErrorHistory();

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={(error) => {
            // Only handle retryable errors
            if (!isRetryableError(error)) {
              throw error;
            }

            addError(error);
            trackError(error, {
              location: 'RetryableErrorBoundary',
            });
          }}
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <FullScreenRetryableError
              onBack={onBack}
              containerStyle={containerStyle}
              error={error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

RetryableErrorBoundary.displayName = 'RetryableErrorBoundary';

export { RetryableErrorBoundary };
