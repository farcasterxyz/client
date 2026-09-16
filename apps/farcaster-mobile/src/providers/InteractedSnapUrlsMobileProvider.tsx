import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InteractedSnapUrlsProvider,
  type InteractedSnapUrlsStore,
} from 'farcaster-client-hooks';
import React, { memo } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const mobileInteractedSnapUrlsStore: InteractedSnapUrlsStore = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

type InteractedSnapUrlsMobileProviderProps = {
  children: React.ReactNode;
};

const InteractedSnapUrlsMobileProvider: React.FC<InteractedSnapUrlsMobileProviderProps> =
  memo(({ children }) => {
    const viewerFid = useCurrentUser()?.fid;

    return (
      <InteractedSnapUrlsProvider
        store={mobileInteractedSnapUrlsStore}
        viewerFid={viewerFid}
      >
        {children}
      </InteractedSnapUrlsProvider>
    );
  });

InteractedSnapUrlsMobileProvider.displayName =
  'InteractedSnapUrlsMobileProvider';

export { InteractedSnapUrlsMobileProvider };
