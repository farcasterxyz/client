import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

import { setKeysAreFetched, shouldFetchKeys } from '~/utils/FastStorageUtils';

export function LocalStorageProvider({ children }: React.PropsWithChildren) {
  React.useEffect(() => {
    const loadKeys = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();

        DdRum.addAction(RumActionType.CUSTOM, 'storage_keys', {
          keys,
        });

        setKeysAreFetched();
      } catch {
        // No-op
      }
    };

    if (shouldFetchKeys()) {
      loadKeys();
    }
  }, []);

  return <>{children}</>;
}
