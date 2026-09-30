import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { PastedFile } from '@mattermost/react-native-paste-input';
import * as ImagePicker from 'expo-image-picker';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCastUrlEmbed,
  ApiChannel,
  ApiQuoteCastEmbed,
  ApiTokenLink,
  ApiUser,
  buildCaip19TokenUri,
  getFirstApiErrorBody,
  isHandledFetchError,
} from 'farcaster-client-data';
import {
  FULL_CAST_HASH_RE,
  MAX_VIDEO_LENGTH_MINUTES,
  MAX_VIDEO_LENGTH_SECONDS,
  parseCastUrl,
  SHORT_CAST_HASH_PREFIX_RE,
  useCastComposerEmbeds,
  useDiscardDraftCast,
  useFetchOpenGraphMetadata,
  usePrefetchUserFollowingChannels,
  useProcessCastAttachments,
  useStoreDraftCaststorm,
  useTelemetry,
} from 'farcaster-client-hooks';
import { ButtonV2 } from 'farcaster-expo';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Alert,
  AppState,
  Keyboard,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { getImageMetaData } from 'react-native-compressor';
import { KeyboardAvoidingView as KCKeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useToast } from 'react-native-toast-notifications';

import { Link } from '~/components/Link';
import { CastChannelSelectorPromptAutoDisplaying } from '~/components/prompts/CastChannelSelectorPromptAutoDisplaying';
import { CastComposerDraftSavePropmt } from '~/components/prompts/CastComposerDraftSavePrompt';
import { CastTokenSelectorPromptAutoDisplaying } from '~/components/prompts/CastTokenSelectorPromptAutoDisplaying';
import { castComposerDraftSavePromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastQueue } from '~/contexts/CastQueueProvider';
import { useComposer } from '~/contexts/ComposerParentCastProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { ChannelMentionAutocomplete } from '~/screens/CreateCast/ChannelMentionAutocomplete';
import {
  CreateCastScreenParams,
  QueuedCastInfo,
  QueuedCastInfoWithEmbeds,
} from '~/types';
import {
  buildApiCastUrlEmbedFromMetadata,
  getAutocompleteMentionInfo,
  logCreateCastRumAction,
} from '~/utils/CastUtils';
import { trackError } from '~/utils/ErrorUtils';
import {
  IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE,
  requestMediaLibraryPermissions,
  TELEMETRY_EVENT_IMAGE_UPLOAD_ERROR,
  useUploadImage,
} from '~/utils/ImageUtils';
import { splice } from '~/utils/StringUtils';
import {
  compressVideo,
  TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR,
  useUploadVideo,
} from '~/utils/VideoUtils';

import { ComposerActions } from './ComposerActions';
import { ComposerParentCast } from './ComposerParentCast';
import { getDedupedEmbedsArrayFromOptimisticEmbeds } from './getDedupedEmbedsArrayFromOptimisticEmbeds';
import {
  getActiveDraftLocalDraftKey,
  getLocalDraft,
  getReplyLocalDraftKey,
  LOCAL_DRAFT_TOP_LEVEL_KEY,
  LocalDraft,
  LocalDraftKey,
  setLocalDraft,
} from './LocalDrafts';
import {
  getMediaPickerLaunchErrorInfo,
  getMediaPickerMediaTypesForPlatform,
} from './mediaPickerLaunchError';
import {
  getOptimisticMediaLookupKey,
  useOptimisticMediaEmbeds,
} from './OptimisticMediaEmbedsProvider';
import { QueuedCast } from './QueuedCast';
import { CommentBanner } from './TokenCommentBanner';
import { CommentBannerForTicker } from './TokenCommentBannerForTicker';
import { TokenMentionAutocomplete } from './TokenMentionAutocomplete';
import { UserMentionAutocomplete } from './UserMentionAutocomplete';

const MAX_QUEUED_CASTS = 10;
const SAVE_DRAFT_UPLOAD_TIMEOUT_MS = 10_000;

function getMediaUploadErrorMessage({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}): string {
  if (isHandledFetchError(error)) {
    const body = getFirstApiErrorBody(error);
    if (body?.message) {
      return body.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    const message = error.trim();
    if (message.length > 0) {
      return message;
    }
  }

  return fallback;
}

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

function getRemainingTimeoutMs(deadlineMs: number): number {
  return Math.max(0, deadlineMs - Date.now());
}

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
  text: '',
  userMentions: [],
  channelMentions: [],
  tokenMentions: [],
};

export const CreateCastScreenContent: FC<
  CreateCastScreenParams & {
    modal?: boolean;
    castQueueId: string;
    onClose: () => void;
  }
