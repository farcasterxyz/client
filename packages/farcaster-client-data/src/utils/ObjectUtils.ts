import mergeWith from 'lodash/mergeWith';

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Returns a new object that is the result of applying the given options
 * on top of default options, only overriding valeus when the options value is not undefined.
 * @param defaults - The default options.
 * @param options - The user-given options.
 * @returns The merged options.
 */
function mergeIntoDefaultOptions<T>({
  defaults,
  options,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: Record<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<any, any>;
}): T {
  const mergedOptions = { ...defaults };

  for (const key in options) {
    if (options[key] !== undefined) {
      mergedOptions[key] = options[key];
    }
  }

  return mergedOptions as T;
}

function invertObject<T extends Record<string | number, string | number>>(
  obj: T,
): Record<T[keyof T], keyof T> {
  const entries = Object.entries(obj) as [keyof T, T[keyof T]][];
  const inverted = Object.fromEntries(
    entries.map(([key, value]) => [value, key]),
  );
  return inverted as Record<T[keyof T], keyof T>;
}

/**
 * Determines whether cache should be updated based on comparison between cached and updated values.
 * Handles case-insensitive string comparison for better compatibility across endpoints.
 */
const shouldUpdateCache = <T extends object>({
  cache,
  updates,
}: {
  cache: T | undefined;
  updates: DeepPartial<T>;
}): boolean => {
  if (!cache) {
    return true;
  }

  // Since we iterate below based on keys of updates, in case updates is an
  // array and cache is missing or is a larger array, we want to update it for sure
  if (
    Array.isArray(updates) &&
    (!Array.isArray(cache) ||
      Object.keys(cache).length > Object.keys(updates).length)
  ) {
    return true;
  }

  for (const key in updates) {
    const cachedValue: unknown = cache[key as unknown as keyof T];
    const updateValue: unknown = updates[key];

    if (typeof cachedValue === 'object' && typeof updateValue === 'object') {
      if (
        shouldUpdateCache({
          cache: cachedValue as object,
          updates: updateValue as object,
        })
      ) {
        return true;
      }
    } else if (
      typeof updateValue === 'string' &&
      typeof cachedValue === 'string'
    ) {
      // For strings we want to do a case-insensitive comparison,
      // because different endpoints may respond with different casing
      // for fids, hashes, etc.
      if (updateValue.toLowerCase() !== cachedValue.toLowerCase()) {
        return true;
      }
    } else {
      if (cachedValue !== updateValue) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Override merge() to always replace arrays in full. We don't ever expect our API to submit a partial update
 * to an array (vs we do expect partial updates to objects). Merging arrays causes two problems:
 * - When the current user is the last recaster and they delete their recast, the new recasters array is
 *   just an element shorter. merge() keeps the original array (since it's a superset) which is
 *   wrong.
 * - When a React element is updated with a new cast and the updates are merged in the global cache,
 *   React will update the single element tags array in-place, which will not retrigger rendering of
 *   objects which have the overall array object as a dependency
 */
function mergeExceptArrays<CachedType, UpdatesType>(
  cache: CachedType,
  updates: UpdatesType,
): CachedType & UpdatesType {
  return mergeWith(cache, updates, (_prevValue, newValue) => {
    if (Array.isArray(newValue)) {
      return newValue;
    }
    return undefined; // Let mergeWith handle non-array values normally
  });
}

/**
 * 3-way mergeExceptArrays(), including a base object, so that the caller can manage what React
 * considers as updated
 */
const mergeWithBaseExceptArrays = <CachedType, UpdatesType>({
  base,
  cache,
  updates,
}: {
  base: CachedType | Record<string, never>;
  cache: CachedType | undefined;
  updates: UpdatesType | undefined;
}) => {
  return mergeExceptArrays(mergeExceptArrays(base, cache), updates);
};

export {
  invertObject,
  mergeExceptArrays,
  mergeIntoDefaultOptions,
  mergeWithBaseExceptArrays,
  shouldUpdateCache,
};
export type { DeepPartial };
