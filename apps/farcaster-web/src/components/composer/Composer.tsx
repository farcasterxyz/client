import { ComposeCast } from '@farcaster/miniapp-core';
import classNames from 'classnames';
import { ContentState, EditorState, Modifier } from 'draft-js';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastBody,
  ApiCastHash,
  ApiCaststormBody,
  ApiCaststormDraft,
  ApiCastUrlEmbed,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';
import {
  buildApiCastUrlEmbedFromMetadata,
  CastReactionType,
  CastToDelete,
  // FetchOpenGraphMetadataCardFoundResult,
  FULL_CAST_HASH_RE,
  getEmbedType,
  ImageUploadError,
  MAX_VIDEO_LENGTH_MINUTES,
  MAX_VIDEO_LENGTH_SECONDS,
  parseCastUrl,
  SHORT_CAST_HASH_PREFIX_RE,
  useCastComposerEmbeds,
  useCreateCast,
  useDeleteCast,
  useDiscardDraftCast,
  useFetchImageUploadUrl,
  useFetchOpenGraphMetadata,
  useOptimisticallyAddNewCastToThread,
  useProcessCastAttachments,
  useSetCastAttachmentCache,
  useStoreDraftCaststorm,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import React, { useCallback, useRef, useState } from 'react';

import { ScheduledCastComposerBanner } from '~/components/banners/ScheduledCastBanner';
import { CastLengthCounter } from '~/components/composer/components/CastLengthCounter';
import { ComposerChannelSelector } from '~/components/composer/components/ComposerChannelSelector';
import { ComposerParentCast } from '~/components/composer/components/ComposerParentCast';
import { EmojiComposerPicker } from '~/components/composer/pickers/EmojiComposerPicker';
import { MediaComposerPicker } from '~/components/composer/pickers/MediaComposerPicker';
import { FarcasterProUnlockFeaturesModal } from '~/components/farcasterPro/FarcasterProUnlockFeaturedModal';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { AlertModal } from '~/components/modals/AlertModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import {
  ComposerParentCastProvider,
  useComposer,
} from '~/contexts/ComposerParentCastProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useOptimisticUploadCloudflareImage } from '~/hooks/data/useOptimisticUploadCloudflareImage';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';
import { CastComposerIntent } from '~/types';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

import { ChannelSelectorSuspenseFallback } from './components/ChannelSelectorSuspenseFallback';
import {
  getComposerAttachmentLimitMessage,
  showComposerAttachmentLimitToast,
} from './composerAttachmentLimitToast';
import { getEmbedUrlsForLocalKey } from './composerStateDefaults';
import {
  LocallyProbedImage,
  LocallyProbedVideo,
  OptimisticMediaEmbedsProvider,
  useOptimisticMediaEmbeds,
} from './context/OptimisticMediaEmbedsProvider';
import {
  getActiveDraftLocalDraftKey,
  getLocalDraft,
  getReplyLocalDraftKey,
  LOCAL_DRAFT_TOP_LEVEL_KEY,
  LocalDraft,
  setLocalDraft,
} from './LocalDrafts';
import { QueueCastButton } from './QueueCastButton';
import { QueuedCast, QueuedCastInfo } from './QueuedCast';

function probeVideo(
  blob: File,
): Promise<LocallyProbedVideo & { duration: number }> {
  return new Promise((res, rej) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(blob);

    v.preload = 'metadata';
    v.src = url;
    v.onloadedmetadata = () =>
      res({
        src: url,
        w: v.videoWidth,
        h: v.videoHeight,
        duration: v.duration,
      });
    v.onerror = () => rej(new Error('cant-read-video'));
  });
}

async function probeImage(file: File): Promise<LocallyProbedImage> {
  const src = URL.createObjectURL(file);
  const bmp = await createImageBitmap(file, { colorSpaceConversion: 'none' });
  const w = bmp.width;
  const h = bmp.height;

  return { src, w, h };
}

const MAX_QUEUED_CASTS = 10;

const VISIBILITY_AUTO_SAVE_THROTTLE_MS = 15_000;

type ComposerActionOverride = {
  label: string;
  onClick: ({ cast }: { cast: ApiCastBody }) => void;
};

function getCastHashFromEmbedReference(value: string): string | undefined {
  const trimmed = value.trim();

  if (
    FULL_CAST_HASH_RE.test(trimmed) ||
    SHORT_CAST_HASH_PREFIX_RE.test(trimmed)
  ) {
    return trimmed.toLowerCase();
  }

  const parsed = parseCastUrl(trimmed);
  return parsed.kind === 'not-cast-url' ? undefined : parsed.hashSegment;
}

function getSubmittedCastHashReferences(embeds: string[]): string[] {
  return embeds.flatMap((embed) => {
    const castHash = getCastHashFromEmbedReference(embed);
    return typeof castHash === 'undefined' ? [] : [castHash];
  });
}

function quoteCastMatchesSubmittedReference({
  quoteCast,
  submittedHashReferences,
}: {
  quoteCast: ApiQuoteCastEmbed;
  submittedHashReferences: string[];
}) {
  return submittedHashReferences.some((reference) =>
    quoteCast.hash.toLowerCase().startsWith(reference.toLowerCase()),
  );
}

type ComposerProps = {
  placeholder: string;
  intent?: CastComposerIntent;
  onForceCloseWrappingModal?: () => void;
  onClose?: (cast: ComposeCast.Result<false>['cast'] | undefined) => void;
  actionOverride?: ComposerActionOverride;
  activeDraft?: ApiCaststormDraft;
  isIntentFromSearchParams?: boolean;
};

function updateQueuedCasts(
  oldQueuedCasts: QueuedCastInfo[],
  updatedCast: Partial<QueuedCastInfo> & { localKey: number },
): QueuedCastInfo[] {
  const newQueuedCasts = [];
  for (const queuedCast of oldQueuedCasts) {
    if (queuedCast.localKey === updatedCast.localKey) {
      newQueuedCasts.push({ ...queuedCast, ...updatedCast });
    } else {
      newQueuedCasts.push(queuedCast);
    }
  }
  return newQueuedCasts;
}

const emptyQueuedCast = {
  editorState: EditorState.createEmpty(),
};

function getComposerLocalDraftKey({
  activeDraftId,
  hasActionOverride,
  parentCastHash,
}: {
  activeDraftId: string | undefined;
  hasActionOverride: boolean;
  parentCastHash: string | undefined;
}): string | undefined {
  if (hasActionOverride) {
    return undefined;
  }
  if (typeof activeDraftId !== 'undefined') {
    return getActiveDraftLocalDraftKey(activeDraftId);
  }
  if (typeof parentCastHash !== 'undefined') {
    return getReplyLocalDraftKey(parentCastHash);
  }
  return LOCAL_DRAFT_TOP_LEVEL_KEY;
}

function hasPresetComposerContent(
  intent: CastComposerIntent | undefined,
): boolean {
  return (
    typeof intent?.text !== 'undefined' ||
    (intent?.embeds?.length ?? 0) > 0 ||
    (intent?.draftCasts?.length ?? 0) > 0
  );
}

const Composer = React.forwardRef<
  {
    shouldPromptOnClose: () => boolean;
    getComposerState: () => {
      caststorm: ApiCaststormBody;
    };
  },
  ComposerProps
>((props, ref) => {
  return (
    <ComposerParentCastProvider>
      <OptimisticMediaEmbedsProvider>
        <ComposerInner {...props} ref={ref} />
      </OptimisticMediaEmbedsProvider>
    </ComposerParentCastProvider>
  );
});

const ComposerInner = React.forwardRef<
  {
    shouldPromptOnClose: () => boolean;
    getComposerState: () => {
      caststorm: ApiCaststormBody;
    };
  },
  ComposerProps
