import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCreateCast201Response,
  ApiOpenGraphMetadata,
  getCastHashPrefix,
  getTokenEmbedUrl,
  parseCAIP19Token,
} from 'farcaster-client-data';
import {
  CastReactionType,
  sleep,
  useCreateCast,
  useDeleteCast,
  useDiscardDraftCast,
  useFetchOpenGraphMetadata,
  useOptimisticallyAddNewCastToThread,
  usePrefetchUserThreadCasts,
  useStoreDraftCaststorm,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import { useCallback, useRef } from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAppStoreReview } from '~/contexts/AppStoreReviewProvider';
import { useCastQueue } from '~/contexts/CastQueueProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { buildApiCastUrlEmbedFromMetadata } from '~/utils/CastUtils';
import { trackError } from '~/utils/ErrorUtils';

import { dedupeEmbedReferences } from './dedupeEmbedReferences';
import { getDedupedEmbedsArrayFromOptimisticEmbeds } from './getDedupedEmbedsArrayFromOptimisticEmbeds';
import { setLocalDraft } from './LocalDrafts';
import {
  getOptimisticMediaLookupKey,
  useOptimisticMediaEmbeds,
} from './OptimisticMediaEmbedsProvider';

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error && error.message ? error.message : undefined;
}

const GENERIC_CAST_ERROR_MESSAGE = 'Failed to cast';

