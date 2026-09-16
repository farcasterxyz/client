import React, { useCallback, useMemo } from 'react';
import { RefreshControl } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import { useHaptics } from '../hooks/useHaptics';

const useRefreshControl = ({
  isRefreshing,
  refetch,
  setIsRefreshing,
  offset,
}: {
  isRefreshing: boolean;
  refetch: () => Promise<unknown>;
  setIsRefreshing: (refreshing: boolean) => void;
  offset?: number;
}) => {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  // Stable handler that guards against double-invocation. On iOS with the New
  // Architecture, Fabric can synchronously commit a new refreshControl element
  // to the native layer when isRefreshing flips to true (because useMemo
  // returns a new element). In rare cases this causes UIRefreshControl to fire
  // onRefresh a second time on the freshly committed control, which would
  // start a second fetchPreviousPage whose cancelQueries call kills the first
  // in-flight fetch — making the spinner vanish almost immediately. The guard
  // below makes the second call a no-op.
  const handleRefresh = useCallback(() => {
    if (isRefreshing) {
      return;
    }

    triggerImpactAsync();

    setIsRefreshing(true);
    refetch().finally(() => {
      setIsRefreshing(false);
    });
  }, [isRefreshing, triggerImpactAsync, setIsRefreshing, refetch]);

  return useMemo(
    () => (
      <RefreshControl
        refreshing={isRefreshing}
        tintColor={t.colors.loadingIndicator}
        colors={[t.colors.loadingIndicator]}
        progressViewOffset={offset}
        onRefresh={handleRefresh}
      />
    ),
    [isRefreshing, t.colors.loadingIndicator, offset, handleRefresh],
  );
};

export { useRefreshControl };
