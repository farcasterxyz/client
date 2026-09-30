import { ApiFrame } from 'farcaster-client-data';

import {
  useBatchMergeIntoGlobalCache,
  useGloballyCachedObject,
  useMergeIntoGlobalCache,
  useOptimisticallyUpdateObject,
} from '../../../../utils/CacheUtils';
import { buildFrameDetailsKey } from './buildFrameDetailsKey';

const mergeKeyGenerator = (value: Pick<ApiFrame, 'domain'>) =>
  buildFrameDetailsKey({ domain: value.domain });
const globalCacheKeyGenerator = (value: ApiFrame | null | undefined) =>
  buildFrameDetailsKey({ domain: value?.domain });

export const useMergeIntoGloballyCachedFrame = () => {
  return useMergeIntoGlobalCache<ApiFrame, 'domain'>({
    keyGenerator: mergeKeyGenerator,
  });
};

export type MergeIntoGloballyCachedFrame = ReturnType<
  typeof useMergeIntoGloballyCachedFrame
>;

export const useBatchMergeIntoGloballyCachedFrame = () => {
  return useBatchMergeIntoGlobalCache<ApiFrame, 'domain'>({
    keyGenerator: mergeKeyGenerator,
  });
};

export type BatchMergeIntoGloballyCachedFrame = ReturnType<
  typeof useBatchMergeIntoGloballyCachedFrame
>;

export function useGloballyCachedFrame(fallback: ApiFrame): ApiFrame;
export function useGloballyCachedFrame(
  fallback: ApiFrame | null | undefined,
): ApiFrame | undefined;
export function useGloballyCachedFrame(
  fallback: ApiFrame | null | undefined,
): ApiFrame | undefined {
  return useGloballyCachedObject({
    fallback: fallback ?? undefined,
    keyGenerator: globalCacheKeyGenerator,
  });
}

export const useOptimisticallyUpdateFrame = () => {
  return useOptimisticallyUpdateObject<ApiFrame, 'domain'>({
    keyGenerator: mergeKeyGenerator,
  });
};