function useSubmitCastsInQueue() {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const { regularCastByteLimit } = useUserAppContext();
  const { trackEvent } = useAnalytics();
  const { requestReview } = useAppStoreReview();
  const toast = useRootToast();

  const onAfterSuccessfulCast = useCallback(() => {
    requestReview({ when: 'after-cast' });
  }, [requestReview]);

  const createCast = useCreateCast();
  const optimisticallyAddNewCastToThread =
    useOptimisticallyAddNewCastToThread('bottom');
  const trackCastReaction = useTrackCastReaction();
  const deleteCast = useDeleteCast();
  const discardDraftCast = useDiscardDraftCast();
  const storeDraftCaststorm = useStoreDraftCaststorm();
  const prefetchThread = usePrefetchUserThreadCasts();

  const { reducer } = useCastQueue();
  const [state, dispatch] = reducer;
  const [optimisticMediaEmbedsState] = useOptimisticMediaEmbeds();
  const { getCachedOpenGraphMetadataSnapshot } = useFetchOpenGraphMetadata();

  const markCastAsErrored = useCallback(
    ({ queueId, error }: { queueId: string; error?: unknown }) => {
      const errorMessage = getErrorMessage(error) ?? GENERIC_CAST_ERROR_MESSAGE;
      const payload = state[queueId];

      payload?.params.onError?.(errorMessage);
      toast.show(errorMessage, {
        type: 'danger',
        duration: 5_000,
      });

      dispatch({
        type: 'MarkAsErrored',
        queueId,
        errorMessage,
      });
    },
    [dispatch, state, toast],
  );

  const deletePostedCasts = useCallback(
    async ({ postedCasts }: { postedCasts: { hash: string }[] }) =>
      await Promise.all(
        postedCasts.map(({ hash }) =>
          deleteCast({ cast: { author: { fid: currentUserFid }, hash } }),
        ),
      ),
    [currentUserFid, deleteCast],
  );

  // Tracks the pre-publish auto-saved draftId per cast identity
  // (`castQueueId`, which is stable across retries of the same cast). If the
  // user retries a failed cast, we reuse that cast's draftId so the recovery
  // auto-save upserts in place instead of piling up near-identical drafts.
  // Keying by `castQueueId` (rather than a single shared ref) ensures an
  // unrelated later publish never reuses a previous failed cast's draftId and
  // clobbers its recovery draft. This is the queue-runner counterpart to the
  // composer-level `autoSavedDraftIdRef` used by the background/
  // visibilitychange auto-save path.
  const prePublishAutoSavedDraftIdsRef = useRef<Map<string, string>>(new Map());

  const sendCast = useCallback(
    async ({ queueId }: { queueId: string }) => {
      const payload = state[queueId];
      const cachedMetadataSnapshot = getCachedOpenGraphMetadataSnapshot();

      const queuedCasts = payload.params.casts;
      const activeDraftId = payload.params.activeDraftId;
      const scheduledAt = payload.params.scheduledAt;
      const channelKey = payload.params.channelKey;
      const feed = payload.params.feed;
      const includeReason = payload.params.includeReason;
      const quoteReactions = payload.params.quoteReactions ?? [];
      const tokenKey = payload.params.tokenKey;
      const parentCastHash = payload.params.parentCastHash;
      const localDraftKey = payload.params.localDraftKey;
      const queueIdOverrideForEmbeds = payload.params.queueIdOverrideForEmbeds;
      const isReplyFlow = typeof parentCastHash !== 'undefined';
      const parsedToken = tokenKey ? parseCAIP19Token(tokenKey) : null;
      const tokenEmbedUrlForReply =
        isReplyFlow && parsedToken !== null
          ? getTokenEmbedUrl({ chain: parsedToken.chain, ca: parsedToken.ca })
          : undefined;

      const castQueueId =
        typeof queueIdOverrideForEmbeds !== 'undefined'
          ? queueIdOverrideForEmbeds
          : queueId;

      const storeRecoveryDraft = async ({
        draftId,
      }: {
        draftId: string | undefined;
      }): Promise<string | undefined> => {
        try {
          const autoSaveResponse = await storeDraftCaststorm({
            caststorm: {
              casts: queuedCasts.map((queuedCast) => ({
                text: queuedCast.text.trim(),
                embeds: dedupeEmbedReferences([
                  ...(queuedCast.embeds ?? []),
                  ...(typeof tokenEmbedUrlForReply !== 'undefined'
                    ? [tokenEmbedUrlForReply]
                    : []),
                ]),
              })),
              parent:
                typeof parentCastHash !== 'undefined'
                  ? { hash: parentCastHash }
                  : undefined,
              channelKey,
              draftId,
            },
            // Re-send the opened draft's schedule. The backend treats
            // `scheduledAt` as authoritative on every store, so upserting a
            // scheduled draft without it would silently unschedule it.
            scheduledAt,
          });
          const storedDraftId = autoSaveResponse.result.draft.draftId;
          prePublishAutoSavedDraftIdsRef.current.set(
            castQueueId,
            storedDraftId,
          );

          if (typeof draftId !== 'undefined' && draftId !== storedDraftId) {
            // Fallback for an older backend that ignored `draftId` and created
            // a new draft instead of upserting.
            try {
              await discardDraftCast({
                draftId,
                castChannelKey: undefined,
              });
            } catch (error) {
              trackError(JSON.stringify(error));
            }
          }

          return storedDraftId;
        } catch (error) {
          trackError(JSON.stringify(error));
          return draftId;
        }
      };

      // Save text and already-resolved embeds before awaiting optimistic media.
      // This guarantees upload failures still leave a server recovery draft.
      const previousAutoSavedDraftId =
        prePublishAutoSavedDraftIdsRef.current.get(castQueueId) ??
        activeDraftId;
      let autoSavedDraftId = await storeRecoveryDraft({
        draftId: previousAutoSavedDraftId,
      });
      let shouldRefreshRecoveryDraft = false;

      let firstQueuedCastString: string | undefined = undefined;
      let firstQueuedCastEmbeds: string[] | undefined = undefined;

      for (const queuedCast of queuedCasts) {
        const { lookupKey } = getOptimisticMediaLookupKey({
          castQueueId: castQueueId,
          castLocalKey: queuedCast.localKey,
        });

        const embedStateLookups = optimisticMediaEmbedsState[lookupKey];

        if (typeof embedStateLookups === 'undefined') {
          const mergedEmbeds = [...(queuedCast.embeds ?? [])];
          if (typeof tokenEmbedUrlForReply !== 'undefined') {
            // Preserve any pre-existing embeds on the queued cast (e.g. from
            // intent/draft hydration) and append the token URL while deduping.
            mergedEmbeds.push(tokenEmbedUrlForReply);
          }
          queuedCast.embeds = dedupeEmbedReferences(mergedEmbeds);

          if (typeof firstQueuedCastEmbeds === 'undefined') {
            firstQueuedCastEmbeds = queuedCast.embeds;
          }

          continue;
        }

        try {
          shouldRefreshRecoveryDraft = true;
          const { dedupedEmbeds } =
            await getDedupedEmbedsArrayFromOptimisticEmbeds({
              optimisticVideos: embedStateLookups.optimisticVideos,
              optimisticImages: embedStateLookups.optimisticImages,
              urls: embedStateLookups.urls,
            });

          // Keep the embeds captured at enqueue time as source-of-truth for
          // ordering/prioritization, then merge in any freshly resolved upload
          // URLs from optimistic state. This prevents valid link embeds from
          // being dropped when optimistic URL extraction diverges. When the
          // composer picked a token in a reply flow, also ensure the canonical
          // token embed URL is present.
          const queuedEmbeds = queuedCast.embeds ?? [];
          const mergedEmbeds = [...queuedEmbeds, ...dedupedEmbeds];
          if (typeof tokenEmbedUrlForReply !== 'undefined') {
            mergedEmbeds.push(tokenEmbedUrlForReply);
          }
          queuedCast.embeds = dedupeEmbedReferences(mergedEmbeds);

          const matchingClientProcessedEmbeds = new Map<
            string,
            ApiOpenGraphMetadata
          >();
          for (const embedReference of queuedCast.embeds) {
            const trimmedUrl = embedReference.trim();

            const cachedResult = cachedMetadataSnapshot.get(trimmedUrl);
            if (!cachedResult || cachedResult.status !== 'card_found') {
              continue;
            }

            const castUrlEmbed = buildApiCastUrlEmbedFromMetadata({
              requestedUrl: trimmedUrl,
              result: cachedResult,
            });

            matchingClientProcessedEmbeds.set(
              castUrlEmbed.openGraph.url,
              castUrlEmbed.openGraph,
            );
          }

          if (matchingClientProcessedEmbeds.size > 0) {
            queuedCast.clientProcessedOpenGraphMetadata = Array.from(
              matchingClientProcessedEmbeds.values(),
            );
          }

          if (typeof firstQueuedCastEmbeds === 'undefined') {
            firstQueuedCastEmbeds = queuedCast.embeds;
          }
        } catch (error) {
          markCastAsErrored({ queueId, error });

          return;
        }
      }

      if (shouldRefreshRecoveryDraft) {
        const refreshedDraftId = await storeRecoveryDraft({
          draftId: autoSavedDraftId ?? previousAutoSavedDraftId,
        });
        autoSavedDraftId = refreshedDraftId ?? autoSavedDraftId;
      }

      const postedCasts: { hash: string }[] = [];

      try {
        let nextParentCastHash = parentCastHash;
        let firstData: ApiCreateCast201Response | undefined = undefined;
        const publishedReplies: {
          parentCastHash: string;
          cast: ApiCast;
        }[] = [];

        for (let i = 0; i < queuedCasts.length; i++) {
          const queuedCast = queuedCasts[i];
          const castParentHash = nextParentCastHash;

          const queuedCastText = queuedCast.text.trim();

          if (typeof firstQueuedCastString === 'undefined') {
            firstQueuedCastString = queuedCastText;
          }

          const isLongCast =
            Buffer.byteLength(queuedCastText, 'utf-8') > regularCastByteLimit;

          trackEvent(AnalyticsEvent.CastMessage, {
            'is reply': typeof parentCastHash !== 'undefined' || i !== 0,
            'is channel': !!channelKey,
            'channel name': channelKey ?? '',
            'is long cast': isLongCast,
            'is caststorm': queuedCasts.length,
            'embed count': queuedCast.embeds.length,
            'char count': queuedCast.text.length,
          });

          const data = await createCast({
            fid: currentUserFid,
            castText: queuedCastText,
            parentCastHash: castParentHash,
            channelKey,
            tokenKey,
            embeds: queuedCast.embeds,
            clientProcessedOpenGraphMetadata:
              queuedCast.clientProcessedOpenGraphMetadata,
          });

          if (data === null) {
            trackError('Received empty response after casting');

            markCastAsErrored({ queueId });

            await deletePostedCasts({ postedCasts });

            return;
          }

          if (typeof castParentHash !== 'undefined') {
            // Reconcile after the queue leaves its publishing state so the
            // reply does not appear underneath an in-progress toast.
            publishedReplies.push({
              parentCastHash: castParentHash,
              cast: data.result.cast,
            });
          }

          if (!firstData) {
            firstData = data;
          }

          postedCasts.push({
            hash: data.result.cast.hash,
          });

          nextParentCastHash = data.result.cast.hash;
        }

        if (typeof autoSavedDraftId !== 'undefined') {
          try {
            await discardDraftCast({
              draftId: autoSavedDraftId,
              castChannelKey: undefined,
            });
          } catch (error) {
            trackError(JSON.stringify(error));
          }
          prePublishAutoSavedDraftIdsRef.current.delete(castQueueId);
        }

        if (
          typeof activeDraftId !== 'undefined' &&
          activeDraftId !== autoSavedDraftId
        ) {
          // The user published a draft they had opened for editing; remove the
          // original so it doesn't linger as a duplicate of the published cast.
          // Awaited + caught (was fire-and-forget) so a failed delete surfaces
          // instead of silently leaving the stale draft behind.
          try {
            await discardDraftCast({
              draftId: activeDraftId,
              castChannelKey: undefined,
            });
          } catch (error) {
            trackError(error);
          }
        }

        await setLocalDraft(undefined, localDraftKey);

        if (typeof firstData !== 'undefined') {
          for (const quoteReaction of quoteReactions) {
            trackCastReaction({
              castHash: quoteReaction.castHash,
              type: CastReactionType.Quote,
              undo: false,
              castFid: quoteReaction.castFid,
              ...(feed ? { feed } : {}),
              ...(includeReason ? { includeReason } : {}),
            });
          }

          if (typeof parentCastHash !== 'undefined') {
            trackCastReaction({
              castHash: parentCastHash,
              type: CastReactionType.Reply,
              undo: false,
              ...(includeReason ? { includeReason } : {}),
            });
          }

          return {
            castAuthorUsername: firstData.result.cast.author.username,
            castHash: firstData.result.cast.hash,
            castText: firstQueuedCastString,
            castChannelKey: channelKey,
            castEmbeds: firstQueuedCastEmbeds,
            castParent:
              typeof parentCastHash !== 'undefined'
                ? { type: 'cast' as const, hash: parentCastHash }
                : undefined,
            publishedReplies,
          };
        }
      } catch (error) {
        trackError(JSON.stringify(error));

        markCastAsErrored({ queueId, error });

        await deletePostedCasts({ postedCasts });
      }
    },
    [
      createCast,
      currentUserFid,
      deletePostedCasts,
      discardDraftCast,
      getCachedOpenGraphMetadataSnapshot,
      markCastAsErrored,
      optimisticMediaEmbedsState,
      regularCastByteLimit,
      state,
      storeDraftCaststorm,
      trackCastReaction,
      trackEvent,
    ],
  );

  return useCallback(
    async ({ queueId }: { queueId: string }) => {
      const payload = state[queueId];

      const onSuccess = payload.params.onSuccess;

      const [, result] = await Promise.all([
        // Always await at least 2.5 seconds for the queued casts toast animations. Otherwise too jarring.
        sleep(2_500),
        sendCast({ queueId }),
      ]);

      if (typeof result !== 'undefined') {
        try {
          if (typeof result.castAuthorUsername !== 'undefined') {
            prefetchThread({
              castHashPrefix: getCastHashPrefix({ castHash: result.castHash }),
              username: result.castAuthorUsername,
            });
          }
        } catch {
          // No-op: we don't care if prefetching fails above - continue to mark as published.
        }

        dispatch({
          type: 'MarkAsPublished',
          queueId,
          castAuthorUsername: result.castAuthorUsername,
          castHash: result.castHash,
        });
        for (const publishedReply of result.publishedReplies) {
          optimisticallyAddNewCastToThread(publishedReply);
        }

        if (typeof onSuccess === 'undefined') {
          // Potentially request App Store review after a successful cast
          onAfterSuccessfulCast();
        }

        if (typeof onSuccess !== 'undefined') {
          onSuccess({
            hash: result.castHash,
            text: result.castText,
            channelKey: payload.params.channelKey,
            parent: result.castParent,
            // @ts-expect-error-next-line The embed array typing here is a bit odd
            embeds: result.castEmbeds,
          });
        }
      }
    },
    [
      dispatch,
      onAfterSuccessfulCast,
      optimisticallyAddNewCastToThread,
      prefetchThread,
      sendCast,
      state,
    ],
  );
}

export { getDedupedEmbedsArrayFromOptimisticEmbeds, useSubmitCastsInQueue };
