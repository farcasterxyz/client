import * as SecureStore from 'expo-secure-store';

import { trackStorageBenchmark } from '~/utils/StorageBenchmarkUtils';

import { trackError } from './ErrorUtils';
import { logErrorInDevOnly } from './LogUtils';
import { safeStringify } from './StringUtils';

const benchmark = async <T>(
  key: string,
  type: 'secureRead' | 'secureWrite' | 'secureDelete',
  perform: () => Promise<T>,
) => {
  const start = Date.now();
  const result = await perform();
  trackStorageBenchmark({ key, type, duration: Date.now() - start });
  return result;
};

const getSecureItem = <T>({
  key,
  fallback,
}: {
  key: string;
  fallback: T;
}): Promise<T> => {
  return benchmark(key, 'secureRead', async () => {
    try {
      const result = await SecureStore.getItemAsync(key);

      if (result === null) {
        return fallback;
      }

      try {
        return JSON.parse(result) as T;
      } catch (error) {
        // We want to include the key but not the value or error #security
        logErrorInDevOnly(error);
        trackError(new Error(`Error parsing ${key} from secure storage`));

        return fallback;
      }
    } catch (error) {
      // We want to include the key but not the value or error #security
      logErrorInDevOnly(error);
      trackError(new Error(`Error reading ${key} from secure storage`));

      return fallback;
    }
  });
};

const setSecureItem = ({ key, value }: { key: string; value: unknown }) => {
  return benchmark(key, 'secureWrite', async () => {
    try {
      return await SecureStore.setItemAsync(key, safeStringify(value), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch (error) {
      // We want to include the key but not the value or error #security
      logErrorInDevOnly(error);
      trackError(new Error(`Error writing ${key} to secure storage`));
    }
  });
};

const deleteSecureItem = (key: string) => {
  return benchmark(key, 'secureDelete', async () => {
    try {
      return await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // We want to include the key but not the value or error #security
      logErrorInDevOnly(error);
      trackError(new Error(`Error deleting ${key} from secure storage`));
    }
  });
};

export { deleteSecureItem, getSecureItem, setSecureItem };
