import { QueryState } from '@tanstack/react-query';

import { wasQueryDataRecentlyFetched } from '../PrefetchAndRefreshUtils';

describe('RefreshUtils', () => {
  describe('wasQueryDataRecentlyFetched', () => {
    const threshold = 1000;
    const buildState = (state: Partial<QueryState>) =>
      state as QueryState<unknown, Error>;

    it('should return false when there is no state', () => {
      expect(
        wasQueryDataRecentlyFetched({ state: undefined, threshold }),
      ).toEqual(false);
    });

    it('should return true when status is pending', () => {
      expect(
        wasQueryDataRecentlyFetched({
          state: buildState({ status: 'pending' }),
          threshold,
        }),
      ).toEqual(true);
    });

    it('should return true when fetch status is fetching', () => {
      expect(
        wasQueryDataRecentlyFetched({
          state: buildState({ fetchStatus: 'fetching' }),
          threshold,
        }),
      ).toEqual(true);
    });

    it('should return true when data was updated within threshold', () => {
      expect(
        wasQueryDataRecentlyFetched({
          state: buildState({ dataUpdatedAt: Date.now() }),
          threshold,
        }),
      ).toEqual(true);
    });

    it('should return false when data was not updated within threshold', () => {
      expect(
        wasQueryDataRecentlyFetched({
          state: buildState({ dataUpdatedAt: Date.now() - threshold - 1 }),
          threshold,
        }),
      ).toEqual(false);
    });
  });
});
