import { useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';

export function useRecentSearchQueries() {
  const [recentSearchQueries, setRecentSearchQueries] = useMMKVString(
    'recentSearchQueries',
  );
  const getRecentSearchQueries = useCallback(() => {
    const res = JSON.parse(recentSearchQueries ?? '[]') as string[];
    return res.reverse();
  }, [recentSearchQueries]);

  const clearAllRecentSearchQueries = useCallback(() => {
    setRecentSearchQueries(JSON.stringify([]));
  }, [setRecentSearchQueries]);

  const updateRecentSearchQueries = useCallback(
    ({ q }: { q: string }) => {
      const currQueries = JSON.parse(recentSearchQueries ?? '[]');
      if (currQueries.includes(q)) {
        return;
      } else {
        if (currQueries.length >= 3) {
          currQueries.shift();
        }
        currQueries.push(q);
        setRecentSearchQueries(JSON.stringify(currQueries));
      }
    },
    [recentSearchQueries, setRecentSearchQueries],
  );

  const clearRecentSearchQuery = useCallback(
    ({ q }: { q: string }) => {
      const currQueries = JSON.parse(recentSearchQueries ?? '[]');
      const findIndex = currQueries.indexOf(q);
      if (findIndex !== -1) {
        currQueries.splice(findIndex, 1);
      }
      setRecentSearchQueries(JSON.stringify(currQueries));
    },
    [recentSearchQueries, setRecentSearchQueries],
  );

  return {
    getRecentSearchQueries,
    clearAllRecentSearchQueries,
    updateRecentSearchQueries,
    clearRecentSearchQuery,
  };
}
