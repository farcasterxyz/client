import { useQuery } from '@tanstack/react-query';
import { ApiCast } from 'farcaster-client-data';
import { useEffect } from 'react';

import {
  stringifyGlobalCacheUsageKey,
  useGlobalCacheUsage,
} from '../../../../providers/GlobalCacheUsageProvider';
import { buildGloballyCachedCastKey } from './buildGloballyCachedCastKey';

const useGloballyCachedCastWithoutFallback = ({
  hash,
  recast,
}: {
  hash: string | undefined;
  recast: boolean | undefined;
}) => {
  const { addUsage, removeUsage } = useGlobalCacheUsage();

  const queryKey = buildGloballyCachedCastKey({
    hash: hash || 'UNKNOWN_HASH',
    recast: recast || false,
  });

  const stringifiedKey = stringifyGlobalCacheUsageKey(queryKey);

  useEffect(() => {
    addUsage(stringifiedKey);
    return () => removeUsage(stringifiedKey);
  }, [addUsage, stringifiedKey, removeUsage]);

  return useQuery({
    queryKey: queryKey,
    queryFn: () => null,
    enabled: false,
  }).data as ApiCast | undefined;
};

export { useGloballyCachedCastWithoutFallback };
