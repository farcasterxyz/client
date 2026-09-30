import { Directory, Paths } from 'expo-file-system';
import React from 'react';
import { InteractionManager } from 'react-native';

import { bustedFSCache, shouldBustFSCache } from '~/utils/FastStorageUtils';

const CACHE_DIR_NAMES = ['ImagePicker', 'ImageManipulator'];

function cleanCacheDirs() {
  for (const name of CACHE_DIR_NAMES) {
    try {
      const dir = new Directory(Paths.cache, name);
      if (dir.exists) {
        dir.delete();
      }
    } catch (error) {
      // No-op as this is best effort
    }
  }
  bustedFSCache();
}

export function FileSystemCacheBusterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!shouldBustFSCache()) {
      return;
    }
    // cleanCacheDirs does synchronous expo-file-system work (Directory.exists
    // + recursive delete). Defer it past the cold-start interaction window so
    // it can't stall the JS thread during launch.
    const handle = InteractionManager.runAfterInteractions(() => {
      cleanCacheDirs();
    });
    return () => handle.cancel();
  }, []);

  return <>{children}</>;
}