>(
  (
    {
      placeholder,
      intent: initialIntent,
      onForceCloseWrappingModal,
      onClose,
      actionOverride,
      activeDraft,
      isIntentFromSearchParams,
    },
    composerRef,
  ) => {
    const { trackEvent } = useAnalytics();
    const currentUser = useCurrentUser();
    const createCast = useCreateCast();
    const optimisticallyAddNewCastToThread =
      useOptimisticallyAddNewCastToThread('bottom');
    const processCastAttachments = useProcessCastAttachments();
    const trackCastReaction = useTrackCastReaction();
    const setCastAttachmentCache = useSetCastAttachmentCache();
    const storeDraftCaststorm = useStoreDraftCaststorm();
    const navigateToConversation = useNavigateToConversation();
    const uploadOptimisticCloudflareImage =
      useOptimisticUploadCloudflareImage();

    // Separate out the parent cast hash immediately when we need the intent so its not getting messed up back and forth with
    // random changes component lifecycle.
    const parentCastHash =
      typeof initialIntent !== 'undefined' && initialIntent.parentCastHash
        ? initialIntent.parentCastHash
        : undefined;
    const initialIncludeReason = initialIntent?.includeReason;

    const [intent, setIntent] = useState<CastComposerIntent | undefined>(
      initialIntent,
    );
    const localDraftKey = React.useMemo(
      () =>
        getComposerLocalDraftKey({
          activeDraftId: initialIntent?.activeDraftId,
          hasActionOverride: typeof actionOverride !== 'undefined',
          parentCastHash,
        }),
      [actionOverride, initialIntent?.activeDraftId, parentCastHash],
    );
    const isActiveDraftLocalRecovery =
      typeof intent?.activeDraftId !== 'undefined' &&
      localDraftKey === getActiveDraftLocalDraftKey(intent.activeDraftId);
    const canUseLocalDraftRecovery =
      typeof localDraftKey !== 'undefined' &&
      (isActiveDraftLocalRecovery || !hasPresetComposerContent(intent));

    const [scheduledAt, setScheduledAt] = React.useState<Date | undefined>(
      intent?.scheduledAt,
    );

    const [focusedCastLocalKey, setFocusedCastLocalKey] =
      React.useState<number>(0);

    const { clearParentCast } = useComposer();

    const [queuedCasts, setQueuedCasts] = React.useState<QueuedCastInfo[]>(
      () => [
        {
          localKey: 0,
          ...emptyQueuedCast,
        },
      ],
    );
    const queuedCastLocalKeys = React.useMemo(
      () => queuedCasts.map(({ localKey }) => localKey),
      [queuedCasts],
    );

    const updateCurrentCast = React.useCallback(
      (
        oldQueuedCasts: QueuedCastInfo[],
        updatedCast:
          | Partial<QueuedCastInfo>
          | ((current: QueuedCastInfo) => QueuedCastInfo),
      ) =>
        oldQueuedCasts.map((queuedCast: QueuedCastInfo) => {
          if (queuedCast.localKey !== focusedCastLocalKey) {
            return queuedCast;
          }
          return typeof updatedCast === 'function'
            ? updatedCast(queuedCast)
            : { ...queuedCast, ...updatedCast };
        }),
      [focusedCastLocalKey],
    );

    const setCurrentCastEditorState = React.useCallback(
      (newEditorState: EditorState) => {
        setQueuedCasts((oldQueuedCasts) =>
          updateCurrentCast(oldQueuedCasts, (current: QueuedCastInfo) => {
            const decorator = current.editorState.getDecorator();
            let es = newEditorState;
            if (decorator && !es.getDecorator()) {
              es = EditorState.set(es, { decorator });
            }
            return { ...current, editorState: es };
          }),
        );
      },
      [updateCurrentCast],
    );

    const updateCast = React.useCallback(
      (updatedCast: Partial<QueuedCastInfo> & { localKey: number }) => {
        setQueuedCasts((oldQueuedCasts) =>
          updateQueuedCasts(oldQueuedCasts, updatedCast),
        );
      },
      [],
    );

    const updateEditorState = React.useCallback(
      (localKey: number, editorState: EditorState) => {
        updateCast({ localKey, editorState });
      },
      [updateCast],
    );

    const [allOptimisticImages, setAllOptimisticImages] = React.useState<{
      [localKey: number]: {
        [imageUrl: string]: Promise<Response>;
      };
    }>({});
    const setOptimisticImages = React.useCallback(
      (
        localKey: number,
        optimisticImages: { [imageUrl: string]: Promise<Response> } | undefined,
      ) => {
        setAllOptimisticImages((prevAllOptimisticImages) => {
          if (!optimisticImages) {
            const result = { ...prevAllOptimisticImages };
            delete result[localKey];
            return result;
          }
          return {
            ...prevAllOptimisticImages,
            [localKey]: optimisticImages,
          };
        });
      },
      [],
    );

    const {
      regularCastByteLimit,
      longCastByteLimit: maxCastLength,
      castEmbedLimit,
    } = useUserAppContext();

    const { fetchOpenGraphMetadata } = useFetchOpenGraphMetadata();

    // Mutable ref populated after the hook call so resolveUrlEmbedsOnFailure
    // can read fresh snap URLs without depending on the whole embed store.
    const getSnapEmbedUrlsRef = React.useRef<
      (castLocalKey: number) => string[]
    >(() => []);

    // Synthesizes fallback OG metadata for URLs that the backend crawl
    // couldn't resolve. Checks canonical state for snap entries first so
    // freshly-published snap URLs (which the backend hasn't ingested yet)
    // render through the SnapEmbedAttachment path immediately.
    const resolveUrlEmbedsOnFailure = useCallback(
      async ({
        castLocalKey,
        urls,
      }: {
        castLocalKey: number;
        urls: string[];
      }) => {
        if (urls.length === 0) {
          return [];
        }

        const fallbackEmbeds = new Map<string, ApiCastUrlEmbed>();
        const knownSnapUrls = new Set(
          getSnapEmbedUrlsRef.current(castLocalKey),
        );

        for (const url of urls) {
          // If we just published this URL as a snap, we already know its type:
          // synthesize an embed with the `openGraph.snap` marker so the
          // composer renders it through `SnapEmbedAttachment` (which fetches
          // the snap payload at render time via `useFetchSnap`). This
          // short-circuits the prod OG crawl, which can't reach localhost and
          // may not have ingested a fresh publish yet.
          if (knownSnapUrls.has(url)) {
            fallbackEmbeds.set(url, {
              type: 'url',
              openGraph: {
                url,
                snap: { url },
              },
            });
            continue;
          }

          try {
            const metadataResult = await fetchOpenGraphMetadata(url);

            if (metadataResult.status !== 'card_found') {
              continue;
            }

            const embed = buildApiCastUrlEmbedFromMetadata({
              requestedUrl: url,
              result: metadataResult,
            });

            fallbackEmbeds.set(embed.openGraph.url, embed);
          } catch (error) {
            trackError(error);
          }
        }

        return Array.from(fallbackEmbeds.values());
      },
      [fetchOpenGraphMetadata],
    );

    const [, dispatch] = useOptimisticMediaEmbeds();
    const [imageUploadFailureMessage, setImageUploadFailureMessage] = useState<
      string | undefined
    >();

    const handleImageUploadFailure = useCallback(
      ({
        castLocalKey,
        localUriRef,
        message,
      }: {
        castLocalKey: number;
        localUriRef: string;
        message: string;
      }) => {
        dispatch({
          type: 'RemoveImage',
          castLocalKey,
          image: localUriRef,
        });
        setImageUploadFailureMessage(message);
      },
      [dispatch],
    );

    const castComposerEmbedsReturn = useCastComposerEmbeds({
      castLocalKeys: queuedCastLocalKeys,
      maxEmbedsLength: castEmbedLimit,
      uploadCloudflareImage: uploadOptimisticCloudflareImage,
      trackError,
      resolveUrlEmbedsOnFailure,
      onImageUploadFailure: handleImageUploadFailure,
    });

    const {
      embedUrls,
      draftEmbedUrls,
      processedEmbeds,
      getSnapEmbedUrls,
      addMediaEmbed: _addMediaEmbed,
      cancelActiveVideoUpload,
      getCanAddMoreEmbeds,
      getRemainingEmbedsCount,
      detailedUploadingErrors,
      setEmbedsFromDraftCast,
      setEmbedsFromAllDraftCasts,
      getEmbedsToSubmit,
      hasPendingMediaUploads,
      uploadingStatuses,
    } = castComposerEmbedsReturn;

    // Keep the ref in sync so resolveUrlEmbedsOnFailure sees fresh snap state.
    getSnapEmbedUrlsRef.current = getSnapEmbedUrls;

    const [showDetailedUploadingError, setShowDetailedUploadingError] =
      useState<number | undefined>();

    const fetchImageUploadUrl = useFetchImageUploadUrl();

    const addMediaEmbed = useCallback(
      async ({ file }: { file: File }) => {
        const finalImageUploaderPromise = fetchImageUploadUrl();

        const fileType = getEmbedType(file.name);

        if (fileType === 'video') {
          // Use a <video> element to check the duration of the video
          // Because the element is not attached to the DOM, it's not visible and will be
          // garbade collected

          const video = await probeVideo(file);

          if (video.h <= 100 || video.w <= 100) {
            toast({
              message: `Video resolution too low`,
              type: 'error',
              toastId: 'video-low-res',
            });

            return;
          }

          if (video.duration > MAX_VIDEO_LENGTH_SECONDS) {
            toast({
              message: `Video is longer than ${MAX_VIDEO_LENGTH_MINUTES} minutes`,
              type: 'error',
              toastId: 'video-too-long',
            });

            return;
          }

          dispatch({
            type: 'AddVideo',
            castLocalKey: focusedCastLocalKey,
            video: video,
          });

          _addMediaEmbed({
            file,
            localUriRef: video.src,
            imageUploaderPromise: finalImageUploaderPromise,
            castLocalKey: focusedCastLocalKey,
          });
        } else {
          const image = await probeImage(file);

          dispatch({
            type: 'AddImage',
            castLocalKey: focusedCastLocalKey,
            image: image,
          });

          _addMediaEmbed({
            file: file,
            localUriRef: image.src,
            imageUploaderPromise: finalImageUploaderPromise,
            castLocalKey: focusedCastLocalKey,
          });
        }
      },
      [_addMediaEmbed, dispatch, fetchImageUploadUrl, focusedCastLocalKey],
    );

    const [channelKey, setChannelKey] = React.useState<string | undefined>(
      intent?.channelKey,
    );

    const loadedURLEmbedsFromIntents = React.useMemo(() => {
      return (
        typeof intent !== 'undefined' &&
        typeof intent.embeds !== 'undefined' &&
        intent.embeds.length !== 0
      );
    }, [intent]);

    const focusedCast = queuedCasts.find(
      (queuedCast: QueuedCastInfo) =>
        queuedCast.localKey === focusedCastLocalKey,
    );
    if (!focusedCast) {
      throw new Error(`could not find ${focusedCastLocalKey} in queuedCasts!`);
    }

    const getText = (queuedCast: QueuedCastInfo) => {
      const editorPlainText = queuedCast.editorState
        .getCurrentContent()
        .getPlainText();
      return `${editorPlainText}`.trim().replaceAll(/\n{2,}/gi, '\n\n');
    };
    const focusedCastText = getText(focusedCast);

    const focusedCastEmbedUrls = getEmbedUrlsForLocalKey({
      embedUrls,
      localKey: focusedCastLocalKey,
    });

    const castParent = React.useMemo(() => {
      return typeof intent !== 'undefined' &&
        typeof intent.parentCastHash !== 'undefined'
        ? { hash: intent.parentCastHash }
        : undefined;
    }, [intent]);

    const castTextByteLength = React.useMemo(() => {
      return Buffer.byteLength(focusedCastText, 'utf-8');
    }, [focusedCastText]);

    const isReply = React.useMemo(() => {
      return (
        typeof intent !== 'undefined' &&
        typeof intent.parentCastHash !== 'undefined'
      );
    }, [intent]);

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const submissionGuardRef = useRef(false);
    const canCreateCast = React.useMemo(() => {
      return (
        queuedCasts.every((queuedCast: QueuedCastInfo) => {
          const text = queuedCast.editorState
            .getCurrentContent()
            .getPlainText()
            .trim();
          return (
            (text.length > 0 ||
              (embedUrls[queuedCast.localKey] &&
                embedUrls[queuedCast.localKey].length !== 0)) &&
            Buffer.byteLength(text, 'utf-8') <= maxCastLength
          );
        }) &&
        Object.values(uploadingStatuses).every(
          (uploadingStatus) => !uploadingStatus,
        ) &&
        !hasPendingMediaUploads &&
        // We can't just check the length of Object values because we are setting
        // undefined as a value on these arrays.
        Object.values(castComposerEmbedsReturn.uploadingErrors).every(
          (err) => !err,
        )
      );
    }, [
      castComposerEmbedsReturn.uploadingErrors,
      embedUrls,
      hasPendingMediaUploads,
      maxCastLength,
      queuedCasts,
      uploadingStatuses,
    ]);

    const discardDraftCast = useDiscardDraftCast();
    const deleteCast = useDeleteCast();
    const hasMultipleCasts = queuedCasts.length > 1;

    const hasUnsavedContent = React.useMemo(
      () =>
        queuedCasts.some(
          (queuedCast) =>
            !!getText(queuedCast) ||
            (embedUrls[queuedCast.localKey] &&
              embedUrls[queuedCast.localKey].length > 0),
        ),
      [queuedCasts, embedUrls],
    );
    const hasRecoverableLocalContent = hasUnsavedContent;

    const getCurrentCaststorm = React.useCallback(
      (): ApiCaststormBody => ({
        casts: queuedCasts.map((queuedCast) => ({
          text: getText(queuedCast),
          embeds: draftEmbedUrls[queuedCast.localKey] ?? [],
        })),
        parent: castParent,
        channelKey,
      }),
      [queuedCasts, draftEmbedUrls, castParent, channelKey],
    );

    const clearLocalDraftForCurrentComposer = React.useCallback(() => {
      if (typeof localDraftKey !== 'undefined') {
        setLocalDraft(undefined, localDraftKey);
      }
      if (localDraftKey === LOCAL_DRAFT_TOP_LEVEL_KEY) {
        setLocalDraft(undefined);
      }
    }, [localDraftKey]);

    // Tracks the auto-save draft created during this composer session.
    // We discard the previous one before each new save to avoid accumulating
    // duplicate drafts across pre-publish saves and visibilitychange saves.
    const autoSavedDraftIdRef = React.useRef<string | undefined>(undefined);
    const isAutoSavingRef = React.useRef(false);
    // Holds the Promise of an in-flight save so concurrent callers (e.g. a
    // visibilitychange-triggered save followed immediately by the
    // pre-publish save in onCastClick) can await the running save's
    // completion instead of returning a stale `autoSavedDraftIdRef`. See
    // PR #9806 review for the original race.
    const inFlightAutoSavePromiseRef = React.useRef<Promise<
      string | undefined
    > | null>(null);
    const lastAutoSaveAtRef = React.useRef<number>(0);

    const runAutoSaveDraft = React.useCallback((): Promise<
      string | undefined
    > => {
      if (isAutoSavingRef.current && inFlightAutoSavePromiseRef.current) {
        return inFlightAutoSavePromiseRef.current;
      }
      if (!hasUnsavedContent) {
        return Promise.resolve(undefined);
      }
      isAutoSavingRef.current = true;
      const autoSavePromise = (async (): Promise<string | undefined> => {
        try {
          const caststorm = getCurrentCaststorm();
          const previousDraftId = autoSavedDraftIdRef.current;
          const response = await storeDraftCaststorm({ caststorm });
          const newDraftId = response.result.draft.draftId;
          autoSavedDraftIdRef.current = newDraftId;
          lastAutoSaveAtRef.current = Date.now();
          if (previousDraftId && previousDraftId !== newDraftId) {
            try {
              await discardDraftCast({
                draftId: previousDraftId,
                castChannelKey: undefined,
              });
            } catch (e) {
              trackError(e);
            }
          }
          return newDraftId;
        } catch (e) {
          trackError(e);
          return undefined;
        } finally {
          isAutoSavingRef.current = false;
        }
      })();
      inFlightAutoSavePromiseRef.current = autoSavePromise;
      // Clear the in-flight slot once the promise settles, but only if the
      // ref still points at this same promise (a later run may have
      // already swapped it).
      void autoSavePromise.finally(() => {
        if (inFlightAutoSavePromiseRef.current === autoSavePromise) {
          inFlightAutoSavePromiseRef.current = null;
        }
      });
      return autoSavePromise;
    }, [
      discardDraftCast,
      getCurrentCaststorm,
      hasUnsavedContent,
      storeDraftCaststorm,
    ]);

    // Show the browser's default "Leave site?" dialog when the user reloads
    // or closes the tab while there is recoverable composer content.
    React.useEffect(() => {
      if (!hasRecoverableLocalContent) {
        return undefined;
      }
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        // Required for Chrome/older browsers to actually show the dialog.
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }, [hasRecoverableLocalContent]);

    // Best-effort auto-save when the tab is hidden (covers tab close, reload
    // confirmation, and switching to another tab). Throttled so rapid tab
    // switching doesn't generate duplicate drafts.
    const runAutoSaveDraftRef = React.useRef(runAutoSaveDraft);
    runAutoSaveDraftRef.current = runAutoSaveDraft;
    React.useEffect(() => {
      if (!hasUnsavedContent) {
        return undefined;
      }
      const handler = () => {
        if (document.visibilityState !== 'hidden') {
          return;
        }
        const now = Date.now();
        if (
          now - lastAutoSaveAtRef.current <
          VISIBILITY_AUTO_SAVE_THROTTLE_MS
        ) {
          return;
        }
        // Fire-and-forget. Modern browsers keep the in-flight POST alive
        // briefly during page hide.
        runAutoSaveDraftRef.current().catch((e) => trackError(e));
      };
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    }, [hasUnsavedContent]);

    const onCastClick = React.useCallback(async () => {
      if (submissionGuardRef.current) {
        return;
      }
      submissionGuardRef.current = true;

      try {
        if (scheduledAt) {
          trackEvent(AnalyticsEvent.CastComposerSchedulePressed, {
            castCount: queuedCasts.length,
          });
          trackEvent(AnalyticsEvent.ScheduleCast, {
            'is caststrorm': queuedCasts.length,
          });

          const caststorm = getCurrentCaststorm();

          await storeDraftCaststorm({ caststorm, scheduledAt });

          if (typeof activeDraft !== 'undefined') {
            discardDraftCast({
              draftId: activeDraft.draftId,
              castChannelKey: undefined,
            });
          }
          clearLocalDraftForCurrentComposer();
          onClose?.(undefined);
          return;
        }

        if (!canCreateCast) {
          return;
        }

        if (typeof actionOverride !== 'undefined') {
          actionOverride.onClick({
            cast: {
              text: focusedCastText,
              channelKey,
              parent:
                typeof intent !== 'undefined' &&
                intent.parentCastHash !== 'undefined'
                  ? {
                      hash: intent.parentCastHash as ApiCastHash,
                    }
                  : undefined,
              embeds: focusedCastEmbedUrls,
            },
          });
          return;
        }

        trackEvent(AnalyticsEvent.CastComposerSubmitPressed, {
          isReply,
          castCount: queuedCasts.length,
          hasChannel: Boolean(channelKey),
          hasEmbeds: Object.values(embedUrls).some((urls) => urls.length !== 0),
          isScheduled: typeof scheduledAt !== 'undefined',
        });

        setIsSubmitting(true);

        // Save the current composer state as a draft before attempting to
        // publish. If publish fails, this draft remains for recovery; on
        // success it is discarded below. Failure to save is non-fatal — we
        // proceed with publish either way.
        await runAutoSaveDraft();

        // Make sure we finish all image uploads
        try {
          const imagePromises = [];
          for (const optimisticImages of Object.values(allOptimisticImages)) {
            imagePromises.push(...Object.values(optimisticImages));
          }
          const results = await Promise.all(imagePromises);

          for (const result of results) {
            const response: {
              success: boolean;
              result: { variants: string[] };
            } = await result.json();

            if (
              typeof response === 'undefined' ||
              !response.success ||
              typeof response.result.variants === 'undefined'
            ) {
              throw new Error('Cloudflare failed to upload image');
            }
          }
        } catch (e) {
          toast({
            message: 'Failed to upload image for the cast',
            type: 'error',
            toastId: 'upload-image-failed',
          });
          setIsSubmitting(false);
          trackError(new ImageUploadError({ error: e }));
          return;
        }

        const postedCasts: CastToDelete[] = [];
        const deletePostedCasts = () =>
          Promise.all(postedCasts.map((cast) => deleteCast({ cast })));

        try {
          const quoteReactions: {
            castHash: string;
            castFid: number;
          }[] = [];
          const submittedEmbedsByCast = await Promise.all(
            queuedCasts.map(async (queuedCast) => ({
              localKey: queuedCast.localKey,
              embeds: await getEmbedsToSubmit(queuedCast.localKey),
            })),
          );

          for (const { localKey, embeds } of submittedEmbedsByCast) {
            const submittedHashReferences =
              getSubmittedCastHashReferences(embeds);
            if (submittedHashReferences.length === 0) {
              continue;
            }

            let submittedQuoteCasts =
              processedEmbeds[localKey]?.casts?.filter((quoteCast) =>
                quoteCastMatchesSubmittedReference({
                  quoteCast,
                  submittedHashReferences,
                }),
              ) ?? [];

            if (submittedQuoteCasts.length < submittedHashReferences.length) {
              try {
                const data = await processCastAttachments({
                  text: '',
                  embeds,
                });
                submittedQuoteCasts =
                  data.result.embeds?.casts?.filter((quoteCast) =>
                    quoteCastMatchesSubmittedReference({
                      quoteCast,
                      submittedHashReferences,
                    }),
                  ) ?? [];
              } catch (error) {
                trackError(error);
                submittedQuoteCasts = [];
              }
            }

            quoteReactions.push(
              ...submittedQuoteCasts.map((quoteCast) => ({
                castHash: quoteCast.hash,
                castFid: quoteCast.author.fid,
              })),
            );
          }

          let isFirst = true;
          for (const queuedCast of queuedCasts) {
            const isLongCast =
              Buffer.byteLength(getText(queuedCast), 'utf-8') >
              regularCastByteLimit;
            trackEvent(AnalyticsEvent.CastMessage, {
              'is reply': isReply || !isFirst,
              'is channel': !!channelKey,
              'channel name': channelKey || '',
              'is long cast': isLongCast,
              'is from intent': !!isIntentFromSearchParams,
              'is caststrorm': queuedCasts.length,
              'is scheduled': typeof scheduledAt !== 'undefined',
            });
            isFirst = false;
          }

          let nextParentCastHash = parentCastHash;
          let firstData;
          const publishedReplies: {
            parentCastHash: string;
            cast: ApiCast;
          }[] = [];
          for (const queuedCast of queuedCasts) {
            const castParentHash = nextParentCastHash;
            const embeds =
              submittedEmbedsByCast.find(
                ({ localKey }) => localKey === queuedCast.localKey,
              )?.embeds ?? [];

            if (embeds.length > castEmbedLimit) {
              throw new Error(
                getComposerAttachmentLimitMessage(castEmbedLimit),
                { cause: 'max_embed_limit' },
              );
            }

            const data = await createCast({
              fid: currentUser.fid,
              castText: getText(queuedCast),
              parentCastHash: castParentHash,
              embeds,
              channelKey,
            });

            if (!firstData) {
              firstData = data;
            }

            if (data === null) {
              await deletePostedCasts();
              throw new Error('data was null: Composer:createCast');
            }

            if (typeof castParentHash !== 'undefined') {
              // Reconcile after the composer leaves its submitting state so
              // the reply and completion UI appear together.
              publishedReplies.push({
                parentCastHash: castParentHash,
                cast: data.result.cast,
              });
            }

            const { hash } = data.result.cast;
            const authorFid = data.result.cast.author.fid;

            // If we already queried the attachment instead of waiting for feed
            // regen we will just cache the open graph preview on the client.
            const castProcessedEmbeds = processedEmbeds[queuedCast.localKey];
            if (castProcessedEmbeds) {
              setCastAttachmentCache({
                embeds: castProcessedEmbeds,
                castText: data.result.cast.text,
                fid: authorFid,
                hash,
              });
            }

            postedCasts.push({
              hash,
              author: {
                fid: authorFid,
              },
              ...(channelKey
                ? {
                    channel: {
                      key: channelKey,
                    },
                  }
                : undefined),
            });
            nextParentCastHash = hash;
          }

          const firstResult = firstData?.result;
          if (!firstResult) {
            // Error handled above
            return;
          }

          for (const quoteReaction of quoteReactions) {
            trackCastReaction({
              castHash: quoteReaction.castHash,
              type: CastReactionType.Quote,
              undo: false,
              castFid: quoteReaction.castFid,
              ...(initialIncludeReason
                ? { includeReason: initialIncludeReason }
                : {}),
            });
          }

          if (typeof parentCastHash !== 'undefined') {
            trackCastReaction({
              castHash: parentCastHash,
              type: CastReactionType.Reply,
              undo: false,
              ...(initialIncludeReason
                ? { includeReason: initialIncludeReason }
                : {}),
            });
          }

          // Discard the auto-saved pre-publish draft, if any. The
          // explicit `intent.activeDraftId` is also discarded as a fallback
          // for the case where pre-publish save failed.
          const autoSavedDraftId = autoSavedDraftIdRef.current;
          if (typeof autoSavedDraftId !== 'undefined') {
            try {
              await discardDraftCast({
                draftId: autoSavedDraftId,
                castChannelKey: undefined,
              });
            } catch (e) {
              trackError(e);
            }
            autoSavedDraftIdRef.current = undefined;
          }

          if (
            typeof intent !== 'undefined' &&
            typeof intent.activeDraftId !== 'undefined' &&
            intent.activeDraftId !== autoSavedDraftId
          ) {
            discardDraftCast({
              draftId: intent?.activeDraftId,
              castChannelKey: undefined,
            });
          }

          // Cast was published successfully — drop the local-first draft
          // so the next composer launch is fresh.
          clearLocalDraftForCurrentComposer();

          setQueuedCasts([
            {
              localKey: nextCastLocalKeyRef.current++,
              ...emptyQueuedCast,
            },
          ]);

          onForceCloseWrappingModal?.();

          // on success, set submitting state to false, close the composer, and show a toast
          // TODO: Add embeds and channel key
          setIsSubmitting(false);
          onClose?.({
            hash: firstResult.cast.hash,
            text: firstResult.cast.text,
            channelKey: firstResult.cast.channel?.key,
            parent: firstResult.cast.parentHash
              ? {
                  type: 'cast',
                  hash: firstResult.cast.parentHash,
                }
              : undefined,
          });
          for (const publishedReply of publishedReplies) {
            optimisticallyAddNewCastToThread(publishedReply);
          }

          const castOrCasts = hasMultipleCasts ? 'Casts' : 'Cast';
          toast({
            message: (
              <span className={'flex-row'}>
                {castOrCasts} created successfully.{' '}
                <span
                  onClick={() => {
                    navigateToConversation({
                      castHash: firstResult.cast.hash,
                      authorUsername: firstResult.cast.author.username,
                    });
                  }}
                >
                  <b>View</b>
                </span>
              </span>
            ),
            toastId: `cast-created-success-${firstResult.cast.hash}`,
            position: 'bottom-center',
          });
        } catch (e) {
          const err = e as Error;
          const hasAutoSavedDraft =
            typeof autoSavedDraftIdRef.current !== 'undefined';

          if (
            typeof err.cause !== 'undefined' &&
            err.cause === 'max_embed_limit'
          ) {
            toast({
              message: err.message,
              type: 'error',
              toastId: 'create-cast-failed',
            });
          } else {
            toast({
              message: hasAutoSavedDraft
                ? 'Failed to create cast. Saved as draft.'
                : 'Failed to create cast',
              type: 'error',
              toastId: 'create-cast-failed',
            });
          }

          await deletePostedCasts();
          setIsSubmitting(false);
          trackError(e);
        }
      } finally {
        submissionGuardRef.current = false;
      }
    }, [
      actionOverride,
      activeDraft,
      allOptimisticImages,
      canCreateCast,
      castEmbedLimit,
      channelKey,
      clearLocalDraftForCurrentComposer,
      createCast,
      currentUser.fid,
      deleteCast,
      discardDraftCast,
      embedUrls,
      focusedCastEmbedUrls,
      focusedCastText,
      getEmbedsToSubmit,
      hasMultipleCasts,
      intent,
      isIntentFromSearchParams,
      isReply,
      navigateToConversation,
      onClose,
      onForceCloseWrappingModal,
      optimisticallyAddNewCastToThread,
      parentCastHash,
      initialIncludeReason,
      processedEmbeds,
      queuedCasts,
      regularCastByteLimit,
      runAutoSaveDraft,
      scheduledAt,
      setCastAttachmentCache,
      processCastAttachments,
      storeDraftCaststorm,
      getCurrentCaststorm,
      trackEvent,
      trackCastReaction,
    ]);

    const onKeyPress = React.useCallback(
      (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
          onForceCloseWrappingModal?.();
        }
      },
      [onForceCloseWrappingModal],
    );

    const loadedIntentRef = React.useRef(false);

    React.useEffect(() => {
      loadedIntentRef.current = false;
      setIntent(initialIntent);
    }, [initialIntent]);

    React.useEffect(() => {
      return () => {
        // Abort uploads if composer is closed
        cancelActiveVideoUpload();
      };
    }, [cancelActiveVideoUpload]);

    const [queuedFocusEvent, setQueuedFocusEvent] = React.useState<
      { shouldFocusCastLocalKey: number } | undefined
    >({ shouldFocusCastLocalKey: 0 });

    const clearQueuedFocusEvent = React.useCallback(() => {
      setQueuedFocusEvent(undefined);
    }, []);

    // Editor will receive a auto-focus by using the ref.
    // Otherwise click on the text area will also bring in the focus as expected.
    const alreadyManuallyFocusedRef = React.useRef(false);
    React.useEffect(() => {
      if (!alreadyManuallyFocusedRef.current) {
        setQueuedFocusEvent({
          shouldFocusCastLocalKey: focusedCastLocalKey,
        });
        alreadyManuallyFocusedRef.current = true;
      }
    }, [focusedCastLocalKey]);

    // Why are we doing our own Esc handling here instead of using the global hook?
    // This is due to having another dialog open in composer (Emoji picker).
    // To be able to Esc close that we need all other listeners to be disabled.
    // Implementing a global key listener that blocks all other depending on
    // a changing state although sounds nice - is a complicated thing to manage.
    // For now, no harm in going one-off for this specific modal dialog and handling
    // it manually.
    React.useEffect(() => {
      window.addEventListener('keyup', onKeyPress);

      return () => window.removeEventListener('keyup', onKeyPress);
    }, [onKeyPress]);

    React.useEffect(() => {
      if (typeof intent !== 'undefined' && intent.channelKey) {
        setChannelKey(intent.channelKey);
      }
      if (typeof intent !== 'undefined' && intent.scheduledAt) {
        setScheduledAt(intent.scheduledAt);
      }
    }, [intent]);

    const [queuedSetOpenGraphLinkEvents, setQueuedSetOpenGraphLinkEvents] =
      React.useState<{ [castLocalKey: number]: string }>({});

    const onDraftImages = React.useCallback(
      ({
        castLocalKey,
        images,
      }: {
        castLocalKey: number;
        images: {
          height: number;
          width: number;
          src: string;
        }[];
      }) => {
        for (const image of images) {
          dispatch({
            type: 'AddImage',
            castLocalKey: castLocalKey,
            image: {
              w: image.width,
              h: image.height,
              src: image.src,
            },
          });
        }
      },
      [dispatch],
    );

    const onDraftVideos = React.useCallback(
      ({
        castLocalKey,
        videos,
      }: {
        castLocalKey: number;
        videos: {
          height: number;
          width: number;
          src: string;
        }[];
      }) => {
        for (const video of videos) {
          dispatch({
            type: 'AddVideo',
            castLocalKey: castLocalKey,
            video: {
              w: video.width,
              h: video.height,
              src: video.src,
            },
          });
        }
      },
      [dispatch],
    );

    const onDraftUrls = React.useCallback(
      (_: { castLocalKey: number; urls: string[] }) => {
        // No-op at this time. We may need it for draft to URL stuff later
      },
      [],
    );

    React.useEffect(() => {
      if (!loadedIntentRef.current && intent) {
        if (intent.text) {
          let es = EditorState.createWithContent(
            ContentState.createFromText(`${intent.text} `),
          );

          es = EditorState.moveSelectionToEnd(es);
          es = EditorState.forceSelection(es, es.getSelection());

          setCurrentCastEditorState(es);
        }

        const { embeds } = intent;
        if (loadedURLEmbedsFromIntents && typeof embeds !== 'undefined') {
          setEmbedsFromDraftCast({
            embeds,
            castLocalKey: focusedCastLocalKey,
            onDraftImages,
            onDraftVideos,
            onDraftUrls,
          });
        }

        // Queue an OG link scan covering URLs in either `intent.text` or
        // `intent.embeds`. Linkify-based detection only runs on user
        // keystrokes (see onEditorStateChange), so without this any URL
        // that lands in the composer via pre-filled intent text (e.g. a
        // snap's `compose_cast({ text: "...url..." })` share flow) would
        // never produce an embed preview.
        //
        // Note: this MUST run independently of `loadedURLEmbedsFromIntents`
        // (which only evaluates true when `intent.embeds` is non-empty).
        // The text-only share case is exactly the bug we need to fix.
        // NEYN-10174.
        const linkEmbedsString = [intent.text, ...(embeds ?? [])]
          .filter((s): s is string => Boolean(s))
          .join(' ');
        if (linkEmbedsString) {
          setQueuedSetOpenGraphLinkEvents((curValue) => ({
            ...curValue,
            [focusedCastLocalKey]: linkEmbedsString,
          }));
        }

        if (intent.draftCasts) {
          const newQueuedCasts = [];
          const newEmbedUrls: { [castLocalKey: number]: string[] } = {};
          const openGraphLinkEventsToQueue: { [castLocalKey: number]: string } =
            {};
          for (let i = 0; i < intent.draftCasts.length; i++) {
            const draftCast = intent.draftCasts[i];
            const localKey = nextCastLocalKeyRef.current++;

            let es = EditorState.createWithContent(
              ContentState.createFromText(draftCast.text),
            );
            es = EditorState.moveSelectionToEnd(es);
            if (i === intent.draftCasts.length - 1) {
              es = EditorState.forceSelection(es, es.getSelection());
            }
            newQueuedCasts.push({
              editorState: es,
              localKey,
            });

            newEmbedUrls[localKey] = draftCast.embeds ?? [];
            if (draftCast.embeds && draftCast.embeds.length > 0) {
              openGraphLinkEventsToQueue[localKey] = draftCast.embeds.join(' ');
            }
          }
          setQueuedCasts(newQueuedCasts);
          setEmbedsFromAllDraftCasts(
            newEmbedUrls,
            onDraftImages,
            onDraftVideos,
            onDraftUrls,
          );
          setFocusedCastLocalKey(
            newQueuedCasts[newQueuedCasts.length - 1].localKey,
          );
          if (Object.keys(openGraphLinkEventsToQueue).length > 0) {
            setQueuedSetOpenGraphLinkEvents((curValue) => ({
              ...curValue,
              ...openGraphLinkEventsToQueue,
            }));
          }
        }

        loadedIntentRef.current = true;
      }
    }, [
      focusedCastLocalKey,
      intent,
      loadedURLEmbedsFromIntents,
      onDraftImages,
      onDraftVideos,
      onDraftUrls,
      setCurrentCastEditorState,
      setEmbedsFromAllDraftCasts,
      setEmbedsFromDraftCast,
    ]);

    // Local-first draft hydration (NEYN-10598, NEYN-12240). Restore a
    // previously persisted local draft only for contexts with stable recovery
    // keys. Hydration is silent and one-shot per mount; if the user has
    // already started typing during the load, we skip to avoid clobbering.
    const localDraftHydrationAttemptedKeyRef = React.useRef<string | undefined>(
      undefined,
    );

    React.useEffect(() => {
      if (!canUseLocalDraftRecovery || typeof localDraftKey === 'undefined') {
        return;
      }
      if (localDraftHydrationAttemptedKeyRef.current === localDraftKey) {
        return;
      }
      localDraftHydrationAttemptedKeyRef.current = localDraftKey;

      const localDraft =
        getLocalDraft(localDraftKey) ??
        (localDraftKey === LOCAL_DRAFT_TOP_LEVEL_KEY
          ? getLocalDraft()
          : undefined);
      if (typeof localDraft === 'undefined') {
        return;
      }
      if (
        localDraftKey === LOCAL_DRAFT_TOP_LEVEL_KEY
          ? typeof localDraft.parentCastHash !== 'undefined'
          : localDraft.parentCastHash !== parentCastHash
      ) {
        return;
      }

      const composerIsStillEmpty =
        queuedCasts.length === 1 &&
        queuedCasts[0].editorState.getCurrentContent().getPlainText().trim() ===
          '';
      if (!composerIsStillEmpty && !isActiveDraftLocalRecovery) {
        return;
      }

      const hasContent =
        localDraft.casts.some((c) => c.text.trim().length > 0) ||
        localDraft.casts.some((c) => c.embeds.length > 0);
      if (!hasContent) {
        return;
      }

      const newQueuedCasts: QueuedCastInfo[] = [];
      const newEmbedUrls: { [castLocalKey: number]: string[] } = {};
      const openGraphLinkEventsToQueue: { [castLocalKey: number]: string } = {};
      const draftCasts =
        localDraft.casts.length > 0
          ? localDraft.casts
          : [{ text: '', embeds: [] }];
      for (let i = 0; i < draftCasts.length; i++) {
        const draftCast = draftCasts[i];
        const localKey = nextCastLocalKeyRef.current++;
        let es = EditorState.createWithContent(
          ContentState.createFromText(draftCast.text),
        );
        es = EditorState.moveSelectionToEnd(es);
        if (i === draftCasts.length - 1) {
          es = EditorState.forceSelection(es, es.getSelection());
        }
        newQueuedCasts.push({ editorState: es, localKey });
        newEmbedUrls[localKey] = draftCast.embeds ?? [];
        if (draftCast.embeds && draftCast.embeds.length > 0) {
          openGraphLinkEventsToQueue[localKey] = draftCast.embeds.join(' ');
        }
      }
      setQueuedCasts(newQueuedCasts);
      setEmbedsFromAllDraftCasts(
        newEmbedUrls,
        onDraftImages,
        onDraftVideos,
        onDraftUrls,
      );
      if (typeof localDraft.channelKey !== 'undefined') {
        setChannelKey(localDraft.channelKey);
      }
      setFocusedCastLocalKey(
        newQueuedCasts[newQueuedCasts.length - 1].localKey,
      );
      if (Object.keys(openGraphLinkEventsToQueue).length > 0) {
        setQueuedSetOpenGraphLinkEvents((curValue) => ({
          ...curValue,
          ...openGraphLinkEventsToQueue,
        }));
      }
      // We intentionally only depend on the stable recovery gates so this
      // runs once per mount. The captured setters are stable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canUseLocalDraftRecovery, isActiveDraftLocalRecovery, localDraftKey]);

    // Tracks whether this composer session has ever held content. Used by
    // the persistence effect below to decide whether an "empty" transition
    // should clear the persisted local draft. Without this flag, the
    // very first render (always empty) would clobber a draft saved in a
    // previous session before hydration has a chance to read it.
    const hasHadContentRef = React.useRef(false);

    // Local-first draft persistence (NEYN-10598, NEYN-12240). Writes the
    // current recoverable composer state to localStorage on every committed
    // state change. Runs entirely client-side — survives network failures,
    // the offline screen taking over, tab crashes, and forced reloads. When
    // the composer becomes empty after previously holding content, we clear
    // only the scoped local draft for this composer context.
    React.useEffect(() => {
      if (!canUseLocalDraftRecovery || typeof localDraftKey === 'undefined') {
        return undefined;
      }
      if (!hasRecoverableLocalContent) {
        if (hasHadContentRef.current) {
          try {
            clearLocalDraftForCurrentComposer();
          } catch (e) {
            trackError(e);
          }
          hasHadContentRef.current = false;
        }
        return undefined;
      }
      hasHadContentRef.current = true;
      try {
        const draft: LocalDraft = {
          casts: queuedCasts.map((qc) => ({
            text: qc.editorState
              .getCurrentContent()
              .getPlainText()
              .trim()
              .replaceAll(/\n{2,}/gi, '\n\n'),
            embeds: draftEmbedUrls[qc.localKey] ?? [],
          })),
          channelKey,
          parentCastHash,
          scheduledAt: scheduledAt?.getTime(),
        };
        setLocalDraft(draft, localDraftKey);
      } catch (e) {
        trackError(e);
      }
      return undefined;
    }, [
      canUseLocalDraftRecovery,
      channelKey,
      clearLocalDraftForCurrentComposer,
      draftEmbedUrls,
      hasRecoverableLocalContent,
      localDraftKey,
      parentCastHash,
      queuedCasts,
      scheduledAt,
    ]);

    const selectChannel = React.useCallback(
      ({ channelKey }: { channelKey?: string }) => {
        if (typeof channelKey === 'undefined') {
          setChannelKey(undefined);
        } else {
          setChannelKey(channelKey);
        }
      },
      [],
    );

    const initialize = React.useCallback(async () => {
      clearParentCast();
    }, [clearParentCast]);

    React.useLayoutEffect(() => {
      initialize();
    }, [initialize]);

    const actionLabel = React.useMemo(() => {
      const baseLabel = hasMultipleCasts ? 'Cast all' : 'Cast';
      const defaultLabel =
        typeof actionOverride !== 'undefined'
          ? actionOverride.label
          : baseLabel;

      if (scheduledAt) {
        return isSubmitting ? 'Scheduling' : 'Schedule';
      }

      return isReply
        ? isSubmitting
          ? 'Replying...'
          : 'Reply'
        : isSubmitting
          ? 'Casting...'
          : defaultLabel;
    }, [hasMultipleCasts, actionOverride, scheduledAt, isReply, isSubmitting]);

    // Introducing wrapped-mode for the composer. Logic here can be extended
    // later to be a specific prop. If in this mdoe composer will disable
    // channel actions and remove some elements from the overall composer.
    const wrappedMode = React.useMemo(() => {
      return typeof actionOverride !== 'undefined';
    }, [actionOverride]);

    React.useImperativeHandle(composerRef, () => {
      const caststorm = {
        casts: queuedCasts.map((queuedCast) => ({
          text: getText(queuedCast),
          embeds: getEmbedUrlsForLocalKey({
            embedUrls,
            localKey: queuedCast.localKey,
          }),
        })),
        parent: castParent,
        channelKey,
      } satisfies ApiCaststormBody;
      return {
        shouldPromptOnClose: () => hasRecoverableLocalContent,
        getComposerState: () => ({
          caststorm,
        }),
      };
    });

    React.useEffect(() => {
      const rootElement = document.documentElement;
      if (!rootElement) {
        return undefined;
      }
      const scrollY = rootElement.scrollTop;
      rootElement.style.overflow = 'hidden';
      rootElement.style.top = `-${scrollY}px`;
      return () => {
        rootElement.style.overflow = '';
        rootElement.style.top = '';
        rootElement.scrollTop = scrollY;
      };
    }, []);

    const focusedCastEditorState = focusedCast.editorState;
    const onEmojiPick = React.useCallback(
      ({ emoji }: { emoji: string }) => {
        const currentContent = focusedCastEditorState.getCurrentContent();
        const currentSelection = focusedCastEditorState.getSelection();
        // We are inserting an empty space between the emoji and the cursor for smooth
        // typing flow. (goksu)
        const newContent = Modifier.replaceText(
          currentContent,
          currentSelection,
          `${emoji} `,
        );
        const newEditorState = EditorState.push(
          focusedCastEditorState,
          newContent,
          'insert-characters',
        );

        updateEditorState(focusedCastLocalKey, newEditorState);
      },
      [focusedCastEditorState, updateEditorState, focusedCastLocalKey],
    );

    const nextCastLocalKeyRef = React.useRef(1);
    const addCast = React.useCallback(() => {
      const localKey = nextCastLocalKeyRef.current++;
      setQueuedCasts((oldQueuedCasts) => [
        ...oldQueuedCasts,
        { localKey, ...emptyQueuedCast },
      ]);
      setQueuedFocusEvent({
        shouldFocusCastLocalKey: localKey,
      });
    }, []);

    const rawRemoveCast = React.useCallback((localKey: number) => {
      setQueuedCasts((oldQueuedCasts) =>
        oldQueuedCasts.filter((queuedCast) => queuedCast.localKey !== localKey),
      );
    }, []);

    const removeCast = React.useCallback(
      (localKey: number) => {
        if (localKey !== focusedCastLocalKey) {
          rawRemoveCast(localKey);
          return;
        }
        const newFocusedCast = queuedCasts.findLast(
          (queuedCast: QueuedCastInfo) => queuedCast.localKey !== localKey,
        );
        const newFocusedCastKey = newFocusedCast?.localKey;
        if (newFocusedCastKey === undefined) {
          rawRemoveCast(localKey);
          return;
        }
        setFocusedCastLocalKey(newFocusedCastKey);
        rawRemoveCast(localKey);
        setQueuedFocusEvent({ shouldFocusCastLocalKey: newFocusedCastKey });
      },
      [focusedCastLocalKey, queuedCasts, rawRemoveCast],
    );

    const shouldShowQueueCastButton = !wrappedMode && !isReply;
    const canQueueCast =
      (focusedCastText.length > 0 ||
        (focusedCastEmbedUrls && focusedCastEmbedUrls.length > 0)) &&
      queuedCasts.length < MAX_QUEUED_CASTS;

    const scrollableDivRef = React.useRef<HTMLDivElement>(null);
    const onEditorFocus = React.useCallback(
      (
        localKey: number,
        castPosition: { y: number; height: number } | undefined,
      ) => {
        setFocusedCastLocalKey(localKey);

        if (!castPosition || !scrollableDivRef.current) {
          return;
        }
        const scrollPosition = scrollableDivRef.current.scrollTop;
        const scrollHeight = scrollableDivRef.current.clientHeight;

        const castPositionEnd = castPosition.y + castPosition.height;
        const scrollViewVisibleZoneEnd = scrollPosition + scrollHeight;
        if (
          castPosition.y >= scrollPosition &&
          castPositionEnd <= scrollViewVisibleZoneEnd
        ) {
          // If the cast is already fully visible, do nothing
          return;
        }

        // We generally want to show some space above the current cast if possible
        const scrollToPosition = Math.max(castPosition.y - 50, 0);

        scrollableDivRef.current.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth',
        });
      },
      [],
    );

    const [
      showFarcasterProUnlockFeaturesModal,
      setShowFarcasterProUnlockFeaturesModal,
    ] = useState<boolean>(false);

    return (
      <>
        <div
          className="flex flex-col"
          style={{ maxHeight: 'calc(85vh - 11em)' }}
          data-prompt-on-close={canCreateCast}
        >
          <div
            className="scrollbar-vert relative flex w-full flex-col overflow-y-auto px-4"
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer.files;
              if (!files || files.length === 0) {
                return;
              }
              const remaining = getRemainingEmbedsCount(focusedCastLocalKey);
              if (remaining <= 0) {
                showComposerAttachmentLimitToast({ castEmbedLimit });
                return;
              }
              if (files.length > remaining) {
                toast({
                  message: `Only the first ${remaining} file${
                    remaining === 1 ? '' : 's'
                  } will be attached`,
                  type: 'info',
                  toastId: 'composer-attachment-truncated',
                });
              }
              const limit = Math.min(files.length, remaining);
              for (let i = 0; i < limit; i++) {
                try {
                  await addMediaEmbed({ file: files[i] });
                } catch (err) {
                  trackError(err);
                }
              }
            }}
            onDragOver={(e) => {
              // We need to block the browser handlers for dropped files when composer is active.
              e.preventDefault();
              e.stopPropagation();
            }}
            ref={scrollableDivRef}
          >
            {isReply &&
              typeof intent !== 'undefined' &&
              typeof intent.parentCastHash !== 'undefined' &&
              intent.parentCastHash.length > 0 && (
                <ComposerParentCast
                  parentCastHash={intent.parentCastHash}
                  parentCast={intent.parentCast}
                />
              )}
            {queuedCasts.map((queuedCast, i) => (
              <QueuedCast
                key={queuedCast.localKey.toString()}
                intent={queuedCast.localKey === 0 ? intent : undefined}
                castComposerEmbeds={castComposerEmbedsReturn}
                wrappedMode={wrappedMode}
                loadedURLEmbedsFromIntents={loadedURLEmbedsFromIntents}
                setOptimisticImages={setOptimisticImages}
                updateEditorState={updateEditorState}
                shouldImmediatelySetOpenGraphLink={(() => {
                  const linkEmbedsString =
                    queuedSetOpenGraphLinkEvents[queuedCast.localKey];
                  if (!linkEmbedsString) {
                    return undefined;
                  }
                  return {
                    linkEmbedsString,
                    afterSetOpenGraphLink: () => {
                      setQueuedSetOpenGraphLinkEvents((curValue) => {
                        const newValue = { ...curValue };
                        delete newValue[queuedCast.localKey];
                        return newValue;
                      });
                    },
                  };
                })()}
                placeholder={placeholder}
                onCastClick={async () => {
                  if (isSubmitting) {
                    return;
                  }
                  await onCastClick();
                }}
                addMediaEmbed={addMediaEmbed}
                setShowDetailedUploadingError={setShowDetailedUploadingError}
                onEditorFocus={onEditorFocus}
                shouldFocus={
                  queuedFocusEvent !== undefined &&
                  queuedCast.localKey ===
                    queuedFocusEvent.shouldFocusCastLocalKey
                    ? clearQueuedFocusEvent
                    : undefined
                }
                removeCast={removeCast}
                isFirst={i === 0}
                isLast={i === queuedCasts.length - 1}
                isFocused={focusedCastLocalKey === queuedCast.localKey}
                isOnlyCast={queuedCasts.length === 1}
                {...queuedCast}
              />
            ))}
          </div>
          <div className="flex flex-col">
            {typeof scheduledAt !== 'undefined' && (
              <ScheduledCastComposerBanner scheduledAtDate={scheduledAt} />
            )}
            <div className="flex flex-row justify-between border-t px-4 pt-2 border-default">
              <div className="flex flex-row items-center gap-x-2">
                {!isReply && (
                  <span
                    className={classNames(wrappedMode && 'pointer-events-none')}
                  >
                    <React.Suspense
                      fallback={<ChannelSelectorSuspenseFallback />}
                    >
                      <ComposerChannelSelector
                        channelKey={channelKey}
                        selectChannel={selectChannel}
                      />
                    </React.Suspense>
                  </span>
                )}
                <MediaComposerPicker
                  className="bg-action-muted! !rounded-md !px-2 hover:!bg-tertiary"
                  disabled={
                    !!uploadingStatuses[focusedCastLocalKey] ||
                    (getRemainingEmbedsCount(focusedCastLocalKey) > 0 &&
                      !getCanAddMoreEmbeds(focusedCastLocalKey))
                  }
                  getRemainingEmbedsCount={() =>
                    getRemainingEmbedsCount(focusedCastLocalKey)
                  }
                  castEmbedLimit={castEmbedLimit}
                  onMediaUpload={addMediaEmbed}
                />
                <EmojiComposerPicker
                  className="!px-2 bg-action-muted hover:!bg-tertiary"
                  iconClassName="text-muted"
                  onEmojiPick={onEmojiPick}
                />
              </div>
              <div className="relative flex flex-row items-center space-x-2">
                <CastLengthCounter castTextByteLength={castTextByteLength} />
                {shouldShowQueueCastButton && (
                  <QueueCastButton
                    canQueueCast={canQueueCast}
                    addCast={() => {
                      trackEvent(AnalyticsEvent.CastComposerQueueCastPressed, {
                        castCount: queuedCasts.length,
                      });
                      addCast();
                    }}
                  />
                )}
                <DefaultButton
                  title={actionLabel}
                  disabled={!canCreateCast || isSubmitting}
                  onClick={() => {
                    void onCastClick();
                  }}
                >
                  {actionLabel}
                </DefaultButton>
              </div>
            </div>
          </div>
        </div>
        {imageUploadFailureMessage && (
          <AlertModal onOk={() => setImageUploadFailureMessage(undefined)}>
            <div className="mb-2 text-lg font-semibold">
              Image upload failed
            </div>
            <div className="text-muted">{imageUploadFailureMessage}</div>
          </AlertModal>
        )}
        {showDetailedUploadingError !== undefined &&
          detailedUploadingErrors[showDetailedUploadingError] && (
            <AlertModal onOk={() => setShowDetailedUploadingError(undefined)}>
              <div className="mb-2 text-lg font-semibold">Uploading error</div>
              <div className="mb-2 text-muted">
                Share this with the Farcaster team when looking for support:
              </div>
              {detailedUploadingErrors[showDetailedUploadingError]}
            </AlertModal>
          )}
        {showFarcasterProUnlockFeaturesModal && (
          <FarcasterProUnlockFeaturesModal
            emphasis="embeds"
            onClose={() => setShowFarcasterProUnlockFeaturesModal(false)}
          />
        )}
      </>
    );
  },
);

export { Composer };
