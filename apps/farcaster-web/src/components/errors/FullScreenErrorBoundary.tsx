import { useQueryClient } from '@tanstack/react-query';
import { FC, memo, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from '~/components/errors/ErrorFallback';

type FullScreenErrorBoundaryProps = {
  children: ReactNode;
};

const FullScreenErrorBoundary: FC<FullScreenErrorBoundaryProps> = memo(
  ({ children }) => {
    const queryClient = useQueryClient();

    return (
      <>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => {
            queryClient.clear();
          }}
        >
          {children}
        </ErrorBoundary>
      </>
    );
  },
);

FullScreenErrorBoundary.displayName = 'FullScreenErrorBoundary';

export { FullScreenErrorBoundary };
