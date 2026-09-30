import React, { FC, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { trackError } from '~/utils/ErrorUtils';

type FeedItemErrorBoundaryProps = {
  children: ReactNode;
  // Changing this resets the boundary's error state. FlashList recycles cell
  // component instances, so without a reset key a cell that errored once would
  // keep rendering nothing after being recycled for a different (healthy) item.
  // Pass the feed item (or a stable id) so each item gets a fresh boundary.
  resetKey?: unknown;
};

/**
 * Isolates render failures of a single feed cell so they can never blank the
 * whole feed (or corrupt the React reconciler). An uncaught throw during a
 * cell's render — e.g. a NativeSharedObjectNotFoundException from accessing a
 * recycled/released expo-video player — would otherwise propagate up the tree.
 * Here we render nothing for the failed cell and report the error.
 */
const FeedItemErrorBoundary: FC<FeedItemErrorBoundaryProps> = ({
  children,
  resetKey,
}) => {
  return (
    <ErrorBoundary
      resetKeys={[resetKey]}
      onError={(error) => {
        trackError(error, {
          location: 'FeedItemErrorBoundary',
        });
      }}
      fallbackRender={() => null}
    >
      {children}
    </ErrorBoundary>
  );
};

FeedItemErrorBoundary.displayName = 'FeedItemErrorBoundary';

export { FeedItemErrorBoundary };
