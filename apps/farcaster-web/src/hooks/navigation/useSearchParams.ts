import { useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSearchParams as useSearchParamsReactRouter } from 'react-router-dom';

import { RouteName, Routes } from '~/types';

const ARRAY_SEARCH_PARAM_INDICATOR = '[]';

const useSearchParams = <Name extends RouteName>(_routname: Name) => {
  const urlSearchParams = useSearchParamsReactRouter()[0];

  return useMemo(() => {
    const result: Record<string, string | string[]> = {};
    let hasArraySearchParams = false;

    for (const key of urlSearchParams.keys()) {
      const isArraySearchParam = key.endsWith(ARRAY_SEARCH_PARAM_INDICATOR);

      if (!hasArraySearchParams && isArraySearchParam) {
        hasArraySearchParams = true;
      }

      // If the key ends with [] - that means its an array search param.
      // i.e. farcaster.xyz/~/compose?embeds[]=xyz.com&embeds[]=farcaster.xyz
      const value = isArraySearchParam
        ? urlSearchParams.getAll(key)
        : urlSearchParams.get(key);

      if (value !== null) {
        const resultKey = key.split(ARRAY_SEARCH_PARAM_INDICATOR)[0];
        result[resultKey] = value;
      }
    }

    // When array search params ('[]') are used, `URLSearchParams` doesn't return
    // URL decoded values, likely because the `[]` are themselves URL encoded.
    // So we need to decode them manually.
    if (hasArraySearchParams) {
      for (const [key, value] of Object.entries(result)) {
        if (Array.isArray(value)) {
          result[key] = value.map((item) => decodeURIComponent(item));
        } else {
          result[key] = decodeURIComponent(value);
        }
      }
    }

    return result as Partial<Routes[Name]['search']>;
  }, [urlSearchParams]);
};

export { useSearchParams };