> = ({
  intent,
  modal,
  placeholder,
  onSuccess,
  onDismiss,
  castQueueId,
  banner,
  optimisticTxEmbed,
  onClose,
}) => {
  const t = useTheme();
  const push = usePush();
  const { trackEvent } = useAnalytics();
  const { addAction } = useTelemetry();

  const { parentCast } = useComposer();

  const processCastAttachments = useProcessCastAttachments();

  const [focusedCastLocalKey, setFocusedCastLocalKey] =
    React.useState<number>(0);
  // Bumped to re-focus the active cast input (re-opening the keyboard) after
  // the draft-save prompt is dismissed via its Cancel button.
  const [refocusSignal, setRefocusSignal] = React.useState<number>(0);
  const { fetchOpenGraphMetadata: fetchOpenGraphMetadataFn } =
    useFetchOpenGraphMetadata();

  const { longCastByteLimit: maxCastLength, castEmbedLimit } =
    useUserAppContext();

  // Mutable ref populated after the hook call so resolveUrlEmbedsOnFailure
  // can consult known snap URLs without depending on the whole embed store.
  const getSnapEmbedUrlsRef = React.useRef<(castLocalKey: number) => string[]>(
    () => [],
  );

  // Synthesizes fallback OG metadata for URLs the backend crawl couldn't
  // resolve. Checks canonical state for snap entries so known snap URLs
  // render through SnapEmbedAttachment immediately.
  const resolveUrlEmbedsOnFailure = React.useCallback(
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
      const knownSnapUrls = new Set(getSnapEmbedUrlsRef.current(castLocalKey));

      for (const url of urls) {
        // If canonical state already identifies this URL as a snap, synthesize
        // an embed with the `openGraph.snap` marker so the composer renders it
        // through `SnapEmbedAttachment` (which fetches the snap payload at
        // render time via `useFetchSnap`).
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
          const metadataResult = await fetchOpenGraphMetadataFn(url);

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
    [fetchOpenGraphMetadataFn],
  );

  const [queuedCasts, setQueuedCasts] = React.useState<QueuedCastInfo[]>(() => [
    {
      localKey: 0,
      ...emptyQueuedCast,
    },
  ]);
  const queuedCastLocalKeys = React.useMemo(
    () => queuedCasts.map(({ localKey }) => localKey),
    [queuedCasts],
  );
  const mediaPickerOpenRef = React.useRef(false);

  const castComposerEmbedsReturn = useCastComposerEmbeds({
    castLocalKeys: queuedCastLocalKeys,
    maxEmbedsLength: castEmbedLimit,
    compressVideo: async ({
      fileName,
      uri,
      signal,
      onProgress,
    }: {
      fileName: string;
      uri: string;
      signal: AbortSignal;
      onProgress: (progress: number) => void;
    }) => {
      const compressed = await compressVideo({
        forceSkipCompression: true,
        fileName,
        uri,
        signal,
        onProgress,
      });

      return compressed;
    },
    trackError,
    resolveUrlEmbedsOnFailure,
  });
  const {
    embedUrls,
    processedEmbeds,
    getDraftEmbedUrls,
    getEmbedsToSubmit,
    getEmbedsToStoreForDraft,
    getSnapEmbedUrls,
    cancelActiveVideoUpload,
    setEmbedsFromDraftCast,
    setEmbedsFromAllDraftCasts,
  } = castComposerEmbedsReturn;

  // Keep the ref in sync so resolveUrlEmbedsOnFailure sees fresh snap state.
  getSnapEmbedUrlsRef.current = getSnapEmbedUrls;

  const [channelKey, setChannelKey] = useState(intent?.channelKey);
  const [tokenKey, setTokenKey] = useState(intent?.tokenKey);
  const [tickerBasedTokenKey, setTickerBasedTokenKey] = useState<
    string | undefined
  >(undefined);
  const dismissedTokenKeysRef = useRef<Set<string>>(new Set());

  const uploadVideo = useUploadVideo();
  const uploadImage = useUploadImage();

  const currentUser = useCurrentUser_UNSAFE();
  const prefetchChannelsForSelector = usePrefetchUserFollowingChannels();

  React.useEffect(() => {
    prefetchChannelsForSelector({
      forComposer: true,
      shouldSkipIfRecentlyPrefetched: true,
    });
  }, [currentUser.fid, prefetchChannelsForSelector]);

  React.useEffect(
    () => {
      if (intent && intent.channelKey && channelKey !== intent.channelKey) {
        setChannelKey(intent.channelKey);
      }
    },
    // We are only updating the channel key if intent coming is different that what local
    // state is pointing to already. If we include key as a dep, it results in race between
    // local set calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intent],
  );

  const [state, dispatch] = useOptimisticMediaEmbeds();
  const { lookupKey: optimisticMediaLookupKey } = getOptimisticMediaLookupKey({
    castQueueId,
    castLocalKey: focusedCastLocalKey,
  });
  const optimisticMediaEmbeds = state[optimisticMediaLookupKey] ?? {
    optimisticImages: [],
    optimisticVideos: [],
    urls: [],
  };
  const optimisticMediaEmbedsCount =
    optimisticMediaEmbeds.optimisticImages.length +
    optimisticMediaEmbeds.optimisticVideos.length;
  const optimisticUrlEmbedsCount = Math.min(
    optimisticMediaEmbeds.urls.length,
    Math.max(castEmbedLimit - optimisticMediaEmbedsCount, 0),
  );
  const optimisticEmbedsCount =
    optimisticMediaEmbedsCount + optimisticUrlEmbedsCount;

  const [pendingMediaUploadsCount, setPendingMediaUploadsCount] = useState(0);
  const imageUploadErrorAlertShownRef = useRef(false);
  const hasPendingMediaUploads = pendingMediaUploadsCount > 0;
  const hasFailedVideoUploads = useMemo(
    () =>
      queuedCasts.some((queuedCast) => {
        const { lookupKey } = getOptimisticMediaLookupKey({
          castQueueId,
          castLocalKey: queuedCast.localKey,
        });
        return state[lookupKey]?.optimisticVideos.some(
          (video) => video.uploadStatus === 'failed',
        );
      }),
    [castQueueId, queuedCasts, state],
  );
  const saveDraftLabel = hasPendingMediaUploads
    ? 'Save draft (uploading media...)'
    : 'Save draft';
  const toast = useToast();
  const trackPendingMediaUpload = useCallback(
    <T,>(uploadPromise: Promise<T>) => {
      setPendingMediaUploadsCount((count) => count + 1);
      const trackedUploadPromise = uploadPromise.finally(() => {
        setPendingMediaUploadsCount((count) => Math.max(0, count - 1));
      });
      void trackedUploadPromise.catch(() => undefined);
      return trackedUploadPromise;
    },
    [],
  );

  const showImageUploadErrorAlert = useCallback(
    ({ error, src }: { error: unknown; src: string }) => {
      if (
        error instanceof Error &&
        error.message === IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE
      ) {
        dispatch({
          type: 'RemoveImage',
          castQueueId,
          castLocalKey: focusedCastLocalKey,
          src,
        });

        if (imageUploadErrorAlertShownRef.current) {
          return;
        }

        imageUploadErrorAlertShownRef.current = true;
        Alert.alert(
          'GIF too large',
          error.message,
          [
            {
              text: 'OK',
              onPress: () => {
                imageUploadErrorAlertShownRef.current = false;
              },
            },
          ],
          {
            onDismiss: () => {
              imageUploadErrorAlertShownRef.current = false;
            },
          },
        );
      }
    },
    [castQueueId, dispatch, focusedCastLocalKey],
  );

  const markImageUploadComplete = useCallback(
    ({ src }: { src: string }) => {
      dispatch({
        type: 'MarkImageUploadComplete',
        castQueueId,
        castLocalKey: focusedCastLocalKey,
        src,
      });
    },
    [castQueueId, dispatch, focusedCastLocalKey],
  );

  const hasOptimisticEmbeds = optimisticEmbedsCount !== 0;

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollPositionRef = useRef<number>(0);
  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositionRef.current = e.nativeEvent.contentOffset.y;
    },
    [],
  );

  const scrollViewHeightRef = useRef<number>(undefined);
  const onScrollViewLayout = React.useCallback((event: LayoutChangeEvent) => {
    scrollViewHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  // Position ({ y, height } within the ScrollView content) of the currently
  // focused cast input, captured on focus. Used to scroll the input above the
  // keyboard once the keyboard has finished animating in (see the
  // `keyboardDidShow` handler below).
  const focusedCastPositionRef = useRef<
    { y: number; height: number } | undefined
  >(undefined);

  const scrollFocusedInputIntoView = React.useCallback(() => {
    const castPosition = focusedCastPositionRef.current;
    const scrollViewHeight = scrollViewHeightRef.current;
    if (!castPosition || scrollViewHeight === undefined) {
      return;
    }
    const castPositionEnd = castPosition.y + castPosition.height;
    const scrollViewVisibleZoneEnd =
      scrollPositionRef.current + scrollViewHeight;
    // Already fully within the (keyboard-adjusted) visible zone — nothing to do.
    if (
      castPosition.y >= scrollPositionRef.current &&
      castPositionEnd <= scrollViewVisibleZoneEnd
    ) {
      return;
    }
    scrollViewRef.current?.scrollTo({
      y: Math.max(castPosition.y - 50, 0),
      animated: true,
    });
  }, []);

  const parentCastHash = intent?.parentCastHash;
  const composerIsInReplyFlow = !!parentCastHash;
  const localDraftKey = React.useMemo((): LocalDraftKey => {
    if (typeof intent?.activeDraftId !== 'undefined') {
      return getActiveDraftLocalDraftKey(intent.activeDraftId);
    }

    if (typeof parentCastHash !== 'undefined') {
      return getReplyLocalDraftKey(parentCastHash);
    }

    return LOCAL_DRAFT_TOP_LEVEL_KEY;
  }, [intent?.activeDraftId, parentCastHash]);
  const hasPresetComposerContent =
    typeof intent !== 'undefined' &&
    (intent.text.trim().length > 0 ||
      intent.embeds.length > 0 ||
      (intent.draftCasts?.length ?? 0) > 0);
  const isActiveDraftLocalRecovery =
    typeof intent?.activeDraftId !== 'undefined' &&
    localDraftKey === getActiveDraftLocalDraftKey(intent.activeDraftId);
  const canUseLocalDraftRecovery =
    isActiveDraftLocalRecovery || !hasPresetComposerContent;

  const queuedCastsCount = queuedCasts.length;

  const createCastBaseContext = useMemo(
    () => ({
      castQueueId,
      composerIsInReplyFlow,
      isModal: Boolean(modal),
      queuedCastsCount,
      focusedCastLocalKey,
      channelKey,
      tokenKey,
      hasOptimisticEmbeds,
      platform: Platform.OS,
    }),
    [
      castQueueId,
      channelKey,
      composerIsInReplyFlow,
      focusedCastLocalKey,
      hasOptimisticEmbeds,
      modal,
      queuedCastsCount,
      tokenKey,
    ],
  );

  const logCreateCastAction = React.useCallback(
    (action: string, context?: Record<string, unknown>) => {
      logCreateCastRumAction(`CreateCastScreen.${action}`, {
        ...createCastBaseContext,
        ...context,
      });
    },
    [createCastBaseContext],
  );

  const onTextInputFocus = React.useCallback(
    (
      localKey: number,
      castPosition: { y: number; height: number } | undefined,
    ) => {
      const cast = queuedCasts.find(
        (queuedCast) => queuedCast.localKey === localKey,
      );
      const embedCount = embedUrls[localKey]?.length ?? 0;
      const previousFocusLocalKey = focusedCastLocalKey;

      logCreateCastAction('input_focus', {
        localKey,
        previousFocusLocalKey,
        castPositionY: castPosition?.y,
        castPositionHeight: castPosition?.height,
        currentScrollY: scrollPositionRef.current,
        castTextLength: cast?.text.length ?? 0,
        embedCount,
      });

      // Remember the focused input's position so the keyboardDidShow handler
      // can bring it above the keyboard once the ScrollView has settled at its
      // keyboard-adjusted height.
      focusedCastPositionRef.current = castPosition;

      const performScroll = (reason: 'modal_delay' | 'immediate') => {
        if (!castPosition || scrollViewHeightRef.current === undefined) {
          logCreateCastAction('scroll_to_focus_skipped', {
            localKey,
            reason,
            hasCastPosition: Boolean(castPosition),
            hasScrollViewHeight: Boolean(scrollViewHeightRef.current),
          });
          return;
        }

        const castPositionEnd = castPosition.y + castPosition.height;
        const scrollViewVisibleZoneEnd =
          scrollPositionRef.current + scrollViewHeightRef.current;
        if (
          castPosition.y >= scrollPositionRef.current &&
          castPositionEnd <= scrollViewVisibleZoneEnd
        ) {
          logCreateCastAction('scroll_to_focus_noop', {
            localKey,
            reason,
            castPositionY: castPosition.y,
            castPositionHeight: castPosition.height,
            scrollPosition: scrollPositionRef.current,
            scrollViewHeight: scrollViewHeightRef.current,
          });
          return;
        }

        const scrollToPosition = Math.max(castPosition.y - 50, 0);

        logCreateCastAction('scroll_to_focus', {
          localKey,
          reason,
          scrollToPosition,
        });

        scrollViewRef.current?.scrollTo({
          y: scrollToPosition,
          animated: true,
        });
      };

      if (modal && Platform.OS === 'ios') {
        // There is some sort of race condition when we load as modal on iOS
        // where the scrollTo call won't work. Adding a brief delay fixes it.
        setTimeout(() => performScroll('modal_delay'), 300);
      } else {
        performScroll('immediate');
      }

      setFocusedCastLocalKey(localKey);
    },
    [embedUrls, focusedCastLocalKey, logCreateCastAction, modal, queuedCasts],
  );

  const [replyingToCastHeight, setReplyingToCastHeight] = useState<number>();

  const scrollToBottomOfNewCast = useCallback(
    (animated: boolean) => {
      logCreateCastAction('scroll_to_bottom_scheduled', {
        animated,
        delayMs: 100,
      });
      setTimeout(() => {
        logCreateCastAction('scroll_to_bottom_execute', {
          animated,
        });
        scrollViewRef.current?.scrollToEnd({ animated });
      }, 100);
    },
    [logCreateCastAction],
  );

  const alreadyScrolledFromEffect = React.useRef<boolean>(false);

  useEffect(() => {
    // If the user is replying to a cast, we want to render the cast they're replying to at the top of the `ScrollView`,
    // and we want to scroll down so that the `Textarea` is at the top of the screen on initial render.
    // Since we won't know how tall the cast being replied to is until we render it, we wait until
    // then to scroll to the appropriate offset.
    if (
      replyingToCastHeight !== undefined &&
      !alreadyScrolledFromEffect.current
    ) {
      alreadyScrolledFromEffect.current = true;
      logCreateCastAction('reply_parent_cast_measured', {
        replyingToCastHeight,
      });
      // There is some sort of race condition where the scrollTo call won't work if we don't add a brief delay.
      // Surely there is a better way, but right now this is the only solution I can figure out.
      setTimeout(() => {
        logCreateCastAction('reply_parent_cast_scroll', {
          replyingToCastHeight,
        });
        scrollToBottomOfNewCast(false);
      }, 50);
    }
  }, [logCreateCastAction, replyingToCastHeight, scrollToBottomOfNewCast]);

  const nextCastLocalKeyRef = React.useRef(1);
  const hasLoggedScreenOpenRef = useRef(false);
  const lastTextLogRef = useRef<
    Record<number, { length: number; timestamp: number }>
  >({});
  const lastSelectionLogRef = useRef<
    Record<number, { start: number; end: number; timestamp: number }>
  >({});
  const mentionStateRef = useRef<string | undefined>(undefined);

  const addCast = React.useCallback(() => {
    trackEvent(AnalyticsEvent.CastComposerQueueCastPressed, {
      castCount: queuedCastsCount,
    });
    const localKey = nextCastLocalKeyRef.current++;
    setQueuedCasts((oldQueuedCasts) => {
      const updatedQueuedCasts = [
        ...oldQueuedCasts,
        { localKey, ...emptyQueuedCast },
      ];
      logCreateCastAction('queued_cast_added', {
        newLocalKey: localKey,
        queuedCountBefore: oldQueuedCasts.length,
        queuedCountAfter: updatedQueuedCasts.length,
      });
      return updatedQueuedCasts;
    });
  }, [logCreateCastAction, queuedCastsCount, trackEvent]);

  const rawRemoveCast = React.useCallback(
    (localKey: number) => {
      setQueuedCasts((oldQueuedCasts) => {
        const updatedQueuedCasts = oldQueuedCasts.filter(
          (queuedCast) => queuedCast.localKey !== localKey,
        );

        logCreateCastAction('queued_cast_removed', {
          localKey,
          queuedCountBefore: oldQueuedCasts.length,
          queuedCountAfter: updatedQueuedCasts.length,
        });

        return updatedQueuedCasts;
      });
    },
    [logCreateCastAction],
  );

  const removeCast = React.useCallback(
    (localKey: number) => {
      rawRemoveCast(localKey);

      const nextFocusedKey = Math.max(localKey - 1, 0);
      setFocusedCastLocalKey(nextFocusedKey);
    },
    [rawRemoveCast],
  );

  const updateCast = React.useCallback(
    (updatedCast: Partial<QueuedCastInfo> & { localKey: number }) => {
      setQueuedCasts((oldQueuedCasts) =>
        updateQueuedCasts(oldQueuedCasts, updatedCast),
      );
    },
    [],
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

  const setCurrentCastText = React.useCallback(
    (text: string) => {
      setQueuedCasts((oldQueuedCasts) =>
        updateCurrentCast(oldQueuedCasts, { text }),
      );
    },
    [updateCurrentCast],
  );

  const setCurrentCastUserMentions = React.useCallback(
    (userMentionsUpdater: ApiUser[] | ((current: ApiUser[]) => ApiUser[])) => {
      setQueuedCasts((oldQueuedCasts) => {
        const updaterParam =
          typeof userMentionsUpdater === 'function'
            ? (queuedCast: QueuedCastInfo) => ({
                ...queuedCast,
                userMentions: userMentionsUpdater(queuedCast.userMentions),
              })
            : { userMentions: userMentionsUpdater };
        return updateCurrentCast(oldQueuedCasts, updaterParam);
      });
    },
    [updateCurrentCast],
  );

  const setCurrentCastChannelMentions = React.useCallback(
    (
      channelMentionsUpdater:
        | ApiChannel[]
        | ((current: ApiChannel[]) => ApiChannel[]),
    ) => {
      setQueuedCasts((oldQueuedCasts) => {
        const updaterParam =
          typeof channelMentionsUpdater === 'function'
            ? (queuedCast: QueuedCastInfo) => ({
                ...queuedCast,
                channelMentions: channelMentionsUpdater(
                  queuedCast.channelMentions,
                ),
              })
            : { channelMentions: channelMentionsUpdater };
        return updateCurrentCast(oldQueuedCasts, updaterParam);
      });
    },
    [updateCurrentCast],
  );

  const setCurrentCastTokenMentions = React.useCallback(
    (updater: (current: ApiTokenLink[]) => ApiTokenLink[]) => {
      setQueuedCasts((oldQueuedCasts) =>
        updateCurrentCast(oldQueuedCasts, (queuedCast: QueuedCastInfo) => ({
          ...queuedCast,
          tokenMentions: updater(queuedCast.tokenMentions),
        })),
      );
    },
    [updateCurrentCast],
  );

  const currentCastText = React.useMemo(() => {
    const queuedCast = queuedCasts.find(
      (queuedCast: QueuedCastInfo) =>
        queuedCast.localKey === focusedCastLocalKey,
    );
    return queuedCast?.text ?? '';
  }, [queuedCasts, focusedCastLocalKey]);

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
          castQueueId: castQueueId,
          castLocalKey: castLocalKey,
          image: {
            w: image.width,
            h: image.height,
            src: image.src,
            uploadPromise: new Promise((resolve) => resolve(image.src)),
          },
        });
      }
    },
    [castQueueId, dispatch],
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
          castQueueId: castQueueId,
          castLocalKey: castLocalKey,
          video: {
            w: video.width,
            h: video.height,
            src: video.src,
            uploadPromise: new Promise((resolve) => resolve(video.src)),
          },
        });
      }
    },
    [castQueueId, dispatch],
  );

  const onDraftUrls = React.useCallback(
    ({ castLocalKey, urls }: { castLocalKey: number; urls: string[] }) => {
      dispatch({
        type: 'UpdateURLs',
        castLocalKey,
        castQueueId,
        urls,
      });
    },
    [castQueueId, dispatch],
  );

  const castButtonTitle = queuedCasts.length > 1 ? 'Cast all' : 'Cast';

  const normalizedText = currentCastText.trim();

  const currentCastEmbedUrls = embedUrls[focusedCastLocalKey];

  const castLength = useMemo(() => {
    return Buffer.byteLength(normalizedText, 'utf-8');
  }, [normalizedText]);

  const [selection, setSelection] = React.useState<{
    [localKey: string]: { start: number; end: number };
  }>({});

  const updateSelection = useCallback(
    (localKey: number, nextSelection: { start: number; end: number }) => {
      setSelection((oldSelection) => ({
        ...oldSelection,
        [localKey]: nextSelection,
      }));

      const cast = queuedCasts.find(
        (queuedCast) => queuedCast.localKey === localKey,
      );
      const currentTextLength = cast?.text.length ?? 0;
      const previousSelection = selection[localKey];
      const now = Date.now();
      const lastLogged = lastSelectionLogRef.current[localKey];
      const selectionChanged =
        !lastLogged ||
        lastLogged.start !== nextSelection.start ||
        lastLogged.end !== nextSelection.end;
      const elapsed = lastLogged ? now - lastLogged.timestamp : undefined;
      const outOfBounds =
        nextSelection.start < 0 ||
        nextSelection.end < 0 ||
        nextSelection.start > nextSelection.end ||
        nextSelection.end > currentTextLength + 1;
      const shouldLog =
        outOfBounds ||
        !lastLogged ||
        (selectionChanged && (!elapsed || elapsed > 500));

      if (shouldLog) {
        logCreateCastAction(
          outOfBounds ? 'selection_out_of_bounds' : 'selection_updated',
          {
            localKey,
            selectionStart: nextSelection.start,
            selectionEnd: nextSelection.end,
            previousStart: previousSelection?.start,
            previousEnd: previousSelection?.end,
            textLength: currentTextLength,
            elapsedMs: elapsed,
            outOfBounds,
          },
        );
      }

      lastSelectionLogRef.current[localKey] = {
        start: nextSelection.start,
        end: nextSelection.end,
        timestamp: now,
      };
    },
    [logCreateCastAction, queuedCasts, selection],
  );

  const currentCastSelection = React.useMemo(
    () => selection[focusedCastLocalKey],
    [selection, focusedCastLocalKey],
  );

  const mentionInfo = useMemo(
    () => getAutocompleteMentionInfo(currentCastText, currentCastSelection),
    [currentCastSelection, currentCastText],
  );

  useEffect(() => {
    if (hasLoggedScreenOpenRef.current) {
      return;
    }

    hasLoggedScreenOpenRef.current = true;

    logCreateCastAction('open', {
      castQueueId,
      isReplyIntent: composerIsInReplyFlow,
      initialQueuedCount: queuedCastsCount,
      intentChannelKey: intent?.channelKey,
      intentTokenKey: intent?.tokenKey,
      intentParentCastHash: intent?.parentCastHash,
      intentHasDrafts: Boolean(intent?.draftCasts?.length),
      placeholderProvided: Boolean(placeholder),
      hasBanner: Boolean(banner),
      bannerType: banner?.type ?? 'none',
      hasOnSuccess: Boolean(onSuccess),
      hasOnDismiss: Boolean(onDismiss),
    });
  }, [
    banner,
    castQueueId,
    composerIsInReplyFlow,
    intent,
    logCreateCastAction,
    onDismiss,
    onSuccess,
    placeholder,
    queuedCastsCount,
  ]);

  useEffect(() => {
    const mentionKey = mentionInfo
      ? `${mentionInfo.type}:${mentionInfo.text.length}:${mentionInfo.replace.start}:${mentionInfo.replace.end}`
      : 'none';

    if (mentionStateRef.current === mentionKey) {
      return;
    }

    mentionStateRef.current = mentionKey;

    logCreateCastAction('mention_state_changed', {
      active: Boolean(mentionInfo),
      mentionType: mentionInfo?.type ?? 'none',
      mentionTextLength: mentionInfo?.text.length ?? 0,
      replaceStart: mentionInfo?.replace?.start,
      replaceEnd: mentionInfo?.replace?.end,
    });
  }, [logCreateCastAction, mentionInfo]);

  const updateText = useCallback(
    (localKey: number, text: string) => {
      updateCast({ localKey, text });

      const now = Date.now();
      const length = text.length;
      const trimmedLength = text.trim().length;
      const lastSnapshot = lastTextLogRef.current[localKey];
      const lengthDelta = lastSnapshot
        ? length - lastSnapshot.length
        : undefined;
      const elapsed = lastSnapshot ? now - lastSnapshot.timestamp : undefined;
      const shouldLog =
        !lastSnapshot ||
        !elapsed ||
        elapsed > 1200 ||
        length === 0 ||
        trimmedLength === 0 ||
        (lengthDelta !== undefined && Math.abs(lengthDelta) >= 20);

      if (shouldLog) {
        logCreateCastAction('text_change_snapshot', {
          localKey,
          length,
          trimmedLength,
          lengthDelta,
          elapsedMs: elapsed,
        });
      }

      if (shouldLog || (lengthDelta ?? 0) !== 0) {
        lastTextLogRef.current[localKey] = { length, timestamp: now };
      }
    },
    [logCreateCastAction, updateCast],
  );

  const intentReadThroughEffect = React.useRef<boolean>(false);

  useEffect(() => {
    if (typeof intent === 'undefined') {
      return;
    }

    if (intentReadThroughEffect.current) {
      return;
    }

    intentReadThroughEffect.current = true;

    logCreateCastAction('intent_received', {
      hasText: Boolean(intent.text),
      textLength: intent.text?.length ?? 0,
      embedCount: intent.embeds.length,
      mentionCount: intent.mentions.length,
      channelKey: intent.channelKey,
      tokenKey: intent.tokenKey,
      parentCastHash: intent.parentCastHash,
      draftCount: intent.draftCasts?.length ?? 0,
      hasActiveDraftId: Boolean(intent.activeDraftId),
      scheduled: Boolean(intent.scheduledAt),
    });

    if (intent.text) {
      updateText(focusedCastLocalKey, `${intent.text} `);
      logCreateCastAction('intent_prefill_text', {
        focusedCastLocalKey,
        textLength: intent.text.length,
      });
    }

    if (intent.embeds.length !== 0) {
      logCreateCastAction('intent_prefill_embeds', {
        focusedCastLocalKey,
        embedCount: intent.embeds.length,
      });
      setEmbedsFromDraftCast({
        embeds: intent.embeds,
        castLocalKey: focusedCastLocalKey,
        onDraftImages: onDraftImages,
        onDraftVideos: onDraftVideos,
        onDraftUrls: onDraftUrls,
      });
    }

    if (intent.mentions.length !== 0) {
      logCreateCastAction('intent_prefill_mentions', {
        focusedCastLocalKey,
        mentionCount: intent.mentions.length,
      });
      setCurrentCastUserMentions(intent.mentions);
    }

    let hasTextFromDraft = false;
    if (intent.draftCasts) {
      const newQueuedCasts = [];
      const newEmbedUrls: { [castLocalKey: number]: string[] } = {};
      for (const draftCast of intent.draftCasts) {
        if (draftCast.text) {
          hasTextFromDraft = true;
        }
        const localKey = nextCastLocalKeyRef.current++;
        newQueuedCasts.push({
          ...emptyQueuedCast,
          text: draftCast.text,
          localKey,
        });
        newEmbedUrls[localKey] = draftCast.embeds ?? [];
      }
      logCreateCastAction('intent_prefill_drafts', {
        draftCount: newQueuedCasts.length,
        lastLocalKey: newQueuedCasts[newQueuedCasts.length - 1]?.localKey,
      });
      setQueuedCasts(newQueuedCasts);
      setEmbedsFromAllDraftCasts(
        newEmbedUrls,
        onDraftImages,
        onDraftVideos,
        onDraftUrls,
      );
      const nextFocusedKey = newQueuedCasts[newQueuedCasts.length - 1].localKey;
      setFocusedCastLocalKey(nextFocusedKey);
      logCreateCastAction('intent_prefill_drafts_focus', {
        nextFocusedKey,
      });
    }

    logCreateCastAction('intent_processing_complete', {
      hasTextFromDraft,
      hasText: Boolean(intent.text),
    });
    // setCurrentCastUserMentions is excluded to avoid repopulating from the
    // original draft when the focused cast changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    intent,
    logCreateCastAction,
    setEmbedsFromAllDraftCasts,
    setEmbedsFromDraftCast,
    updateText,
  ]);

  // Local-first draft persistence (NEYN-10598). Hydrates the composer from
  // a previously persisted local draft so users don't lose typed content
  // when the app is killed (offline screen takeover, OS background kill,
  // process crash, etc.).
  const localDraftHydrationAttemptedKeyRef = React.useRef<
    LocalDraftKey | undefined
  >(undefined);
  const latestQueuedCastsRef = React.useRef(queuedCasts);
  latestQueuedCastsRef.current = queuedCasts;

  useEffect(() => {
    if (!canUseLocalDraftRecovery) {
      return;
    }

    if (localDraftHydrationAttemptedKeyRef.current === localDraftKey) {
      return;
    }
    localDraftHydrationAttemptedKeyRef.current = localDraftKey;

    let cancelled = false;
    void (async () => {
      const localDraft = await getLocalDraft(localDraftKey);
      if (cancelled || !localDraft) {
        return;
      }

      // Guard: only apply if the user hasn't already started typing or
      // adding embeds during the async load. Otherwise we'd clobber their
      // in-progress content.
      const latestQueuedCasts = latestQueuedCastsRef.current;
      const composerIsStillEmpty =
        latestQueuedCasts.length === 1 &&
        latestQueuedCasts[0].text === '' &&
        latestQueuedCasts[0].userMentions.length === 0 &&
        latestQueuedCasts[0].channelMentions.length === 0 &&
        latestQueuedCasts[0].tokenMentions.length === 0;
      if (!composerIsStillEmpty) {
        return;
      }

      const hasContent =
        localDraft.queuedCasts.some((qc) => qc.text.trim().length > 0) ||
        Object.values(localDraft.embedUrls).some((urls) => urls.length > 0);
      if (!hasContent) {
        return;
      }

      logCreateCastAction('local_draft_hydrate', {
        castCount: localDraft.queuedCasts.length,
        hasChannel: Boolean(localDraft.channelKey),
      });

      // Re-key incoming casts so their localKeys don't collide with the
      // counter used for newly-added queued casts during this session.
      const remappedCasts: QueuedCastInfo[] = [];
      const remappedEmbedUrls: { [castLocalKey: number]: string[] } = {};
      for (const qc of localDraft.queuedCasts) {
        const newLocalKey = nextCastLocalKeyRef.current++;
        remappedCasts.push({ ...qc, localKey: newLocalKey });
        remappedEmbedUrls[newLocalKey] =
          localDraft.embedUrls[qc.localKey] ?? [];
      }

      setQueuedCasts(remappedCasts);
      setEmbedsFromAllDraftCasts(
        remappedEmbedUrls,
        onDraftImages,
        onDraftVideos,
        onDraftUrls,
      );
      if (typeof localDraft.channelKey !== 'undefined') {
        setChannelKey(localDraft.channelKey);
      }
      const lastKey = remappedCasts[remappedCasts.length - 1]?.localKey;
      if (typeof lastKey === 'number') {
        setFocusedCastLocalKey(lastKey);
      }
    })();

    return () => {
      cancelled = true;
    };
    // We intentionally only attempt hydration once per enabled localDraftKey.
    // State setters and callbacks captured here are stable enough that
    // re-running on their identity changes would just risk double-applying the
    // local draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseLocalDraftRecovery, localDraftKey]);

  const hasTrackedComposerShownRef = useRef(false);
  useEffect(() => {
    if (hasTrackedComposerShownRef.current) {
      return;
    }
    hasTrackedComposerShownRef.current = true;

    trackEvent(AnalyticsEvent.AddCastModalShown, {});
    trackEvent(AnalyticsEvent.CastComposerShown, {
      isReply: composerIsInReplyFlow,
      hasIntent: typeof intent !== 'undefined',
      hasDrafts: Boolean(intent?.draftCasts?.length),
    });
  }, [composerIsInReplyFlow, intent, trackEvent]);

  const canCreateCastUpdated = useMemo(() => {
    return queuedCasts.every(
      (queuedCast: QueuedCastInfo) =>
        (queuedCast.text.trim().length > 0 ||
          (hasOptimisticEmbeds && !tokenKey)) &&
        Buffer.byteLength(queuedCast.text.trim(), 'utf-8') <= maxCastLength &&
        optimisticEmbedsCount <= castEmbedLimit,
    );
  }, [
    castEmbedLimit,
    hasOptimisticEmbeds,
    maxCastLength,
    optimisticEmbedsCount,
    queuedCasts,
    tokenKey,
  ]);

  const { enqueue } = useCastQueue();

  const canCreateCast = useMemo(() => {
    return (
      canCreateCastUpdated && !hasPendingMediaUploads && !hasFailedVideoUploads
    );
  }, [canCreateCastUpdated, hasFailedVideoUploads, hasPendingMediaUploads]);
  const lastCanCreateCastRef = useRef<boolean>(canCreateCast);

  useEffect(() => {
    if (lastCanCreateCastRef.current === canCreateCast) {
      return;
    }

    logCreateCastAction('can_create_cast_changed', {
      canCreateCast,
      castLength,
      optimisticEmbedsCount,
      castEmbedLimit,
      hasFailedVideoUploads,
      hasPendingMediaUploads,
    });

    lastCanCreateCastRef.current = canCreateCast;
  }, [
    canCreateCast,
    castEmbedLimit,
    castLength,
    logCreateCastAction,
    optimisticEmbedsCount,
    hasFailedVideoUploads,
    hasPendingMediaUploads,
  ]);

  const wrappedCanAddMoreEmbeds = React.useCallback(() => {
    return optimisticEmbedsCount < castEmbedLimit;
  }, [castEmbedLimit, optimisticEmbedsCount]);

  const wrappedGetRemainingEmbedsCount = React.useCallback(() => {
    // Just to be safe let's max at 0 to avoid weird race.
    return Math.max(castEmbedLimit - optimisticEmbedsCount, 0);
  }, [castEmbedLimit, optimisticEmbedsCount]);

  const { showGlobalPrompt } = useGlobalPrompts();

  const [castChannelSelectorVisible, setCastChannelSelectorVisible] =
    React.useState<boolean>(false);

  const onCastChannelSelectorDismiss = useCallback(() => {
    setCastChannelSelectorVisible(false);
  }, []);

  const onCastChannelSelect = useCallback(
    ({ channelKey }: { channelKey?: string }) => {
      trackEvent(AnalyticsEvent.CastComposerChannelSelected, {
        hasChannel: typeof channelKey !== 'undefined',
      });
      setChannelKey(channelKey);

      setCastChannelSelectorVisible(false);
    },
    [trackEvent],
  );

  const onCastChannelSelectorPress = useCallback(() => {
    trackEvent(AnalyticsEvent.CastComposerChannelSelectorPressed, {
      hasChannel: Boolean(channelKey),
      castCount: queuedCastsCount,
    });
    logCreateCastAction('channel_selector_press', {
      hasChannelKey: Boolean(channelKey),
      queuedCastsCount,
    });

    Keyboard.dismiss();

    setCastChannelSelectorVisible(true);
  }, [channelKey, logCreateCastAction, queuedCastsCount, trackEvent]);

  const [castTickerSelectorVisible, setCastTickerSelectorVisible] =
    React.useState<boolean>(false);

  const onTokenSelectorDismiss = useCallback(() => {
    setCastTickerSelectorVisible(false);
  }, []);

  const onTokenSelectorSelect = useCallback(
    ({ tokenKey }: { tokenKey: string }) => {
      setTokenKey(tokenKey);

      setTickerBasedTokenKey(undefined);

      setCastTickerSelectorVisible(false);
    },
    [],
  );

  const onTickerTagPress = useCallback(() => {
    trackEvent(AnalyticsEvent.CastComposerTokenSelectorPressed, {});
    Keyboard.dismiss();

    setCastTickerSelectorVisible(true);
  }, [trackEvent]);

  const onTickerTagReset = useCallback(() => {
    trackEvent(AnalyticsEvent.CastComposerTokenCleared, {
      source: 'tag_reset',
    });
    setTokenKey(undefined);

    setTickerBasedTokenKey(undefined);
  }, [trackEvent]);

  const tokenCardOnDismiss = useCallback(() => {
    trackEvent(AnalyticsEvent.CastComposerTokenCleared, {
      source: 'card_dismiss',
    });
    trackEvent(AnalyticsEvent.DismissTokenCardManually, {});

    setTokenKey(undefined);

    if (tickerBasedTokenKey) {
      dismissedTokenKeysRef.current.add(tickerBasedTokenKey);
    }

    setTickerBasedTokenKey(undefined);
  }, [tickerBasedTokenKey, trackEvent]);

  /** When set, closing the composer should open Drafts (after save/discard from the draft prompt). */
  const pendingDraftsNavigationAfterPromptRef = React.useRef(false);

  const doCancel = useCallback(() => {
    logCreateCastAction('cancel_execute', {
      hasOnDismiss: Boolean(onDismiss),
    });
    cancelActiveVideoUpload();
    if (onDismiss) {
      onDismiss();
      logCreateCastAction('cancel_finished', {
        outcome: 'dismiss-callback',
      });
    }
    const openDraftsAfterClose = pendingDraftsNavigationAfterPromptRef.current;
    pendingDraftsNavigationAfterPromptRef.current = false;

    onClose();

    if (openDraftsAfterClose) {
      push('DraftCasts', {});
    }

    logCreateCastAction('cancel_closed', {
      outcome: onDismiss ? 'dismiss-callback' : 'default-close',
    });
  }, [cancelActiveVideoUpload, logCreateCastAction, onClose, onDismiss, push]);

  const shouldShowCastDraftsSheet = React.useMemo(
    () =>
      hasPendingMediaUploads ||
      queuedCasts.some((queuedCast) => {
        const { lookupKey } = getOptimisticMediaLookupKey({
          castQueueId,
          castLocalKey: queuedCast.localKey,
        });
        const optimisticMedia = state[lookupKey];

        return (
          queuedCast.text.trim() ||
          (embedUrls[queuedCast.localKey] &&
            embedUrls[queuedCast.localKey].length > 0) ||
          (optimisticMedia &&
            (optimisticMedia.optimisticImages.length > 0 ||
              optimisticMedia.optimisticVideos.length > 0))
        );
      }),
    [castQueueId, embedUrls, hasPendingMediaUploads, queuedCasts, state],
  );
  const onCancelPress = useCallback(() => {
    trackEvent(AnalyticsEvent.CastComposerClosed, {
      source: 'cancel_button',
      shouldShowCastDraftsSheet,
    });
    trackEvent(AnalyticsEvent.CancelCastComposer, {
      shouldShowCastDraftsSheet,
    });
    logCreateCastAction('cancel_press', {
      shouldShowCastDraftsSheet,
      hasOptimisticEmbeds,
      queuedCastsCount,
    });

    Keyboard.dismiss();

    if (shouldShowCastDraftsSheet) {
      logCreateCastAction('cancel_show_draft_prompt', {});
      showGlobalPrompt({ key: castComposerDraftSavePromptKey });
    } else {
      logCreateCastAction('cancel_execute_immediate', {});
      doCancel();
    }
  }, [
    doCancel,
    hasOptimisticEmbeds,
    logCreateCastAction,
    queuedCastsCount,
    shouldShowCastDraftsSheet,
    showGlobalPrompt,
    trackEvent,
  ]);

  const onSelectImageEmbedPress = useCallback(
    async (mediaTypes: ImagePicker.MediaType[]) => {
      logCreateCastAction('media_picker_requested', {
        mediaTypes,
        remainingSlots: wrappedGetRemainingEmbedsCount(),
        optimisticEmbedsCount,
      });
      if (!wrappedCanAddMoreEmbeds()) {
        logCreateCastAction('media_picker_blocked', {
          optimisticEmbedsCount,
          castEmbedLimit,
        });
        return;
      }

      await requestMediaLibraryPermissions();

      if (mediaPickerOpenRef.current) {
        logCreateCastAction('media_picker_already_open', {
          mediaTypes,
        });
        return;
      }

      const pickerMediaTypes = getMediaPickerMediaTypesForPlatform(mediaTypes);

      let pickImageResult: ImagePicker.ImagePickerResult | undefined;
      mediaPickerOpenRef.current = true;
      try {
        pickImageResult = await ImagePicker.launchImageLibraryAsync({
          allowsMultipleSelection: true,
          selectionLimit: wrappedGetRemainingEmbedsCount(),
          mediaTypes: pickerMediaTypes,
          allowsEditing: false,
          quality: 1,
          exif: false,
          legacy: true,
          // preferredAssetRepresentationMode is a must for large media on iOS 14+ otherwise it attempts to tranform
          // whole thing in memory and basically halts everything else.
          preferredAssetRepresentationMode:
            ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
          videoMaxDuration: MAX_VIDEO_LENGTH_SECONDS,
        });
      } catch (e) {
        const errorInfo = getMediaPickerLaunchErrorInfo(e);
        logCreateCastAction('media_picker_launch_error', {
          reason: errorInfo.reason,
          message: e instanceof Error ? e.message : 'unknown-error',
          mediaTypes,
          pickerMediaTypes,
        });
        trackError(e, {
          location: 'CreateCastScreen.media_picker_launch_error',
          reason: errorInfo.reason,
          mediaTypes,
          pickerMediaTypes,
        });
        toast.show(errorInfo.userMessage, { type: 'danger' });
        return;
      } finally {
        mediaPickerOpenRef.current = false;
      }

      if (pickImageResult.canceled) {
        logCreateCastAction('media_picker_cancelled', {});
        return;
      }

      const { assets } = pickImageResult;

      if (assets.length === 0) {
        logCreateCastAction('media_picker_empty_result', {});
        return;
      }

      const selectedVideoAssets = assets
        .filter((o) => o.type === 'video')
        // Converting to a separate asset object right away to avoid possible ref losses to picked file
        .map((va) => ({
          uri: va.uri,
          fileName: va.fileName,
          duration: va.duration,
          height: va.height,
          width: va.width,
          // @ts-expect-error-next-line
          rotation: va.rotation,
        }));

      if (selectedVideoAssets.length !== 0) {
        const lowDimVideoAsset = selectedVideoAssets.find(
          (o) =>
            typeof o.height !== 'undefined' &&
            typeof o.width !== 'undefined' &&
            (o.height <= 100 || o.width <= 100),
        );
        if (
          typeof lowDimVideoAsset !== 'undefined' ||
          lowDimVideoAsset === null
        ) {
          logCreateCastAction('video_embed_rejected_low_dimensions', {
            uri: lowDimVideoAsset?.uri,
            height: lowDimVideoAsset?.height,
            width: lowDimVideoAsset?.width,
          });
          toast.show('Failed to pick media, dimensions too low', {
            type: 'danger',
          });

          return;
        }
      }

      const selectedNonVideoAssets = assets
        .filter((o) => o.type !== 'video')
        // Converting to a separate asset object right away to avoid possible ref losses to picked file
        .map((ia) => ({
          uri: ia.uri,
          fileName: ia.fileName,
          fileSize: ia.fileSize,
          duration: ia.duration,
          height: ia.height,
          width: ia.width,
          mimeType: ia.mimeType,
        }));

      logCreateCastAction('media_picker_assets_received', {
        assetCount: assets.length,
        videoCount: selectedVideoAssets.length,
        imageCount: selectedNonVideoAssets.length,
      });

      if (selectedVideoAssets.length !== 0) {
        for (const videoAsset of selectedVideoAssets) {
          if (
            typeof videoAsset.duration === 'number' &&
            videoAsset.duration > MAX_VIDEO_LENGTH_SECONDS * 1000
          ) {
            dispatch({
              type: 'RemoveVideo',
              castQueueId,
              castLocalKey: focusedCastLocalKey,
              src: videoAsset.uri,
            });

            toast.show(
              `Video is longer than ${MAX_VIDEO_LENGTH_MINUTES} minutes`,
              {
                placement: 'bottom',
                type: 'danger',
                duration: 4000,
              },
            );
            return;
          }

          try {
            const uploadVideoPromise = trackPendingMediaUpload(
              uploadVideo({
                fileUri: videoAsset.uri,
              }),
            );
            void uploadVideoPromise
              .then(() =>
                dispatch({
                  type: 'MarkVideoUploadComplete',
                  castQueueId,
                  castLocalKey: focusedCastLocalKey,
                  src: videoAsset.uri,
                }),
              )
              .catch((error) => {
                const errorMessage = getMediaUploadErrorMessage({
                  error,
                  fallback: 'Failed to upload video.',
                });

                dispatch({
                  type: 'MarkVideoUploadFailed',
                  castQueueId,
                  castLocalKey: focusedCastLocalKey,
                  src: videoAsset.uri,
                  errorMessage,
                });

                toast.show(errorMessage, {
                  placement: 'bottom',
                  type: 'danger',
                  duration: 4000,
                });

                addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR, {
                  error: errorMessage,
                  location: 'create-cast-upload-promise',
                });
                logCreateCastAction('video_embed_upload_error', {
                  message: errorMessage,
                });
              });

            logCreateCastAction('video_embed_upload_start', {
              uri: videoAsset.uri,
              durationMs: videoAsset.duration,
              height: videoAsset.height,
              width: videoAsset.width,
            });

            const rotatedMediaOnAndroid =
              typeof videoAsset.rotation === 'number' &&
              (videoAsset.rotation === 90 || videoAsset.rotation === 270);

            const w = rotatedMediaOnAndroid
              ? videoAsset.height
              : videoAsset.width;
            const h = rotatedMediaOnAndroid
              ? videoAsset.width
              : videoAsset.height;

            dispatch({
              type: 'AddVideo',
              castLocalKey: focusedCastLocalKey,
              castQueueId,
              video: {
                w: w,
                h: h,
                src: videoAsset.uri,
                uploadPromise: uploadVideoPromise,
                uploadStatus: 'uploading',
              },
            });
            logCreateCastAction('video_embed_enqueued', {
              uri: videoAsset.uri,
              height: h,
              width: w,
            });
          } catch (error) {
            addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR, {
              error: JSON.stringify(error),
              location: 'create-cast-try-catch',
            });
            logCreateCastAction('video_embed_upload_error', {
              message: error instanceof Error ? error.message : 'unknown',
            });
          }
        }
      }

      for (const asset of selectedNonVideoAssets) {
        try {
          const rawImageUploadPromise = uploadImage({
            uri: asset.uri,
            height: asset.height,
            width: asset.width,
            name: asset.fileName || 'cast-image-embed',
            mimeType: asset.mimeType,
          });
          void rawImageUploadPromise.catch((error) =>
            showImageUploadErrorAlert({ error, src: asset.uri }),
          );
          void rawImageUploadPromise.then(() =>
            markImageUploadComplete({ src: asset.uri }),
          );

          const imageUploadPromise = trackPendingMediaUpload(
            rawImageUploadPromise,
          );

          logCreateCastAction('image_embed_upload_start', {
            uri: asset.uri,
            height: asset.height,
            width: asset.width,
            mimeType: asset.mimeType,
          });

          dispatch({
            type: 'AddImage',
            castQueueId: castQueueId,
            castLocalKey: focusedCastLocalKey,
            image: {
              w: asset.width,
              h: asset.height,
              src: asset.uri,
              uploadPromise: imageUploadPromise,
              uploadStatus: 'uploading',
            },
          });
          logCreateCastAction('image_embed_enqueued', {
            uri: asset.uri,
            height: asset.height,
            width: asset.width,
          });
        } catch (error) {
          addAction(TELEMETRY_EVENT_IMAGE_UPLOAD_ERROR, {
            error: JSON.stringify(error),
          });
          logCreateCastAction('image_embed_upload_error', {
            message: error instanceof Error ? error.message : 'unknown',
          });

          throw 'Failed to upload image';
        }
      }
    },
    [
      addAction,
      castEmbedLimit,
      castQueueId,
      dispatch,
      focusedCastLocalKey,
      logCreateCastAction,
      markImageUploadComplete,
      optimisticEmbedsCount,
      showImageUploadErrorAlert,
      toast,
      trackPendingMediaUpload,
      uploadImage,
      uploadVideo,
      wrappedCanAddMoreEmbeds,
      wrappedGetRemainingEmbedsCount,
    ],
  );

  const onDraftsPress = useCallback(() => {
    trackEvent(AnalyticsEvent.CastComposerDraftsTabPressed, {
      shouldShowCastDraftsSheet,
      castCount: queuedCastsCount,
    });
    logCreateCastAction('drafts_press', {
      shouldShowCastDraftsSheet,
      queuedCastsCount,
    });

    Keyboard.dismiss();

    if (shouldShowCastDraftsSheet) {
      pendingDraftsNavigationAfterPromptRef.current = true;
      logCreateCastAction('drafts_show_save_prompt', {});
      showGlobalPrompt({ key: castComposerDraftSavePromptKey });
    } else {
      // Composer is empty: nothing to save. Close the composer Modal first,
      // then navigate to Drafts. Without this, push goes onto the stack
      // behind the fullscreen Modal and the user only sees the Drafts
      // screen once they manually dismiss the composer.
      pendingDraftsNavigationAfterPromptRef.current = true;
      logCreateCastAction('drafts_close_and_navigate', {});
      doCancel();
    }
  }, [
    doCancel,
    logCreateCastAction,
    queuedCastsCount,
    shouldShowCastDraftsSheet,
    showGlobalPrompt,
    trackEvent,
  ]);

  const onImagePaste = useCallback(
    async ({ pastedImageFile }: { pastedImageFile: PastedFile }) => {
      const { uri, type } = pastedImageFile;
      trackEvent(AnalyticsEvent.MiscPastedFile, {
        source: 'CreateCastScreen',
      });
      logCreateCastAction('image_paste_detected', {
        mimeType: type,
        uriLength: uri.length,
      });
      DdRum.addAction(
        RumActionType.CUSTOM,
        'PastedFile.CreateCastScreen.onImagePaste',
        {
          mimeType: type,
          uriLength: uri.length,
        },
      );

      const { ImageHeight: height, ImageWidth: width } =
        await getImageMetaData(uri);

      logCreateCastAction('image_paste_metadata', {
        height,
        width,
      });

      const rawImageUploadPromise = uploadImage({
        uri: uri,
        height: height,
        width: width,
        name: 'paste-dcast-image-embed',
        mimeType: type,
      });
      void rawImageUploadPromise.catch((error) =>
        showImageUploadErrorAlert({ error, src: uri }),
      );
      void rawImageUploadPromise.then(() =>
        markImageUploadComplete({ src: uri }),
      );

      const imageUploadPromise = trackPendingMediaUpload(rawImageUploadPromise);

      dispatch({
        type: 'AddImage',
        castQueueId: castQueueId,
        castLocalKey: focusedCastLocalKey,
        image: {
          w: width,
          h: height,
          src: uri,
          uploadPromise: imageUploadPromise,
          uploadStatus: 'uploading',
        },
      });
      logCreateCastAction('image_paste_enqueued', {
        height,
        width,
      });
    },
    [
      castQueueId,
      dispatch,
      focusedCastLocalKey,
      logCreateCastAction,
      markImageUploadComplete,
      showImageUploadErrorAlert,
      trackEvent,
      trackPendingMediaUpload,
      uploadImage,
    ],
  );

  // We don't want to show any composer footer (actions alerts etc.) when `mentionInfo` text is
  // set. This will be set when user is trying to select a user to mention or a channel to mention.
  const shouldShowFooters = !(
    (mentionInfo && mentionInfo.type === 'user') ||
    (mentionInfo && mentionInfo.type === 'channel') ||
    (mentionInfo &&
      mentionInfo.text !== '' &&
      mentionInfo.type === 'token' &&
      typeof tokenKey === 'undefined' &&
      typeof tickerBasedTokenKey === 'undefined')
  );

  const shouldShowComposerChannelSuggestions = useMemo(() => {
    return (
      !composerIsInReplyFlow && typeof channelKey === 'undefined' && !tokenKey
    );
  }, [channelKey, composerIsInReplyFlow, tokenKey]);

  const shouldShowChannelSelector = useMemo(() => {
    return !composerIsInReplyFlow && !tokenKey;
  }, [composerIsInReplyFlow, tokenKey]);

  const onParentCastLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height;
      logCreateCastAction('parent_cast_layout', {
        height,
        parentCastHash,
      });
      setReplyingToCastHeight(height);
    },
    [logCreateCastAction, parentCastHash],
  );

  const discardDraftCast = useDiscardDraftCast();
  const storeDraftCaststorm = useStoreDraftCaststorm();

  // Re-entrancy guard for the "Save draft" action. The save button awaits an
  // embed upload + a network round-trip; without this guard a double-tap (or
  // the prompt firing twice) creates two server drafts for the same content —
  // a primary source of duplicate drafts. Set while a save is in flight; only
  // reset on failure (on success the composer closes and unmounts).
  const savingDraftRef = React.useRef(false);

  // The draftId this composer session has already saved. When we save again, we
  // pass it as `draftId` so backends that support draft upsert overwrite in place
  // instead of minting a new draftId (and we fall back to discarding the old id
  // if the server returns a different one). Falls back to the draft the composer
  // was opened from (intent.activeDraftId).
  const sessionSavedDraftIdRef = React.useRef<string | undefined>(undefined);

  const getEmbedsToStoreForDraftWithTimeout = React.useCallback(
    async ({
      castLocalKey,
      deadlineMs,
    }: {
      castLocalKey: number;
      deadlineMs: number;
    }) => {
      return Promise.race([
        getEmbedsToStoreForDraft(castLocalKey),
        new Promise<string[]>((resolve) => {
          setTimeout(
            () => resolve(getDraftEmbedUrls(castLocalKey)),
            getRemainingTimeoutMs(deadlineMs),
          );
        }),
      ]);
    },
    [getDraftEmbedUrls, getEmbedsToStoreForDraft],
  );

  const getEmbedsToStoreForDrafts = React.useCallback(
    async ({
      castLocalKey,
      uploadTimeoutMs = 0,
    }: {
      castLocalKey: number;
      uploadTimeoutMs?: number;
    }) => {
      logCreateCastAction('draft_embed_lookup', { castLocalKey });
      const uploadDeadlineMs = Date.now() + uploadTimeoutMs;
      let canonicalEmbeds: string[];
      try {
        canonicalEmbeds = await getEmbedsToStoreForDraftWithTimeout({
          castLocalKey,
          deadlineMs: uploadDeadlineMs,
        });
      } catch {
        // Failed uploads should not block draft saves or drop successful embeds.
        canonicalEmbeds = getDraftEmbedUrls(castLocalKey);
      }

      const { lookupKey } = getOptimisticMediaLookupKey({
        castQueueId,
        castLocalKey,
      });
      const optimisticMediaEmbeds = state[lookupKey];
      if (typeof optimisticMediaEmbeds === 'undefined') {
        return canonicalEmbeds;
      }

      const { dedupedEmbeds } = await getDedupedEmbedsArrayFromOptimisticEmbeds(
        {
          optimisticVideos: optimisticMediaEmbeds.optimisticVideos,
          optimisticImages: optimisticMediaEmbeds.optimisticImages,
          urls: [],
          mode: 'best-effort',
          timeoutMs: getRemainingTimeoutMs(uploadDeadlineMs),
        },
      );

      return Array.from(new Set([...canonicalEmbeds, ...dedupedEmbeds]));
    },
    [
      castQueueId,
      getDraftEmbedUrls,
      getEmbedsToStoreForDraftWithTimeout,
      logCreateCastAction,
      state,
    ],
  );

  const updateTokenKeyFromTicker = React.useCallback(
    (ticker: string) => {
      if (
        typeof tokenKey === 'undefined' &&
        !dismissedTokenKeysRef.current.has(ticker)
      ) {
        setTickerBasedTokenKey(ticker);
      }
    },
    [tokenKey],
  );

  const keyboardVerticalOffset = React.useMemo(() => {
    if (Platform.OS === 'android') {
      return 60;
    }

    return undefined;
  }, []);

  // WAR: On iOS the native KeyboardAvoidingView can retain stale bottom
  // padding when the keyboard disappears without delivering a clean frame
  // change to React Native, especially across app lifecycle transitions.
  // Briefly disabling + remounting the KAV forces it to re-measure from the
  // current keyboard state.
  const [kavEnabled, setKavEnabled] = useState(true);
  const [kavResetKey, setKavResetKey] = useState(0);
  const [isSoftwareKeyboardVisible, setIsSoftwareKeyboardVisible] =
    useState(false);

  // Use the worklet-driven KeyboardAvoidingView from
  // react-native-keyboard-controller so each keystroke in the multiline
  // LinkifiedTextarea does not retrigger a JS-thread padding animation
  // (which manifests as the whole composer screen "shaking" per word
  // on iOS with the stock react-native KAV + behavior="padding").
  // Mirror PlaintextDirectCastsConversationScreen by falling back to the
  // RN implementation for users with reduce-motion enabled, where the
  // worklet-driven positioning has shown drift.
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!cancelled) {
        setReduceMotionEnabled(value);
      }
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled,
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
  const KeyboardHandlerView = useMemo(
    () =>
      reduceMotionEnabled ? RNKeyboardAvoidingView : KCKeyboardAvoidingView,
    [reduceMotionEnabled],
  );
  const scheduleKavReset = useCallback(() => {
    if (Platform.OS !== 'ios') {
      return () => {};
    }

    let cancelled = false;
    const rafIds: number[] = [];
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    setKavEnabled(false);
    rafIds.push(
      requestAnimationFrame(() => {
        rafIds.push(
          requestAnimationFrame(() => {
            timeoutId = setTimeout(() => {
              if (cancelled) {
                return;
              }
              setKavResetKey((current) => current + 1);
              setKavEnabled(true);
            }, 60);
          }),
        );
      }),
    );

    return () => {
      cancelled = true;
      for (const rafId of rafIds) {
        cancelAnimationFrame(rafId);
      }
      if (typeof timeoutId !== 'undefined') {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    const keyboardWillShowSubscription = Keyboard.addListener(
      'keyboardWillShow',
      (event) => {
        // External hardware keyboards can emit a zero-height "show" signal.
        // Only treat non-zero frame changes as a visible software keyboard.
        setIsSoftwareKeyboardVisible(event.endCoordinates.height > 0);
      },
    );
    const keyboardWillHideSubscription = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setIsSoftwareKeyboardVisible(false);
      },
    );
    // keyboardDidShow fires after the keyboard has finished animating in, by
    // which point the KeyboardAvoidingView has shrunk the ScrollView to its
    // keyboard-adjusted height. Scrolling the focused input into view here (vs.
    // the fixed modal delay used on focus) avoids racing that shrink, which
    // otherwise left a reply's input hidden under the keyboard when the parent
    // cast preview was tall.
    const keyboardDidShowSubscription = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        scrollFocusedInputIntoView();
      },
    );
    let cleanupScheduledReset: (() => void) | undefined;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        cleanupScheduledReset?.();
        cleanupScheduledReset = scheduleKavReset();
        return;
      }

      // Keep KAV disabled while app is in background/inactive so it does not
      // retain stale keyboard padding across lifecycle transitions.
      setKavEnabled(false);
      setIsSoftwareKeyboardVisible(false);
    });
    return () => {
      cleanupScheduledReset?.();
      subscription.remove();
      keyboardWillShowSubscription.remove();
      keyboardWillHideSubscription.remove();
      keyboardDidShowSubscription.remove();
    };
  }, [scheduleKavReset, scrollFocusedInputIntoView]);

  // Tracks whether this composer session has ever held content. When the
  // composer transitions from non-empty back to empty (e.g. user typed
  // something and then deleted it all without explicitly discarding), we
  // use this to decide we should clear the persisted local draft so it
  // doesn't resurrect on next mount. We don't clear on the very first
  // render, because the composer is always mounted empty before the
  // hydration effect populates it from AsyncStorage.
  const hasHadContentRef = React.useRef(false);

  const clearLocalDraft = React.useCallback(async () => {
    try {
      await setLocalDraft(undefined, localDraftKey);
    } catch (e) {
      trackError(e);
    }
  }, [localDraftKey]);

  const persistLocalDraft = React.useCallback(async () => {
    if (!canUseLocalDraftRecovery) {
      return;
    }

    try {
      const embedUrls: { [castLocalKey: number]: string[] } = {};
      const embedUrlEntries = await Promise.all(
        queuedCasts.map(async (queuedCast) => {
          try {
            const embeds = await getEmbedsToStoreForDrafts({
              castLocalKey: queuedCast.localKey,
            });
            return [queuedCast.localKey, embeds] as const;
          } catch {
            return [queuedCast.localKey, [] as string[]] as const;
          }
        }),
      );
      for (const [castLocalKey, embeds] of embedUrlEntries) {
        embedUrls[castLocalKey] = embeds;
      }
      const draft: LocalDraft = {
        queuedCasts,
        channelKey,
        embedUrls,
        parentCastHash,
        scheduledAt: intent?.scheduledAt?.getTime(),
      };
      await setLocalDraft(draft, localDraftKey);
    } catch (e) {
      trackError(e);
    }
  }, [
    canUseLocalDraftRecovery,
    channelKey,
    getEmbedsToStoreForDrafts,
    intent?.scheduledAt,
    localDraftKey,
    parentCastHash,
    queuedCasts,
  ]);

  // Local-first persistence (NEYN-10598): write the composer state to
  // AsyncStorage whenever it changes, debounced. This runs independently
  // of network state, so it survives the offline screen taking over,
  // OS-level process kills, and crashes — the next time the composer
  // mounts, the hydration effect above will restore the content. When the
  // composer becomes empty after previously holding content during this
  // session, we explicitly clear AsyncStorage to avoid resurrecting stale
  // content.
  // The previous timeout is cleared on every change so the debounce
  // resets while the user is actively typing.
  useEffect(() => {
    if (!canUseLocalDraftRecovery) {
      return;
    }

    const composerIsEmpty =
      !shouldShowCastDraftsSheet && typeof channelKey === 'undefined';
    if (composerIsEmpty) {
      if (hasHadContentRef.current) {
        void clearLocalDraft();
        hasHadContentRef.current = false;
      }
      return;
    }
    hasHadContentRef.current = true;
    const timeoutId = setTimeout(async () => {
      await persistLocalDraft();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [
    canUseLocalDraftRecovery,
    channelKey,
    clearLocalDraft,
    pendingMediaUploadsCount,
    persistLocalDraft,
    shouldShowCastDraftsSheet,
  ]);

  useEffect(() => {
    if (!canUseLocalDraftRecovery) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'background' && nextState !== 'inactive') {
        return;
      }

      const composerIsEmpty =
        !shouldShowCastDraftsSheet && typeof channelKey === 'undefined';
      if (composerIsEmpty) {
        if (hasHadContentRef.current) {
          void clearLocalDraft();
          hasHadContentRef.current = false;
        }
        return;
      }

      hasHadContentRef.current = true;
      void persistLocalDraft();
    });
    return () => subscription.remove();
  }, [
    canUseLocalDraftRecovery,
    channelKey,
    clearLocalDraft,
    persistLocalDraft,
    shouldShowCastDraftsSheet,
  ]);

  const enqueueCurrentCasts = React.useCallback(async () => {
    // A draft Save is in flight (embed upload + network store). Its sheet has
    // already closed, but this composer is still mounted so the Cast button
    // stays tappable. Publishing now would race the save: the session draft id
    // isn't set yet, so the publish would mint its own recovery draft and leave
    // the save's draft behind as a duplicate. Bail until the save settles (on
    // success the composer closes; on failure the guard is released for retry).
    if (savingDraftRef.current) {
      logCreateCastAction('enqueue_casts_blocked_saving_draft', {});
      return;
    }

    let queuedCastsWithEmbeds: QueuedCastInfoWithEmbeds[];
    try {
      queuedCastsWithEmbeds = await Promise.all(
        queuedCasts.map(async (queuedCast) => ({
          localKey: queuedCast.localKey,
          text: queuedCast.text,
          userMentions: queuedCast.userMentions,
          channelMentions: queuedCast.channelMentions,
          tokenMentions: queuedCast.tokenMentions,
          embeds: await getEmbedsToSubmit(queuedCast.localKey),
        })),
      );
    } catch (error) {
      trackError(error);
      toast.show(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to prepare cast embeds',
        {
          type: 'danger',
          duration: 5_000,
        },
      );
      return;
    }

    const totalEmbeds = queuedCastsWithEmbeds.reduce(
      (count, queuedCast) => count + (queuedCast.embeds?.length ?? 0),
      0,
    );
    logCreateCastAction('enqueue_casts', {
      castCount: queuedCastsWithEmbeds.length,
      totalEmbeds,
      hasParentCast: Boolean(parentCastHash),
      channelKey,
      tokenKey,
    });

    // The draft this publish should supersede: one saved earlier in this same
    // composer session (via the Save-draft prompt), falling back to the draft
    // this composer was opened from (`intent.activeDraftId`). Passing it lets
    // the queue's pre-publish auto-save upsert that draft in place and discard
    // it once the cast lands, instead of minting a separate recovery draft and
    // leaving the session-saved one behind as a duplicate. Mirrors the Save
    // path (`sessionSavedDraftIdRef.current ?? intent?.activeDraftId`).
    const activeDraftId =
      sessionSavedDraftIdRef.current ??
      (intent && intent.activeDraftId ? intent.activeDraftId : undefined);

    const quoteReactions: {
      castHash: string;
      castFid: number;
    }[] = [];

    for (const queuedCast of queuedCastsWithEmbeds) {
      const submittedHashReferences = getSubmittedCastHashReferences(
        queuedCast.embeds ?? [],
      );
      if (submittedHashReferences.length === 0) {
        continue;
      }

      let submittedQuoteCasts =
        processedEmbeds[queuedCast.localKey]?.casts?.filter((quoteCast) =>
          quoteCastMatchesSubmittedReference({
            quoteCast,
            submittedHashReferences,
          }),
        ) ?? [];

      if (submittedQuoteCasts.length < submittedHashReferences.length) {
        try {
          const data = await processCastAttachments({
            text: '',
            embeds: queuedCast.embeds,
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

    enqueue({
      queueId: castQueueId,
      params: {
        casts: queuedCastsWithEmbeds,
        activeDraftId: activeDraftId,
        scheduledAt: intent?.scheduledAt,
        feed: intent?.feed,
        includeReason: intent?.includeReason,
        quoteReactions,
        channelKey,
        parentCastHash,
        localDraftKey,
        tokenKey: tokenKey,
        onSuccess: onSuccess,
        onError: (message) => {
          toast.show(message, {
            type: 'danger',
            duration: 5_000,
          });
        },
        queueIdOverrideForEmbeds: undefined,
      },
    });

    logCreateCastAction('enqueue_casts_enqueued', {
      castCount: queuedCastsWithEmbeds.length,
    });

    onClose();
  }, [
    castQueueId,
    channelKey,
    enqueue,
    getEmbedsToSubmit,
    intent,
    localDraftKey,
    logCreateCastAction,
    onClose,
    onSuccess,
    parentCastHash,
    processCastAttachments,
    processedEmbeds,
    queuedCasts,
    toast,
    tokenKey,
  ]);

  const handleCastButtonPress = React.useCallback(() => {
    if (!canCreateCast) {
      logCreateCastAction('cast_button_press_blocked', {
        canCreateCast,
        castLength,
        optimisticEmbedsCount,
        hasFailedVideoUploads,
        hasPendingMediaUploads,
      });
      return;
    }

    Keyboard.dismiss();

    logCreateCastAction('cast_button_press', {
      castLength,
      optimisticEmbedsCount,
      channelKey,
      composerIsInReplyFlow,
    });

    trackEvent(AnalyticsEvent.ClickCreateCast, {
      channelKey,
      isReply: composerIsInReplyFlow,
      hasEmbeds: Object.values(embedUrls).some(
        (castEmbedUrls) => castEmbedUrls.length !== 0,
      ),
    });
    trackEvent(AnalyticsEvent.CastComposerSubmitPressed, {
      channelKey,
      isReply: composerIsInReplyFlow,
      castCount: queuedCasts.length,
      hasEmbeds: Object.values(embedUrls).some(
        (castEmbedUrls) => castEmbedUrls.length !== 0,
      ),
    });

    void enqueueCurrentCasts();
  }, [
    canCreateCast,
    castLength,
    channelKey,
    composerIsInReplyFlow,
    embedUrls,
    enqueueCurrentCasts,
    hasFailedVideoUploads,
    hasPendingMediaUploads,
    logCreateCastAction,
    optimisticEmbedsCount,
    queuedCasts.length,
    trackEvent,
  ]);

  return (
    <KeyboardHandlerView
      key={`create-cast-kav-${kavResetKey}`}
      style={{ flex: 1 }}
      keyboardVerticalOffset={keyboardVerticalOffset}
      behavior={'padding'}
      enabled={
        Platform.OS === 'ios' ? kavEnabled && isSoftwareKeyboardVisible : true
      }
    >
      <>
        <View
          style={[
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.borderDefault,
            t.borderBHairline,
            t.pX4,
            t.pB2,
            t.pT2,
          ]}
        >
          <View>
            <Link title="Cancel" variant="secondary" onPress={onCancelPress} />
          </View>
          <View
            style={[
              t.flex1,
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.relative,
              t.justifyEnd,
              { gap: 2 },
            ]}
          >
            {!tokenKey && (
              <ButtonV2
                title="Drafts"
                variant="link"
                height="sm"
                onPress={onDraftsPress}
              />
            )}
            <ButtonV2
              // NEYN-11640: selector for the Maestro `publish-cast` flow.
              // The title text is "Cast" / "Cast all", which collides
              // with the bottom-tab and various headings on this screen
              // — id is the only reliable selector for the publish CTA.
              testID="create-cast-publish-button"
              title={castButtonTitle}
              textSize="normal"
              height="sm"
              disabled={!canCreateCast}
              onPress={handleCastButtonPress}
              haptics={true}
            />
          </View>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[t.pX4, t.flexGrow]}
          onScroll={onScroll}
          onLayout={onScrollViewLayout}
          keyboardShouldPersistTaps="always"
        >
          <ComposerParentCast
            parentCastHash={parentCastHash}
            onLayout={onParentCastLayout}
          />
          {queuedCasts.map((queuedCast, i) => (
            <QueuedCast
              key={queuedCast.localKey.toString()}
              castQueueId={castQueueId}
              intent={queuedCast.localKey === 0 ? intent : undefined}
              castComposerEmbeds={castComposerEmbedsReturn}
              updateText={updateText}
              updateSelection={updateSelection}
              onTextInputFocus={onTextInputFocus}
              refocusSignal={refocusSignal}
              removeCast={removeCast}
              onImagePaste={onImagePaste}
              parentCast={parentCast}
              isFirst={i === 0}
              isLast={i === queuedCasts.length - 1}
              isFocused={focusedCastLocalKey === queuedCast.localKey}
              isOnlyCast={queuedCasts.length === 1}
              placeholder={placeholder}
              updateTokenKeyFromTicker={updateTokenKeyFromTicker}
              {...queuedCast}
            />
          ))}
        </ScrollView>
        {mentionInfo && mentionInfo.type === 'user' && (
          <UserMentionAutocomplete
            mentionText={mentionInfo.text}
            onAutocompleteMention={(user) => {
              setCurrentCastText(
                splice(
                  currentCastText,
                  mentionInfo.replace.start,
                  mentionInfo.replace.end,
                  user.username + ' ',
                ),
              );

              setCurrentCastUserMentions((ums) => [...ums, user]);
            }}
          />
        )}
        {mentionInfo && mentionInfo.type === 'channel' && (
          <ChannelMentionAutocomplete
            mentionText={mentionInfo.text}
            onAutocompleteMention={(channel) => {
              setCurrentCastText(
                splice(
                  currentCastText,
                  mentionInfo.replace.start,
                  mentionInfo.replace.end,
                  channel.key + ' ',
                ),
              );

              setCurrentCastChannelMentions((cms) => [...cms, channel]);
            }}
          />
        )}
        {mentionInfo &&
          mentionInfo.text !== '' &&
          mentionInfo.type === 'token' &&
          typeof tokenKey === 'undefined' &&
          typeof tickerBasedTokenKey === 'undefined' && (
            <TokenMentionAutocomplete
              mentionText={mentionInfo.text}
              onAutocompleteMention={({ token }) => {
                setCurrentCastText(
                  splice(
                    currentCastText,
                    mentionInfo.replace.start,
                    mentionInfo.replace.end,
                    token.ticker + ' ',
                  ),
                );

                // FIXME: do we need this?
                setCurrentCastTokenMentions((ms) => [...ms, token]);

                setTokenKey(buildCaip19TokenUri(token.chain, token.ca));

                setTickerBasedTokenKey(undefined);
              }}
            />
          )}
        {tokenKey && !tickerBasedTokenKey && (
          <CommentBanner
            tokenCaip19Key={tokenKey}
            tx={optimisticTxEmbed}
            tokenCardOnDismiss={tokenCardOnDismiss}
          />
        )}
        {tickerBasedTokenKey && (
          <CommentBannerForTicker
            ticker={tickerBasedTokenKey}
            setTokenKeyOnLoad={setTokenKey}
            tokenCardOnDismiss={tokenCardOnDismiss}
          />
        )}
        {shouldShowFooters && (
          <ComposerActions
            shouldShowChannelSelector={shouldShowChannelSelector}
            shouldShowComposerChannelSuggestions={
              shouldShowComposerChannelSuggestions
            }
            canAddMoreImageEmbeds={wrappedCanAddMoreEmbeds()}
            channelKey={channelKey}
            castLength={castLength}
            castText={currentCastText}
            onCastChannelSelectorPress={onCastChannelSelectorPress}
            onCastChannelSelect={onCastChannelSelect}
            onSelectImageEmbedPress={onSelectImageEmbedPress}
            shouldShowQueueCastButton={!composerIsInReplyFlow && !tokenKey}
            queueCastButtonDisabled={
              (normalizedText.length === 0 &&
                (!currentCastEmbedUrls || currentCastEmbedUrls.length === 0)) ||
              queuedCasts.length >= MAX_QUEUED_CASTS ||
              !!tokenKey ||
              hasFailedVideoUploads ||
              hasPendingMediaUploads
            }
            onQueueCastPress={addCast}
            tokenKey={tokenKey}
            onTickerTagPress={onTickerTagPress}
            onTickerTagReset={onTickerTagReset}
          />
        )}
        <CastComposerDraftSavePropmt
          discardOrDeleteLabel={
            typeof intent !== 'undefined' &&
            typeof intent.activeDraftId !== 'undefined'
              ? 'Delete'
              : 'Discard'
          }
          saveDraftLabel={saveDraftLabel}
          onDismissWithoutCompleting={() => {
            pendingDraftsNavigationAfterPromptRef.current = false;
            // The user backed out of cancelling (tapped the prompt's Cancel
            // or its backdrop) — re-focus the composer so the keyboard
            // re-opens and they can keep editing.
            setRefocusSignal((signal) => signal + 1);
          }}
          onDiscardDraftPress={() => {
            if (
              typeof intent !== 'undefined' &&
              typeof intent.activeDraftId !== 'undefined'
            ) {
              // Fire-and-forget (we're closing), but catch so a failed delete
              // doesn't become an unhandled rejection.
              void discardDraftCast({
                draftId: intent.activeDraftId,
                castChannelKey: undefined,
              }).catch((error) => trackError(error));
            }

            // User explicitly threw the content away — clear the
            // local-first copy so it doesn't resurrect on next open.
            void clearLocalDraft();

            // [WAR-1189]: Delaying the navigation pop here as its not working well with global bottom sheet
            // and its local ref manager. I am sure there is a better way to fix this, but need to move fast
            // on this - for now.
            setTimeout(doCancel, 450);
          }}
          onSaveDraftPress={async () => {
            // Guard against double-taps / the prompt firing twice: creating a
            // second draft while the first save is still in flight is a main
            // source of duplicate drafts. Left set on the success path since
            // the composer is about to close and unmount.
            if (savingDraftRef.current) {
              return;
            }
            savingDraftRef.current = true;

            const toastNoun = queuedCasts.length > 1 ? 'casts' : 'cast';

            toast.show(`Saving ${toastNoun} to drafts`, { placement: 'top' });

            try {
              const casts = await Promise.all(
                queuedCasts.map(async (queuedCast) => {
                  const text = queuedCast.text.trim();
                  const embeds = await getEmbedsToStoreForDrafts({
                    castLocalKey: queuedCast.localKey,
                    uploadTimeoutMs: SAVE_DRAFT_UPLOAD_TIMEOUT_MS,
                  });

                  return { text, embeds };
                }),
              );

              const parent =
                typeof parentCastHash !== 'undefined'
                  ? { hash: parentCastHash }
                  : undefined;

              // The draft this save supersedes: one we already created earlier
              // in this same composer session (re-save), falling back to the
              // draft this composer was opened from. Passed as `draftId` so the
              // server overwrites it in place (upsert) instead of minting a new
              // draft — the fix for duplicate drafts piling up on every save.
              const supersededDraftId =
                sessionSavedDraftIdRef.current ?? intent?.activeDraftId;

              const response = await storeDraftCaststorm({
                caststorm: {
                  casts: casts,
                  parent: parent,
                  channelKey: channelKey,
                  draftId: supersededDraftId,
                },
                // Preserve the draft's schedule across an edit. Passing it
                // explicitly (rather than relying on the server keeping the
                // prior value) keeps client and server in sync when saving a
                // scheduled draft opened from the drafts list.
                scheduledAt: intent?.scheduledAt,
              });

              sessionSavedDraftIdRef.current = response.result.draft.draftId;

              // Fallback for an older backend that ignores `draftId` and always
              // creates a new draft: the returned id differs from the one we
              // asked it to overwrite, so delete the stale copy ourselves. When
              // the server upserts, the ids match and this is a no-op.
              if (
                typeof supersededDraftId !== 'undefined' &&
                supersededDraftId !== sessionSavedDraftIdRef.current
              ) {
                try {
                  await discardDraftCast({
                    draftId: supersededDraftId,
                    castChannelKey: undefined,
                  });
                } catch (error) {
                  trackError(error);
                }
              }

              // Server now holds the canonical draft; clear the
              // local-first copy so we don't double-show it on reopen.
              void clearLocalDraft();

              toast.hideAll();
              toast.show(`Saved ${toastNoun} to drafts`, {
                placement: 'top',
              });

              // [WAR-1189]: Delaying the navigation pop here as its not working well with global bottom sheet
              // and its local ref manager. I am sure there is a better way to fix this, but need to move fast
              // on this - for now.
              setTimeout(doCancel, 450);
            } catch (error) {
              // Save failed before the draft was stored: allow a retry and
              // keep the composer open so the user doesn't lose their content.
              savingDraftRef.current = false;
              trackError(error);
              toast.hideAll();
              toast.show(`Failed to save ${toastNoun} to drafts`, {
                type: 'danger',
                placement: 'top',
              });
            }
          }}
        />
        {shouldShowFooters &&
          shouldShowChannelSelector &&
          castChannelSelectorVisible && (
            <CastChannelSelectorPromptAutoDisplaying
              onChannelSelect={onCastChannelSelect}
              currentlySelectedChannelKey={channelKey}
              onDismiss={onCastChannelSelectorDismiss}
            />
          )}
        {shouldShowFooters && castTickerSelectorVisible && (
          <CastTokenSelectorPromptAutoDisplaying
            onDismiss={onTokenSelectorDismiss}
            onSelect={onTokenSelectorSelect}
          />
        )}
      </>
    </KeyboardHandlerView>
  );
};

CreateCastScreenContent.displayName = 'CreateCastScreenContent';
