import AsyncStorage from '@react-native-async-storage/async-storage';

import { trackStorageBenchmark } from '~/utils/StorageBenchmarkUtils';

import { trackError } from './ErrorUtils';
import { logErrorInDevOnly } from './LogUtils';
import { safeStringify } from './StringUtils';

const keyDelimiter = '|';

const benchmark = async <T>(
  {
    key,
    keys,
    type,
  }: {
    key?: string;
    keys?: string[];
    type: 'readKeys' | 'read' | 'multiRead' | 'write' | 'delete';
  },
  perform: () => Promise<T>,
) => {
  const start = Date.now();
  const result = await perform();
  trackStorageBenchmark({ key, keys, type, duration: Date.now() - start });
  return result;
};

const getAllKeys = () => {
  return benchmark({ type: 'readKeys' }, async () => {
    return await AsyncStorage.getAllKeys();
  });
};

const getAllKeysWithPrefix = async ({ prefix }: { prefix: string }) => {
  const allKeys = await getAllKeys();
  const prefixWithDelimiter = prefix + keyDelimiter;
  return allKeys.filter((key) => key.startsWith(prefixWithDelimiter));
};

const createKeyWithPrefixAndId = ({
  id,
  prefix,
}: {
  id: string;
  prefix: string;
}) => {
  return prefix + keyDelimiter + id;
};

const extractIdFromPrefixedKey = ({
  key,
  prefix,
}: {
  key: string;
  prefix: string;
}) => {
  return key.split(prefix + keyDelimiter)[1];
};

const getItem = <T>({
  key,
  fallback,
}: {
  key: string;
  fallback: T;
}): Promise<T> => {
  return benchmark({ type: 'read', key }, async () => {
    try {
      const result = await AsyncStorage.getItem(key);

      if (result === null) {
        return fallback;
      }

      try {
        const parsed = JSON.parse(result) as T;
        // A prior `setItem(undefined)` persists the string "null" (via
        // safeStringify), which parses back to JS `null` — a value outside the
        // declared `T`. Coalesce it to `fallback` so getItem's `Promise<T>`
        // contract stays honest; a legacy "null" on disk then reads back as
        // the fallback (this does not rewrite the stored value).
        return parsed === null ? fallback : parsed;
      } catch (error) {
        logErrorInDevOnly(error);
        trackError(new Error(`Error parsing ${key} from storage`));
        return fallback;
      }
    } catch (err) {
      logErrorInDevOnly(err);
      trackError(
        new Error(
          `Error reading ${key} from storage err: ${(err as Error)?.message}`,
        ),
      );
      return fallback;
    }
  });
};

const getItems = <T>({
  keys,
}: {
  keys: string[];
}): Promise<[string, T | null][]> => {
  return benchmark({ type: 'multiRead', keys }, async () => {
    try {
      const results = await AsyncStorage.multiGet(keys);

      return results.map(([key, value]) => {
        if (!value) {
          return [key, null];
        }

        try {
          return [key, JSON.parse(value) as T];
        } catch (error) {
          logErrorInDevOnly(error);
          trackError(new Error(`Error parsing ${key} from storage`));
          return [key, null];
        }
      });
    } catch (err) {
      logErrorInDevOnly(err);
      trackError(new Error(`Error reading ${keys} from storage`));
      return [];
    }
  });
};

const setItem = ({ key, value }: { key: string; value: unknown }) => {
  return benchmark({ type: 'write', key }, async () => {
    try {
      return await AsyncStorage.setItem(key, safeStringify(value));
    } catch {
      trackError(new Error(`Error writing ${key} to storage`));
    }
  });
};

const deleteItem = ({ key }: { key: string }) => {
  return benchmark({ type: 'delete', key }, async () => {
    try {
      return await AsyncStorage.removeItem(key);
    } catch {
      // Match setItem's contract: never reject, report instead. Callers that
      // clear keys via `void deleteItem(...)` otherwise lose the failure
      // silently and leave stale data behind with no signal.
      trackError(new Error(`Error deleting ${key} from storage`));
    }
  });
};

export {
  createKeyWithPrefixAndId,
  deleteItem,
  extractIdFromPrefixedKey,
  getAllKeys,
  getAllKeysWithPrefix,
  getItem,
  getItems,
  setItem,
};
