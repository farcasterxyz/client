import { useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';

import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

export function useRecentlyViewedUsers() {
  const [recentUserProfileFids, setRecentUserProfileFids] = useMMKVString(
    'recentlyViewedUsers',
  );
  const currFid = useCurrentUser_UNSAFE()?.fid;
  const getRecentlyViewedUsers = useCallback(() => {
    return (recentUserProfileFids ?? '')
      .split(',')
      .filter((x) => x !== '')
      .map((x) => Number(x))
      .reverse();
  }, [recentUserProfileFids]);

  const clearAllRecentlyViewedUsers = useCallback(() => {
    setRecentUserProfileFids('');
  }, [setRecentUserProfileFids]);

  const updateRecentlyViewedUsers = useCallback(
    ({ fid }: { fid: number }) => {
      if (fid === currFid) {
        return;
      }
      const currFids = (recentUserProfileFids ?? '')
        .split(',')
        .filter((x) => x !== '')
        .map((x) => Number(x));

      if (currFids.includes(fid)) {
        return;
      } else {
        if (currFids.length >= 3) {
          currFids.shift();
        }
        currFids.push(fid);
        setRecentUserProfileFids(currFids.join(','));
      }
    },
    [currFid, recentUserProfileFids, setRecentUserProfileFids],
  );

  const clearRecentlyViewedUser = useCallback(
    ({ fid }: { fid: number }) => {
      const currFids = (recentUserProfileFids ?? '')
        .split(',')
        .filter((x) => x !== '')
        .map((x) => Number(x));

      const findIndex = currFids.indexOf(fid);
      if (findIndex !== -1) {
        currFids.splice(findIndex, 1);
      }
      setRecentUserProfileFids(currFids.join(','));
    },
    [recentUserProfileFids, setRecentUserProfileFids],
  );

  return {
    getRecentlyViewedUsers,
    clearAllRecentlyViewedUsers,
    updateRecentlyViewedUsers,
    clearRecentlyViewedUser,
  };
}
