import { useMMKVBoolean } from 'react-native-mmkv';

import { useIsAdmin } from '~/hooks/data/useIsAdmin';

export const useShowServerSideArtifacts = () => {
  const isAdmin = useIsAdmin();
  const [showServerSideArtifacts = false] = useMMKVBoolean(
    'debug-collectible-casts-show-server-side-artifacts',
  );
  return isAdmin && showServerSideArtifacts;
};
