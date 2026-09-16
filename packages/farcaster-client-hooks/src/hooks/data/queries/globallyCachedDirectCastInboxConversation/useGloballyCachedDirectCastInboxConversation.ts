import { useQuery } from '@tanstack/react-query';
import {
  type ApiDirectCastInboxConversationInfoV3,
  mergeExceptArrays,
} from 'farcaster-client-data';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { buildGloballyCachedDirectCastInboxConversationKey } from './buildGloballyCachedDirectCastInboxConversationKey';

const useGloballyCachedDirectCastInboxConversation = ({
  fallback,
}: {
  fallback: ApiDirectCastInboxConversationInfoV3;
}) => {
  const queryKey = useMemo(
    () =>
      buildGloballyCachedDirectCastInboxConversationKey({
        conversationId: fallback.conversationId,
      }),
    [fallback.conversationId],
  );

  const fallbackCallback = useCallback(() => fallback, [fallback]);
  const options = useMemo(
    () => ({
      enabled: false,
    }),
    [],
  );

  const cachedValue = useQuery({
    queryKey: queryKey,
    queryFn: fallbackCallback,
    ...options,
  }).data;

  const mergedValueRef =
    useRef<ApiDirectCastInboxConversationInfoV3>(undefined);

  useEffect(() => {
    if (
      // We have recycling views calling globally cached content. What this sometimes results in the
      // fast scrolls on flashlists getting ref values on a different fallback call.
      // We should eventually figure out and properly fix this cache lookups.
      // However, we already do this for casts global caches so let's go ahead and duplicate that
      // logic here too.
      typeof cachedValue !== 'undefined' &&
      fallback.conversationId === cachedValue.conversationId
    ) {
      mergedValueRef.current = mergeExceptArrays(fallback, cachedValue);
    }
  }, [cachedValue, fallback]);

  return useMemo(() => {
    return mergeExceptArrays(
      typeof mergedValueRef.current === 'undefined' ||
        mergedValueRef.current.conversationId === fallback.conversationId
        ? mergedValueRef.current
        : {},
      mergeExceptArrays(fallback, cachedValue),
    );
  }, [cachedValue, fallback]);
};

export { useGloballyCachedDirectCastInboxConversation };
