import {
  InteractedSnapUrlsProvider,
  type InteractedSnapUrlsStore,
} from 'farcaster-client-hooks';
import React, { memo } from 'react';

import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

const webInteractedSnapUrlsStore: InteractedSnapUrlsStore = {
  getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
};

type InteractedSnapUrlsWebProviderProps = {
  children: React.ReactNode;
};

const InteractedSnapUrlsWebProvider: React.FC<InteractedSnapUrlsWebProviderProps> =
  memo(({ children }) => {
    const viewerFid = useCachedCurrentUser()?.fid;

    return (
      <InteractedSnapUrlsProvider
        store={webInteractedSnapUrlsStore}
        viewerFid={viewerFid}
      >
        {children}
      </InteractedSnapUrlsProvider>
    );
  });

InteractedSnapUrlsWebProvider.displayName = 'InteractedSnapUrlsWebProvider';

export { InteractedSnapUrlsWebProvider };
