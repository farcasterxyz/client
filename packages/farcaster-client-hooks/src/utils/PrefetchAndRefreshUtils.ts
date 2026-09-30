import { QueryState } from '@tanstack/react-query';

const defaultRecentlyFetchedThreshold = 3 * 1000;
const defaultRecentlyPrefetchedThreshold = 10 * 1000;

const wasQueryDataRecentlyFetched = ({
  state,
  threshold = defaultRecentlyFetchedThreshold,
}: {
  state: QueryState<unknown, Error> | undefined;
  threshold?: number;
}): boolean => {
  if (!state) {
    return false;
  }

  if (state.status === 'pending') {
    return true;
  }

  if (state.fetchStatus === 'fetching') {
    return true;
  }

  const timeSinceLastUpdate = Date.now() - state.dataUpdatedAt;

  if (timeSinceLastUpdate < threshold) {
    return true;
  }

  return false;
};

export {
  defaultRecentlyFetchedThreshold,
  defaultRecentlyPrefetchedThreshold,
  wasQueryDataRecentlyFetched,
};
