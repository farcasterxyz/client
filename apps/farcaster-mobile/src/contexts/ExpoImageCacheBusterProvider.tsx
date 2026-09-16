import { Image } from 'expo-image';
import React from 'react';

import {
  bustedExpoImageCache,
  shouldBustExpoImageCache,
} from '~/utils/FastStorageUtils';

async function cleanExpoImageCache() {
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
  bustedExpoImageCache();
}

export function ExpoImageCacheBusterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (shouldBustExpoImageCache()) {
      void cleanExpoImageCache();
    }
  }, []);

  return <>{children}</>;
}
