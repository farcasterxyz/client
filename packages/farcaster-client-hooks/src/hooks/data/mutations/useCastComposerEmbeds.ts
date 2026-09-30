import {
  ApiCastEmbeds,
  ApiCastImageEmbed,
  ApiCastUrlEmbed,
  ApiCastVideoEmbed,
  ApiPrepareVideoUpload200Response,
  ApiVideo,
  getFirstApiErrorBody,
  isHandledFetchError,
} from 'farcaster-client-data';
import isEqual from 'lodash/isEqual';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Upload } from 'tus-js-client';

import {
  ImageUploadError,
  VideoPreparationError,
  VideoStatusError,
  VideoUploadError,
} from '../../../errors';
import { getImageAspectRatio } from '../../../utils';
import { stripQuoteCastUrlEmbeds } from '../../../utils/quoteCastUrls';
import { useCastAttachmentPreviewCache } from '../queries/castAttachmentPreviewCache/useCastAttachmentPreviewCache';
import { useInvalidateUserAppContext } from '../queries/userAppContext/useInvalidateUserAppContext';
import {
  buildCanonicalEmbedsFromDraft,
  filterDraftUrlEmbeds,
} from './castComposerDraftHydration';
import {
  addEmbedToCast,
  buildUrlSnapEmbedIgnoreSet,
  type CastComposerEmbed,
  type CastComposerEmbedsMap,
  mergeHydratedEmbedsPreservingTextSource,
  mergeHydratedProcessedEmbedsPreservingTextUrls,
  normalizeComposerEmbedUrl,
  pruneProcessedUrlEmbedsByUrls,
  pruneProcessedUrlEmbedsToCanonicalUrls,
  removeEmbedsFromCast,
  syncEmbedsBySourceForCast,
  urlSnapEmbedMatchesAnyUrl,
} from './castComposerEmbedHelpers';
import {
  buildCastComposerBucketView,
  buildEmbedUrlsByCast,
  getMediaEmbedUrlsForCast,
  getSnapEmbedUrlsForCast,
} from './castComposerEmbedSelectors';
import {
  type CastComposerEmbedsPerCast,
  reduceCastComposerEmbeds,
} from './castComposerEmbedStore';
import {
  filterCrawlableUrlEmbeds,
  findMissingOrIncompleteRequestedUrls,
  projectUrlEmbedsForRequestedUrls,
} from './castComposerMetadataEnrichment';
import { useAbandonVideoUpload } from './useAbandonVideoUpload';
import { useCastComposerSubmitEmbeds } from './useCastComposerSubmitEmbeds';
import { useCastComposerUploadController } from './useCastComposerUploadController';
import { useFetchCastAttachment } from './useFetchCastAttachment';
import { useGetVideoState } from './useGetVideoState';
import { usePrepareVideoUpload } from './usePrepareVideoUpload';
import { useProcessCastAttachments } from './useProcessCastAttachments';
import {
  decideVideoPollAction,
  getVideoPollDelayMs,
  VIDEO_PROCESSING_FAILED_MESSAGE,
  VIDEO_PROCESSING_TIMEOUT_MESSAGE,
  VIDEO_PROCESSING_TIMEOUT_MS,
  VIDEO_UPLOAD_IDLE_TIMEOUT_MS,
  VIDEO_UPLOAD_STALLED_MESSAGE,
} from './videoUploadPolling';

export type {
  CastComposerEmbeds,
  CastComposerEmbedStoreActionType,
  CastComposerVideoEmbed,
} from './castComposerEmbedStore';

export const MAX_VIDEO_LENGTH_MINUTES = 10;
export const MAX_VIDEO_LENGTH_SECONDS = MAX_VIDEO_LENGTH_MINUTES * 60;

// We should maybe add gif and jpeg
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif'];

// Extensions used to detect image URLs typed in the composer for prioritization
// From https://developers.cloudflare.com/stream/faq/
// In Chrome, when mp4 is allowed, the file picker also allows selecting m4v, and
// given Cloudflare is processing it, it seems to be supported
const VIDEO_EXTENSIONS = ['mp4', 'm4v', 'mkv', 'mov', 'avi', 'flv', 'webm'];

export const IMAGE_PICKER_EXTENSIONS = IMAGE_EXTENSIONS.map(
  (ext) => `.${ext}`,
).join(',');

export const IMAGE_VIDEO_PICKER_EXTENSIONS = IMAGE_EXTENSIONS.concat(
  VIDEO_EXTENSIONS,
)
  .map((ext) => `.${ext}`)
  .join(',');

const formatFullPercent = (ratio: number) => {
  return `${(ratio * 100).toFixed(0)}%`;
};

const emptyApiCastEmbeds = {
  images: [],
  videos: [],
  urls: [],
  unknowns: [],
};
const emptyCastLocalKeys: readonly number[] = [];

type CastEmbedsPerCast = {
  [castLocalKey: number]: ApiCastEmbeds;
};

export type VideoCompressor = ({
  fileName,
  uri,
  signal,
  onProgress,
}: {
  fileName: string;
  uri: string;
  signal: AbortSignal;
  onProgress: (progress: number) => void;
}) => Promise<{
  uri: string;
  size: number;
  name: string;
  type: string;
  clientUploadMetadata?: unknown;
}>;

const createVideoUploadTraceId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `video-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function getEmbedType(
  uri: string,
): 'image' | 'video' | 'no-extension' | 'unsupported' {
  const fileExt = uri.split('.').pop()?.toLowerCase();

  if (!fileExt) {
    return 'no-extension';
  }

  if (IMAGE_EXTENSIONS.includes(fileExt)) {
    return 'image';
  } else if (VIDEO_EXTENSIONS.includes(fileExt)) {
    return 'video';
  } else {
    return 'unsupported';
  }
}

type ImageEmbedUploadPromise = () => Promise<
  | {
      version: 'v1';
      imageUrl: string;
      height: number;
      width: number;
    }
  | {
      version: 'v2';
      previewUrl: string;
      uploadPromise: Promise<Response>;
      imageUrl: string;
      height: number;
      width: number;
    }
>;

export type CastComposerEmbedsReturn = {
  embeds: CastComposerEmbedsPerCast;
  embedUrls: { [castLocalKey: number]: string[] };
  /** Ordered embed URLs to persist in drafts; text-derived embeds are omitted. */
  draftEmbedUrls: { [castLocalKey: number]: string[] };
  getCanAddMoreEmbeds: (castLocalKey: number) => boolean;
  getRemainingEmbedsCount: (castLocalKey: number) => number;
  getMediaEmbedUrls: (castLocalKey: number) => string[];
  getSnapEmbedUrls: (castLocalKey: number) => string[];
  getDraftEmbedUrls: (castLocalKey: number) => string[];
  processedEmbeds: CastEmbedsPerCast;
  setEmbedsFromDraftCast: (draftCastInfo: {
    embeds: string[];
    castLocalKey: number;
    onDraftImages: ({
      castLocalKey,
      images,
    }: {
      castLocalKey: number;
      images: {
        height: number;
        width: number;
        src: string;
      }[];
    }) => void;
    onDraftVideos: ({
      castLocalKey,
      videos,
    }: {
      castLocalKey: number;
      videos: {
        height: number;
        width: number;
        src: string;
      }[];
    }) => void;
    onDraftUrls: ({
      castLocalKey,
      urls,
    }: {
      castLocalKey: number;
      urls: string[];
    }) => void;
  }) => Promise<void>;
  setEmbedsFromAllDraftCasts: (
    allEmbedUrls: {
      [castLocalKey: number]: string[];
    },
    onDraftImages: ({
      castLocalKey,
      images,
    }: {
      castLocalKey: number;
      images: {
        height: number;
        width: number;
        src: string;
      }[];
    }) => void,
    onDraftVideos: ({
      castLocalKey,
      videos,
    }: {
      castLocalKey: number;
      videos: {
        height: number;
        width: number;
        src: string;
      }[];
    }) => void,
    onDraftUrls: ({
      castLocalKey,
      urls,
    }: {
      castLocalKey: number;
      urls: string[];
    }) => void,
  ) => Promise<void>;
  addImageEmbedViaUpload: (
    upload: ImageEmbedUploadPromise,
    castLocalKey: number,
    localUriRef: string,
  ) => Promise<void>;
  addVideoEmbed: (videoEmbed: {
    fileName: string;
    file: File | string;
    castLocalKey: number;
    localUriRef: string;
  }) => Promise<void>;
  addMediaEmbed: (mediaEmbed: {
    castLocalKey: number;
    localUriRef: string;
    file: File;
    imageUploaderPromise?: Promise<{
      url: string;
      optimisticImageId: string;
    }>;
  }) => Promise<void>;
  removeImageEmbedByUrl: (imageEmbedInfo: {
    imageUrl: string;
    castLocalKey: number;
  }) => Promise<void>;
  removeVideoEmbed: (videoEmbedInfo: {
    videoId: string;
    videoUrl: string | undefined;
    castLocalKey: number;
  }) => Promise<void>;
  cancelActiveVideoUpload: () => Promise<void>;
  removeUrlEmbed: (urlEmbedInfo: { url: string; castLocalKey: number }) => void;
  imageAspectRatios: { [link: string]: number };
  uploadingStatuses: { [castLocalKey: number]: string | undefined };
  uploadingErrors: { [castLocalKey: number]: string | undefined };
  detailedUploadingErrors: { [castLocalKey: number]: string | undefined };
  hasPendingMediaUploads: boolean;
  /** Append an embed to the canonical array for a cast, if a slot is free. */
  addEmbed: (params: {
    castLocalKey: number;
    embed: CastComposerEmbed;
  }) => void;
  /** Remove canonical entries matching the predicate. */
  removeEmbed: (params: {
    castLocalKey: number;
    predicate: (embed: CastComposerEmbed) => boolean;
  }) => void;
  /**
   * Replace only the canonical entries for a given source with new candidates
   * pre-classified by the composer/controller.
   */
  syncEmbedsBySource: (params: {
    castLocalKey: number;
    source: string;
    candidates: CastComposerEmbed[];
  }) => void;
  /**
   * Await in-flight upload promises and return ordered submit URLs for a cast.
   * Throws if any media upload has failed.
   */
  getEmbedsToSubmit: (castLocalKey: number) => Promise<string[]>;
  /**
   * Await in-flight upload promises and return ordered draft-persisted URLs.
   * Text-derived embeds are intentionally omitted; they are recreated from
   * draft text on restore.
   */
  getEmbedsToStoreForDraft: (castLocalKey: number) => Promise<string[]>;
};

type ResolveUrlEmbedsOnFailure = (params: {
  castLocalKey: number;
  urls: string[];
}) => Promise<ApiCastUrlEmbed[] | undefined>;

type ImageUploadFailure = {
  castLocalKey: number;
  localUriRef: string;
  message: string;
};

const DEFAULT_IMAGE_UPLOAD_ERROR_MESSAGE =
  'Failed to upload image, file size may be too large';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  return fallback;
};

const shouldTrackImageUploadError = (error: unknown) => {
  return !(
    error instanceof Error && error.name === 'CloudflareImagesUploadError'
  );
};

export const useCastComposerEmbeds = ({
  castLocalKeys = emptyCastLocalKeys,
  maxEmbedsLength,
  uploadCloudflareImage,
  compressVideo,
  trackError,
  resolveUrlEmbedsOnFailure,
  onImageUploadFailure,
}: {
  castLocalKeys?: readonly number[];
  maxEmbedsLength: number;
  uploadCloudflareImage?: ({
    file,
    imageUploaderPromise,
  }: {
    file: File;
    imageUploaderPromise?: Promise<{ url: string; optimisticImageId: string }>;
  }) =>
    | Promise<{ version: 'v1'; imageUrl: string } | undefined>
    | Promise<
        | {
            version: 'v2';
            imageUrl: string;
            previewUrl: string;
            uploadPromise: Promise<Response>;
          }
        | undefined
      >;
  compressVideo?: VideoCompressor;
  trackError: (error: unknown) => void;
  resolveUrlEmbedsOnFailure?: ResolveUrlEmbedsOnFailure;
  onImageUploadFailure?: (failure: ImageUploadFailure) => void;
}): CastComposerEmbedsReturn => {
  /**
   * Canonical ordered embed state. All writes go through this; `embeds` below
   * is a derived backward-compat view.
   */
  const [canonicalEmbeds, dispatchCanonicalEmbeds] = useReducer(
    reduceCastComposerEmbeds,
    {} as CastComposerEmbedsMap,
  );
  const canonicalEmbedsRef = useRef(canonicalEmbeds);
  useEffect(() => {
    canonicalEmbedsRef.current = canonicalEmbeds;
  }, [canonicalEmbeds]);
  const setCanonicalEmbeds = useCallback(
    (updater: (embeds: CastComposerEmbedsMap) => CastComposerEmbedsMap) => {
      dispatchCanonicalEmbeds({ type: 'setAll', updater });
    },
    [],
  );

  /** Monotonically-increasing counter for generating stable embed IDs. */
  const embedIdCounterRef = useRef(0);
  const nextEmbedId = useCallback(() => `e-${++embedIdCounterRef.current}`, []);

  /**
   * Backward-compat bucket view derived from canonical state.  Consumers that
   * already read `embeds.images`, `embeds.videos`, `embeds.urls` continue to
   * work without change while the migration is in progress.
   */
  const embeds = useMemo<CastComposerEmbedsPerCast>(
    () => buildCastComposerBucketView(canonicalEmbeds, castLocalKeys),
    [canonicalEmbeds, castLocalKeys],
  );

  const [urlsToIgnore, setUrlsToIgnore] = useState<{
    [castLocalKey: number]: Set<string>;
  }>({});
  const urlsToIgnoreRef = useRef(urlsToIgnore);
  useEffect(() => {
    urlsToIgnoreRef.current = urlsToIgnore;
  }, [urlsToIgnore]);
  const [imageAspectRatios, setImageAspectRatios] = useState<{
    [link: string]: number;
  }>({});
  const activeVideoUploadRef = useRef<
    | undefined
    | {
        id: string;
        castLocalKey: number;
      }
  >(undefined);
  const activeVideoUploadProcessRef = useRef<Upload | undefined>(undefined);
  const prepareAbortControllerRef = useRef<AbortController | undefined>(
    undefined,
  );

  const [processedEmbeds, setProcessedEmbeds] = useState<CastEmbedsPerCast>({});

  const {
    allModifyingEmbeds,
    detailedUploadingErrors,
    setDetailedUploadingError,
    setModifyingEmbeds,
    setUploadingError,
    setUploadingStatus,
    uploadingErrors,
    uploadingStatuses,
  } = useCastComposerUploadController();

  const processCastAttatchments = useProcessCastAttachments();

  const checkCastAttachmentPreviewCache = useCastAttachmentPreviewCache();

  const prepareVideoUpload = usePrepareVideoUpload();
  const getVideoState = useGetVideoState();
  const abandonVideoUpload = useAbandonVideoUpload();
  const invalidateUserAppContext = useInvalidateUserAppContext();

  const processedCastHashes = useMemo(() => {
    const hashesByCast: { [castLocalKey: number]: string[] } = {};
    for (const castLocalKey in processedEmbeds) {
      // Backward compat: include quote-cast hashes from processedEmbeds only
      // when they have not already been represented as kind:'cast' canonical
      // entries. Otherwise quote casts count twice for embed limit checks.
      const canonicalCastHashes = new Set(
        (canonicalEmbeds[castLocalKey] ?? [])
          .filter((embed) => embed.kind === 'cast')
          .map((embed) => embed.hash),
      );
      hashesByCast[castLocalKey] =
        processedEmbeds[castLocalKey]?.casts
          ?.map((c) => c.hash)
          .filter((hash) => !canonicalCastHashes.has(hash)) ?? [];
    }
    return hashesByCast;
  }, [canonicalEmbeds, processedEmbeds]);

  const embedUrls = useMemo(
    () =>
      buildEmbedUrlsByCast({
        canonicalEmbeds,
        extraUrlsByCast: processedCastHashes,
        castLocalKeys,
      }),
    [canonicalEmbeds, processedCastHashes, castLocalKeys],
  );

  const draftEmbedUrls = useMemo(
    () =>
      buildEmbedUrlsByCast({
        canonicalEmbeds,
        extraUrlsByCast: processedCastHashes,
        includeTextEmbeds: false,
        castLocalKeys,
      }),
    [canonicalEmbeds, processedCastHashes, castLocalKeys],
  );

  const hasPendingMediaUploads = useMemo(
    () =>
      Object.values(canonicalEmbeds).some((embedsForCast) =>
        embedsForCast.some(
          (embed) =>
            (embed.kind === 'image' || embed.kind === 'video') &&
            embed.uploadStatus === 'uploading',
        ),
      ),
    [canonicalEmbeds],
  );

  const getRemainingEmbedsCount = useCallback(
    (castLocalKey: number) => {
      const canonicalForCast = canonicalEmbeds[castLocalKey] ?? [];
      // Match `addEmbedToCast`: the store enforces `maxEmbedsLength` against the
      // canonical embed array length. `embedUrls` / `buildEmbedUrlsByCast` omit
      // in-flight and failed media (`embedUrlsForCast`), so counting those URLs
      // under-reports usage and the UI can show free slots while adds are dropped.
      return Math.max(0, maxEmbedsLength - canonicalForCast.length);
    },
    [canonicalEmbeds, maxEmbedsLength],
  );

  const getCanAddMoreEmbeds = useCallback(
    (castLocalKey: number) => {
      return (
        // To avoid random race-conditions lets just block embed additions until
        // nothing is in progress.
        Object.values(allModifyingEmbeds).every(
          (isModifyingEmbeds) => !isModifyingEmbeds,
        ) && getRemainingEmbedsCount(castLocalKey) > 0
      );
    },
    [allModifyingEmbeds, getRemainingEmbedsCount],
  );

  const handleImageUploadFailure = useCallback(
    ({
      castLocalKey,
      embedId,
      error,
      imageUrl,
      localUriRef,
    }: {
      castLocalKey: number;
      embedId: string;
      error: unknown;
      imageUrl?: string;
      localUriRef: string;
    }) => {
      const uploadError = getErrorMessage(
        error,
        DEFAULT_IMAGE_UPLOAD_ERROR_MESSAGE,
      );

      setCanonicalEmbeds((prev) => ({
        ...prev,
        [castLocalKey]: removeEmbedsFromCast(
          prev[castLocalKey] ?? [],
          (embed) => embed.kind === 'image' && embed.id === embedId,
        ),
      }));

      if (typeof imageUrl !== 'undefined') {
        setProcessedEmbeds((prev) => {
          const processedEmbedsForCast = prev[castLocalKey];
          if (!processedEmbedsForCast?.images) {
            return prev;
          }

          return {
            ...prev,
            [castLocalKey]: {
              ...processedEmbedsForCast,
              images: processedEmbedsForCast.images.filter(
                (image) => image.url !== imageUrl,
              ),
            },
          };
        });
      }

      onImageUploadFailure?.({
        castLocalKey,
        localUriRef,
        message: uploadError,
      });
      setUploadingError(
        onImageUploadFailure ? undefined : uploadError,
        castLocalKey,
      );
      setDetailedUploadingError(
        onImageUploadFailure ? undefined : `${error}`,
        castLocalKey,
      );

      if (shouldTrackImageUploadError(error)) {
        trackError(new ImageUploadError({ error }));
      }
    },
    [
      onImageUploadFailure,
      setCanonicalEmbeds,
      setDetailedUploadingError,
      setUploadingError,
      trackError,
    ],
  );

  const getMediaEmbedUrls = useCallback(
    (castLocalKey: number) => {
      return getMediaEmbedUrlsForCast({ canonicalEmbeds, castLocalKey });
    },
    [canonicalEmbeds],
  );

  const getSnapEmbedUrls = useCallback(
    (castLocalKey: number) => {
      return getSnapEmbedUrlsForCast({ canonicalEmbeds, castLocalKey });
    },
    [canonicalEmbeds],
  );

  const getDraftEmbedUrls = useCallback(
    (castLocalKey: number) => {
      return draftEmbedUrls[castLocalKey] ?? [];
    },
    [draftEmbedUrls],
  );

  const addImageEmbedViaUpload = useCallback(
    async (
      upload: ImageEmbedUploadPromise,
      castLocalKey: number,
      localUriRef: string,
    ) => {
      if (!getCanAddMoreEmbeds(castLocalKey)) {
        return;
      }

      setModifyingEmbeds(true, castLocalKey);
      setUploadingError(undefined, castLocalKey);

      const embedId = nextEmbedId();

      // Canonical-first: add the entry immediately with uploading status so
      // getEmbedsToSubmit can track it, even before we know the final URL.
      setCanonicalEmbeds((prev) => ({
        ...prev,
        [castLocalKey]: addEmbedToCast(
          prev[castLocalKey] ?? [],
          {
            id: embedId,
            kind: 'image',
            localUriRef,
            uploadStatus: 'uploading',
          },
          maxEmbedsLength,
        ),
      }));

      try {
        const response = await upload();

        const aspectRatio = getImageAspectRatio({
          w: response.width,
          h: response.height,
        });

        setImageAspectRatios((prev) => {
          prev[response.imageUrl] = aspectRatio;
          return { ...prev };
        });

        const apiImageEmbed: ApiCastImageEmbed = {
          type: 'image',
          alt: 'Image',
          sourceUrl: response.imageUrl,
          url: response.imageUrl,
          media: {
            height: response.height,
            width: response.width,
            version: '2',
            staticRaster: response.imageUrl,
          },
        };

        const uploadPromise =
          response.version === 'v2'
            ? response.uploadPromise
                .then((uploadResponse) => {
                  setCanonicalEmbeds((prev) => ({
                    ...prev,
                    [castLocalKey]: (prev[castLocalKey] ?? []).map((embed) =>
                      embed.kind === 'image' && embed.id === embedId
                        ? { ...embed, uploadStatus: 'uploaded' as const }
                        : embed,
                    ),
                  }));
                  return uploadResponse;
                })
                .catch((error: unknown) => {
                  handleImageUploadFailure({
                    castLocalKey,
                    embedId,
                    error,
                    imageUrl: response.imageUrl,
                    localUriRef,
                  });
                  throw error;
                })
            : undefined;

        void uploadPromise?.catch(() => {});

        // Update the same canonical entry with the resolved URL and metadata.
        setCanonicalEmbeds((prev) => ({
          ...prev,
          [castLocalKey]: (prev[castLocalKey] ?? []).map((e) =>
            e.id === embedId
              ? ({
                  id: embedId,
                  kind: 'image',
                  localUriRef,
                  url: response.imageUrl,
                  uploadStatus:
                    response.version === 'v2' ? 'uploading' : 'uploaded',
                  aspectRatio,
                  width: response.width,
                  height: response.height,
                  ...(response.version === 'v2' && {
                    previewUrl: response.previewUrl,
                    uploadPromise,
                  }),
                  apiImageEmbed,
                } satisfies Extract<CastComposerEmbed, { kind: 'image' }>)
              : e,
          ),
        }));

        // Keep processedEmbeds in sync for backward-compat preview renderers.
        setProcessedEmbeds((prev) => {
          let processedEmbedsForCast = prev[castLocalKey];
          if (!processedEmbedsForCast) {
            processedEmbedsForCast = {
              urls: [],
              unknowns: [],
              images: [],
              videos: [],
            } satisfies ApiCastEmbeds;
          }
          return {
            ...prev,
            [castLocalKey]: {
              ...processedEmbedsForCast,
              images: [...processedEmbedsForCast.images, apiImageEmbed],
            } satisfies ApiCastEmbeds,
          };
        });
      } catch (e: unknown) {
        handleImageUploadFailure({
          castLocalKey,
          embedId,
          error: e,
          localUriRef,
        });
      } finally {
        setModifyingEmbeds(false, castLocalKey);
      }
    },
    [
      getCanAddMoreEmbeds,
      maxEmbedsLength,
      nextEmbedId,
      handleImageUploadFailure,
      setCanonicalEmbeds,
      setModifyingEmbeds,
      setUploadingError,
    ],
  );

  const addImageEmbed = useCallback(
    async ({
      localUriRef,
      file,
      imageUploaderPromise,
      castLocalKey,
    }: {
      localUriRef: string;
      file: File;
      imageUploaderPromise?: Promise<{
        url: string;
        optimisticImageId: string;
      }>;
      castLocalKey: number;
    }) => {
      if (!uploadCloudflareImage) {
        throw new Error('No upload function defined');
      }

      if (!getCanAddMoreEmbeds(castLocalKey)) {
        return;
      }

      setModifyingEmbeds(true, castLocalKey);
      setUploadingError(undefined, castLocalKey);

      const embedId = nextEmbedId();

      // Canonical-first: register the entry immediately so it can be tracked.
      setCanonicalEmbeds((prev) => ({
        ...prev,
        [castLocalKey]: addEmbedToCast(
          prev[castLocalKey] ?? [],
          {
            id: embedId,
            kind: 'image',
            localUriRef,
            uploadStatus: 'uploading',
          },
          maxEmbedsLength,
        ),
      }));

      try {
        const uploadResult = await uploadCloudflareImage({
          file,
          imageUploaderPromise,
        });

        if (!uploadResult?.imageUrl) {
          const e = 'Error uploading image - Cloudflare request failed';
          handleImageUploadFailure({
            castLocalKey,
            embedId,
            error: e,
            localUriRef,
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
          const img = new Image();
          img.onload = function () {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            setImageAspectRatios((prev) => {
              prev[uploadResult.imageUrl] = getImageAspectRatio({
                w: width,
                h: height,
              });
              return { ...prev };
            });
          };
          if (typeof event.target?.result === 'string') {
            img.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);

        const apiImageEmbed: ApiCastImageEmbed = {
          type: 'image',
          alt: 'Image',
          sourceUrl: uploadResult.imageUrl,
          url: uploadResult.imageUrl,
        };

        const uploadPromise =
          uploadResult.version === 'v2'
            ? uploadResult.uploadPromise
                .then((uploadResponse) => {
                  setCanonicalEmbeds((prev) => ({
                    ...prev,
                    [castLocalKey]: (prev[castLocalKey] ?? []).map((embed) =>
                      embed.kind === 'image' && embed.id === embedId
                        ? { ...embed, uploadStatus: 'uploaded' as const }
                        : embed,
                    ),
                  }));
                  return uploadResponse;
                })
                .catch((error: unknown) => {
                  handleImageUploadFailure({
                    castLocalKey,
                    embedId,
                    error,
                    imageUrl: uploadResult.imageUrl,
                    localUriRef,
                  });
                  throw error;
                })
            : undefined;

        void uploadPromise?.catch(() => {});

        setCanonicalEmbeds((prev) => ({
          ...prev,
          [castLocalKey]: (prev[castLocalKey] ?? []).map((em) =>
            em.id === embedId
              ? ({
                  id: embedId,
                  kind: 'image',
                  localUriRef,
                  url: uploadResult.imageUrl,
                  uploadStatus:
                    uploadResult.version === 'v2' ? 'uploading' : 'uploaded',
                  aspectRatio: 1,
                  ...(uploadResult.version === 'v2' && {
                    previewUrl: uploadResult.previewUrl,
                    uploadPromise,
                  }),
                  apiImageEmbed,
                } satisfies Extract<CastComposerEmbed, { kind: 'image' }>)
              : em,
          ),
        }));
      } catch (e: unknown) {
        handleImageUploadFailure({
          castLocalKey,
          embedId,
          error: e,
          localUriRef,
        });
      } finally {
        setModifyingEmbeds(false, castLocalKey);
      }
    },
    [
      getCanAddMoreEmbeds,
      handleImageUploadFailure,
      maxEmbedsLength,
      nextEmbedId,
      setCanonicalEmbeds,
      setModifyingEmbeds,
      setUploadingError,
      uploadCloudflareImage,
    ],
  );

  const removeVideoEmbed = useCallback(
    async ({
      videoId,
      videoUrl,
      castLocalKey,
    }: {
      videoId: string;
      videoUrl: string | undefined;
      castLocalKey: number;
    }) => {
      setModifyingEmbeds(true, castLocalKey);

      if (activeVideoUploadProcessRef.current) {
        // Terminating server-side goes over the network and can reject; there
        // is nothing to do about it, but it must not become an unhandled
        // rejection. Same hazard as the stalled-upload path below.
        void activeVideoUploadProcessRef.current.abort(true)?.catch(() => {});
        activeVideoUploadProcessRef.current = undefined;
      }
      activeVideoUploadRef.current = undefined;

      if (prepareAbortControllerRef.current) {
        prepareAbortControllerRef.current.abort();
        prepareAbortControllerRef.current = undefined;
      }

      try {
        void abandonVideoUpload({ videoId });
      } catch {}

      setUploadingStatus(undefined, castLocalKey);
      setUploadingError(undefined, castLocalKey);

      setCanonicalEmbeds((prev) => {
        if (!prev[castLocalKey]) return prev;
        return {
          ...prev,
          [castLocalKey]: removeEmbedsFromCast(
            prev[castLocalKey],
            (e) =>
              e.kind === 'video' &&
              (videoUrl !== undefined
                ? e.url === videoUrl
                : e.videoId === videoId),
          ),
        };
      });

      setProcessedEmbeds((currentProcessedEmbeds) => {
        if (
          !currentProcessedEmbeds[castLocalKey] ||
          typeof videoUrl === 'undefined'
        ) {
          return currentProcessedEmbeds;
        }
        const { videos } = currentProcessedEmbeds[castLocalKey];
        if (!videos) {
          return currentProcessedEmbeds;
        }
        return {
          ...currentProcessedEmbeds,
          [castLocalKey]: {
            ...currentProcessedEmbeds[castLocalKey],
            videos: videos.filter((o) => o.url !== videoUrl),
          },
        };
      });

      setModifyingEmbeds(false, castLocalKey);
    },
    [
      abandonVideoUpload,
      setCanonicalEmbeds,
      setModifyingEmbeds,
      setUploadingError,
      setUploadingStatus,
    ],
  );

  const addVideoEmbed = useCallback(
    async ({
      fileName,
      file,
      castLocalKey,
      localUriRef,
    }: {
      fileName: string;
      file: File | string;
      castLocalKey: number;
      localUriRef: string;
    }) => {
      if (!getCanAddMoreEmbeds(castLocalKey)) {
        return;
      }

      setModifyingEmbeds(true, castLocalKey);
      setUploadingError(undefined, castLocalKey);

      // Should never happen but just in case
      if (prepareAbortControllerRef.current) {
        prepareAbortControllerRef.current.abort();
        prepareAbortControllerRef.current = undefined;
      }

      let finalFile:
        | {
            uri: string;
            name: string;
            size: number;
            type: string;
            clientUploadMetadata?: unknown;
          }
        | File;
      if (typeof file === 'string') {
        if (compressVideo) {
          setUploadingStatus('Preparing...', castLocalKey);
          prepareAbortControllerRef.current = new AbortController();

          const compressed = await compressVideo({
            fileName,
            uri: file,
            signal: prepareAbortControllerRef.current.signal,
            onProgress: (p) => {
              setUploadingStatus(
                `Preparing... ${formatFullPercent(p)}`,
                castLocalKey,
              );
            },
          });

          prepareAbortControllerRef.current = undefined;

          finalFile = compressed;
        } else {
          throw new Error('Compressor missing for video upload');
        }
      } else {
        finalFile = file;
      }

      setUploadingStatus('Uploading...', castLocalKey);

      let videoInfo: ApiPrepareVideoUpload200Response['result'];

      const videoSizeBytes = finalFile.size;
      const uploadTraceId = createVideoUploadTraceId();
      const clientUploadMetadata = {
        uploadTraceId,
        source: 'cast_composer',
        file: {
          name: finalFile.name,
          type: finalFile.type,
          size: finalFile.size,
          isNativeFile: 'uri' in finalFile,
        },
        compressor:
          'clientUploadMetadata' in finalFile
            ? finalFile.clientUploadMetadata
            : undefined,
      };

      try {
        videoInfo = await prepareVideoUpload({
          videoSizeBytes: videoSizeBytes,
          supportsDynamicUpload: true,
          clientUploadMetadata,
        });
      } catch (error: unknown) {
        let errorMessage = 'Error preparing video upload, please try again';
        if (isHandledFetchError(error)) {
          if (error.status === 403) {
            invalidateUserAppContext();
          }
          const body = getFirstApiErrorBody(error);
          if (body?.message) {
            errorMessage = body.message;
          }
        }
        setModifyingEmbeds(false, castLocalKey);
        setUploadingStatus(undefined, castLocalKey);
        setUploadingError(errorMessage, castLocalKey);
        setDetailedUploadingError(`${error}`, castLocalKey);
        trackError(new VideoPreparationError({ error }));
        return;
      }

      // Should never happen but just in case
      if (activeVideoUploadProcessRef.current) {
        void activeVideoUploadProcessRef.current.abort(true)?.catch(() => {});
      }

      const videoId = videoInfo.videoId;
      const embedId = nextEmbedId();
      activeVideoUploadRef.current = {
        id: videoId,
        castLocalKey,
      };

      const markVideoUploadFailed = (uploadError: string) => {
        setCanonicalEmbeds((prev) => ({
          ...prev,
          [castLocalKey]: (prev[castLocalKey] ?? []).map((e) =>
            e.id === embedId && e.kind === 'video'
              ? {
                  ...e,
                  uploadStatus: 'failed' as const,
                  uploadError,
                }
              : e,
          ),
        }));
      };

      // Canonical-first: add the entry immediately so it is trackable and
      // removable while the upload is in progress.
      setCanonicalEmbeds((prev) => ({
        ...prev,
        [castLocalKey]: addEmbedToCast(
          prev[castLocalKey] ?? [],
          {
            id: embedId,
            kind: 'video',
            videoId,
            url: `https://stream.farcaster.xyz/v1/video/${videoId}.m3u8`,
            localUriRef,
            width: 0,
            height: 0,
            uploadStatus: 'uploading',
          },
          maxEmbedsLength,
        ),
      }));

      let uploadIdleTimeout: ReturnType<typeof setTimeout> | undefined;

      const clearUploadIdleTimeout = () => {
        if (uploadIdleTimeout !== undefined) {
          clearTimeout(uploadIdleTimeout);
          uploadIdleTimeout = undefined;
        }
      };

      // Every transport callback and timer can arrive late: an in-flight
      // request can resolve after the user removed the video, and tus only
      // suppresses `onError` after an abort -- `_emitSuccess` and
      // `_emitProgress` carry no such guard. By then the shared refs may belong
      // to a newer upload, so nothing shared may be touched unless this upload
      // still owns them. Cheaper than reasoning about a third-party library's
      // internal abort semantics, and correct if those ever change.
      const ownsActiveUpload = () =>
        activeVideoUploadRef.current?.id === videoId;

      // The upload transport can go quiet indefinitely (backgrounded app, dead
      // connection) without ever calling onError. Without this guard the
      // composer sits on "Uploading..." forever and the cast can never be sent.
      const markVideoUploadStalled = () => {
        if (!ownsActiveUpload()) {
          // Cancelled or superseded in the meantime -> nothing to report.
          return;
        }

        clearUploadIdleTimeout();
        // `abort(true)` terminates the upload server-side over the network, so
        // it can reject -- most likely on exactly the dead connection that got
        // us here. Nothing useful to do about it, but it must not surface as an
        // unhandled rejection.
        void activeVideoUploadProcessRef.current?.abort(true).catch(() => {});
        // Release the row server-side too. Without this every stall leaves a
        // video frozen in `pending` with nothing to sweep it -- the same
        // accumulation this change is meant to stop producing.
        void abandonVideoUpload({ videoId }).catch(() => {});
        activeVideoUploadProcessRef.current = undefined;
        activeVideoUploadRef.current = undefined;
        setModifyingEmbeds(false, castLocalKey);
        setUploadingStatus(undefined, castLocalKey);
        setUploadingError(VIDEO_UPLOAD_STALLED_MESSAGE, castLocalKey);
        markVideoUploadFailed(VIDEO_UPLOAD_STALLED_MESSAGE);
        setDetailedUploadingError(
          `video-upload-stalled videoId=${videoId} uploadTraceId=${uploadTraceId}`,
          castLocalKey,
        );
        trackError(
          new VideoUploadError({
            error: new Error(
              `Video upload stalled: no progress for ${VIDEO_UPLOAD_IDLE_TIMEOUT_MS}ms`,
            ),
            videoId,
            uploadTraceId,
          }),
        );
      };

      const resetUploadIdleTimeout = () => {
        clearUploadIdleTimeout();
        uploadIdleTimeout = setTimeout(
          markVideoUploadStalled,
          VIDEO_UPLOAD_IDLE_TIMEOUT_MS,
        );
      };

      activeVideoUploadProcessRef.current = new Upload(finalFile as File, {
        endpoint: videoInfo.uploadUrl,
        headers: videoInfo.headers as Record<string, string>,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filetype: finalFile.type,
          name: finalFile.name,
          uploadTraceId,
          ...(videoInfo.metadata as Record<string, string>),
        },
        chunkSize: 5242880,
        onError: function (error) {
          clearUploadIdleTimeout();

          if (!ownsActiveUpload()) {
            // Removed by the user, or superseded -> not ours to report on, and
            // the refs now belong to someone else.
            return;
          }

          activeVideoUploadProcessRef.current = undefined;
          activeVideoUploadRef.current = undefined;
          setModifyingEmbeds(false, castLocalKey);
          setUploadingStatus(undefined, castLocalKey);
          setUploadingError(
            'Error uploading video, check your connection',
            castLocalKey,
          );
          markVideoUploadFailed('Error uploading video, check your connection');
          setDetailedUploadingError(`${error}`, castLocalKey);
          trackError(new VideoUploadError({ error, videoId, uploadTraceId }));
        },
        onProgress: function (bytesUploaded) {
          if (!ownsActiveUpload()) {
            // A late progress event from a superseded upload would otherwise
            // overwrite the replacement's status text.
            return;
          }

          resetUploadIdleTimeout();

          const ratio = Math.min(bytesUploaded / videoSizeBytes, 0.999);

          setUploadingStatus(
            `Uploading... ${formatFullPercent(ratio)}`,
            castLocalKey,
          );
        },
        onSuccess: async () => {
          clearUploadIdleTimeout();

          if (!ownsActiveUpload()) {
            // tus does not suppress `onSuccess` after an abort, so a
            // superseded upload can still land here. Clearing the process ref
            // would strand the replacement's transport with nothing able to
            // abort it.
            return;
          }

          activeVideoUploadProcessRef.current = undefined;

          const pollStartedAt = Date.now();
          let pollAttempt = 0;

          const failVideoProcessing = (message: string) => {
            setModifyingEmbeds(false, castLocalKey);
            setUploadingStatus(undefined, castLocalKey);
            activeVideoUploadRef.current = undefined;
            markVideoUploadFailed(message);
            setUploadingError(message, castLocalKey);
          };

          // Note the poll leans on the same ownership check as the transport
          // callbacks: removing a video abandons it server-side but cannot
          // cancel an already-scheduled poll, so a stale tick must not read
          // `abandoned` for its own video and clear the replacement's ref.
          const checkState = async () => {
            if (!ownsActiveUpload()) {
              // Aborted, or superseded by a newer upload -> bail
              return;
            }

            const scheduleNextCheck = () => {
              pollAttempt += 1;
              setTimeout(() => {
                void runCheckState();
              }, getVideoPollDelayMs(pollAttempt));
            };

            // Bound the loop so a video that never reaches a terminal state
            // surfaces an error instead of spinning forever.
            if (Date.now() - pollStartedAt > VIDEO_PROCESSING_TIMEOUT_MS) {
              failVideoProcessing(VIDEO_PROCESSING_TIMEOUT_MESSAGE);
              // Release the row server-side, so a timed-out video does not sit
              // in `pending`/`processing` forever with nothing to sweep it.
              void abandonVideoUpload({ videoId }).catch(() => {});
              setDetailedUploadingError(
                `video-processing-timeout videoId=${videoId} uploadTraceId=${uploadTraceId}`,
                castLocalKey,
              );
              trackError(
                new VideoStatusError({
                  error: new Error(
                    `Video processing timed out after ${VIDEO_PROCESSING_TIMEOUT_MS}ms`,
                  ),
                  videoId,
                  uploadTraceId,
                }),
              );
              return;
            }

            let video: ApiVideo;
            try {
              video = await getVideoState({ videoId });
            } catch (e: unknown) {
              trackError(
                new VideoStatusError({ error: e, videoId, uploadTraceId }),
              );
              if (ownsActiveUpload()) {
                scheduleNextCheck();
              }
              return;
            }

            // The await above yields, so the upload may have been removed and
            // replaced while the request was in flight.
            if (!ownsActiveUpload()) {
              return;
            }

            const decision = decideVideoPollAction(video);

            if (decision.type === 'keepPolling') {
              setUploadingStatus(decision.status, castLocalKey);
              scheduleNextCheck();
              return;
            }

            if (decision.type === 'failed') {
              failVideoProcessing(decision.message);
              // `abandoned` / `deleted` / `hidden` are new terminal outcomes
              // here -- previously they fell through to nothing. Without this
              // there is no way to tell whether they fire in production.
              setDetailedUploadingError(
                `video-processing-failed state=${video.state} videoId=${videoId} uploadTraceId=${uploadTraceId}`,
                castLocalKey,
              );
              trackError(
                new VideoStatusError({
                  error: new Error(
                    `Video processing ended in terminal state ${video.state}`,
                  ),
                  videoId,
                  uploadTraceId,
                }),
              );
              return;
            }

            setModifyingEmbeds(false, castLocalKey);
            setUploadingStatus(undefined, castLocalKey);

            const apiVideoEmbed: ApiCastVideoEmbed = video.embed;

            // Update the same canonical entry by id with final dimensions.
            setCanonicalEmbeds((prev) => {
              if (!prev[castLocalKey]) return prev;
              return {
                ...prev,
                [castLocalKey]: prev[castLocalKey].map((e) =>
                  e.id === embedId
                    ? ({
                        id: embedId,
                        kind: 'video',
                        videoId,
                        url: video.embed.url,
                        localUriRef,
                        width: video.embed.width!,
                        height: video.embed.height!,
                        thumbnailUrl: video.embed.thumbnailUrl,
                        uploadStatus: 'uploaded',
                        apiVideoEmbed,
                      } satisfies Extract<CastComposerEmbed, { kind: 'video' }>)
                    : e,
                ),
              };
            });

            setProcessedEmbeds((prev) => {
              let processedEmbedsForCast = prev[castLocalKey];
              if (!processedEmbedsForCast) {
                processedEmbedsForCast = {
                  urls: [],
                  unknowns: [],
                  images: [],
                  videos: [],
                } satisfies ApiCastEmbeds;
              }
              return {
                ...prev,
                [castLocalKey]: {
                  ...processedEmbedsForCast,
                  videos: [
                    ...(processedEmbedsForCast.videos ?? []),
                    apiVideoEmbed,
                  ],
                } satisfies ApiCastEmbeds,
              };
            });

            activeVideoUploadRef.current = undefined;
          };

          // Any throw inside the loop body would otherwise reject silently and
          // stop the poll -- the same class of failure this whole change
          // exists to remove. Surface it and fail the embed instead.
          const runCheckState = () => {
            void checkState().catch((e: unknown) => {
              trackError(
                new VideoStatusError({ error: e, videoId, uploadTraceId }),
              );

              if (!ownsActiveUpload()) {
                return;
              }

              failVideoProcessing(VIDEO_PROCESSING_FAILED_MESSAGE);
              setDetailedUploadingError(
                `video-poll-threw videoId=${videoId} uploadTraceId=${uploadTraceId} ${e}`,
                castLocalKey,
              );
            });
          };

          runCheckState();
        },
      });

      // Arm the idle timer before starting, not after. If a transport callback
      // ever ran during `start()`, its `clearUploadIdleTimeout` would fire
      // before the timer existed and we would then arm one that nothing ever
      // clears -- which could abort a healthy upload mid-processing.
      resetUploadIdleTimeout();
      activeVideoUploadProcessRef.current.start();
    },
    [
      abandonVideoUpload,
      compressVideo,
      getCanAddMoreEmbeds,
      getVideoState,
      invalidateUserAppContext,
      maxEmbedsLength,
      nextEmbedId,
      prepareVideoUpload,
      setCanonicalEmbeds,
      setDetailedUploadingError,
      setModifyingEmbeds,
      setUploadingError,
      setUploadingStatus,
      trackError,
    ],
  );

  const addMediaEmbed = useCallback(
    async ({
      castLocalKey,
      localUriRef,
      file,
      imageUploaderPromise,
    }: {
      castLocalKey: number;
      localUriRef: string;
      file: File;
      imageUploaderPromise?: Promise<{
        url: string;
        optimisticImageId: string;
      }>;
    }) => {
      const fileType = getEmbedType(file.name);

      switch (fileType) {
        case 'image':
          addImageEmbed({
            localUriRef,
            file,
            imageUploaderPromise,
            castLocalKey,
          });
          break;
        case 'video':
          addVideoEmbed({
            fileName: file.name,
            file,
            castLocalKey,
            localUriRef: localUriRef,
          });
          break;
        case 'no-extension':
          setUploadingError('Unrecognized file extension', castLocalKey);
          break;
        case 'unsupported':
          setUploadingError('Unsupported file format', castLocalKey);
          break;
      }
    },
    [addImageEmbed, addVideoEmbed, setUploadingError],
  );

  const removeImageEmbedByUrl = useCallback(
    async ({
      imageUrl,
      castLocalKey,
    }: {
      imageUrl: string;
      castLocalKey: number;
    }) => {
      setModifyingEmbeds(true, castLocalKey);
      setCanonicalEmbeds((prev) => {
        if (!prev[castLocalKey]) return prev;
        return {
          ...prev,
          [castLocalKey]: removeEmbedsFromCast(
            prev[castLocalKey],
            (e) => e.kind === 'image' && e.url === imageUrl,
          ),
        };
      });
      setProcessedEmbeds((currentProcessedEmbeds) => {
        if (!currentProcessedEmbeds[castLocalKey]) {
          return currentProcessedEmbeds;
        }
        return {
          ...currentProcessedEmbeds,
          [castLocalKey]: {
            ...currentProcessedEmbeds[castLocalKey],
            images: currentProcessedEmbeds[castLocalKey].images.filter(
              (o) => o.url !== imageUrl,
            ),
          },
        };
      });
      setModifyingEmbeds(false, castLocalKey);
    },
    [setCanonicalEmbeds, setModifyingEmbeds],
  );

  const cancelActiveVideoUpload = useCallback(async () => {
    if (activeVideoUploadRef.current) {
      await removeVideoEmbed({
        videoId: activeVideoUploadRef.current.id,
        videoUrl: undefined,
        castLocalKey: activeVideoUploadRef.current.castLocalKey,
      });
    }
  }, [removeVideoEmbed]);

  const setEmbedsFromDraftCast = useCallback(
    async ({
      embeds,
      castLocalKey,
      onDraftImages: _onDraftImages,
      onDraftVideos,
      onDraftUrls,
    }: {
      embeds: string[];
      castLocalKey: number;
      onDraftImages: ({
        castLocalKey,
        images,
      }: {
        castLocalKey: number;
        images: {
          height: number;
          width: number;
          src: string;
        }[];
      }) => void;
      onDraftVideos: ({
        castLocalKey,
        videos,
      }: {
        castLocalKey: number;
        videos: {
          height: number;
          width: number;
          src: string;
        }[];
      }) => void;
      onDraftUrls: ({
        castLocalKey,
        urls,
      }: {
        castLocalKey: number;
        urls: string[];
      }) => void;
    }) => {
      const data = await processCastAttatchments({
        text: '',
        embeds,
      });
      if (data === null) {
        // eslint-disable-next-line no-console
        console.warn(
          'data was null: useCastComposerEmbeds:processCastAttachments',
        );
      }
      const { result } = data;

      const images = result.embeds?.images ?? [];
      const videos = result.embeds?.videos ?? [];
      const urls = result.embeds?.urls ?? [];
      const casts = result.embeds?.casts ?? [];
      const filteredUrls = filterDraftUrlEmbeds({
        images,
        videos,
        urls,
        casts,
      });

      // Do not call onDraftImages here: processedEmbeds already includes
      // `images`, and QueuedCast renders those via ComposerOpenGraphAttachment /
      // CastComposerEmbedsPreviews. Pushing the same URLs into optimistic
      // media stacks a second copy (e.g. save draft → reopen immediately).
      // Optimistic images are for in-flight local uploads (localUriRef), not
      // fully resolved CDN URLs from processCastAttachments.

      if (videos.length !== 0) {
        onDraftVideos({
          castLocalKey,
          videos: videos.map((o) => ({
            height: o.height || 1000,
            width: o.width || 1000,
            src: o.url,
          })),
        });
      }

      if (filteredUrls.length !== 0) {
        onDraftUrls({
          castLocalKey,
          urls: filteredUrls.map((o) => o.openGraph.url),
        });
      }

      const canonicalEntries = buildCanonicalEmbedsFromDraft({
        embeds,
        images,
        videos,
        urls: filteredUrls,
        casts,
        nextEmbedId,
      });

      setCanonicalEmbeds((prevEmbeds) => ({
        ...prevEmbeds,
        [castLocalKey]: mergeHydratedEmbedsPreservingTextSource(
          prevEmbeds[castLocalKey] ?? [],
          canonicalEntries,
          maxEmbedsLength,
        ),
      }));
      // Remove processed text because we always get an empty string
      // (since we always use an empty string in the request) which breaks
      // the preview screen. Alternative is to pass in the cast text eventually
      // from the composers but debouncing will be pain in that scenario.
      if (result.embeds) {
        result.embeds.processedCastText = undefined;
      }

      setProcessedEmbeds((prevProcessedEmbeds) => ({
        ...prevProcessedEmbeds,
        [castLocalKey]: mergeHydratedProcessedEmbedsPreservingTextUrls({
          existingProcessedEmbeds: prevProcessedEmbeds[castLocalKey],
          hydratedProcessedEmbeds: result.embeds ?? emptyApiCastEmbeds,
          currentCanonicalEmbeds:
            canonicalEmbedsRef.current[castLocalKey] ?? [],
        }),
      }));
    },
    [maxEmbedsLength, nextEmbedId, processCastAttatchments, setCanonicalEmbeds],
  );

  const setEmbedsFromAllDraftCasts = useCallback(
    async (
      allEmbedURLs: { [castLocalKey: number]: string[] },
      onDraftImages: ({
        castLocalKey,
        images,
      }: {
        castLocalKey: number;
        images: {
          height: number;
          width: number;
          src: string;
        }[];
      }) => void,
      onDraftVideos: ({
        castLocalKey,
        videos,
      }: {
        castLocalKey: number;
        videos: {
          height: number;
          width: number;
          src: string;
        }[];
      }) => void,
      onDraftUrls: ({
        castLocalKey,
        urls,
      }: {
        castLocalKey: number;
        urls: string[];
      }) => void,
    ) => {
      await Promise.all(
        Object.entries(allEmbedURLs).map(
          ([castLocalKey, embeds]: [string, string[]]) =>
            setEmbedsFromDraftCast({
              embeds,
              castLocalKey: Number(castLocalKey),
              onDraftImages,
              onDraftVideos,
              onDraftUrls,
            }),
        ),
      );
    },
    [setEmbedsFromDraftCast],
  );

  const removeUrlEmbed = useCallback(
    ({ url, castLocalKey }: { url: string; castLocalKey: number }) => {
      // Store and compare ignored URLs by normalized form so a dismiss for
      // `https://grin.io/chat` also blocks a later re-add of the trailing-
      // slash variant (and vice versa).
      const urlsToIgnoreUpdated = buildUrlSnapEmbedIgnoreSet({
        embeds: canonicalEmbeds[castLocalKey] ?? [],
        url,
        existingUrlsToIgnore: urlsToIgnore[castLocalKey],
      });

      setCanonicalEmbeds((prev) => {
        if (!prev[castLocalKey]) return prev;
        return {
          ...prev,
          [castLocalKey]: removeEmbedsFromCast(
            prev[castLocalKey],
            (e) =>
              (e.kind === 'url' || e.kind === 'snap') &&
              urlSnapEmbedMatchesAnyUrl({
                embed: e,
                urls: urlsToIgnoreUpdated,
              }),
          ),
        };
      });

      setProcessedEmbeds((prev) => {
        const processedEmbedsForCast = prev[castLocalKey];
        if (!processedEmbedsForCast) {
          return prev;
        }

        return {
          ...prev,
          [castLocalKey]: pruneProcessedUrlEmbedsByUrls({
            processedEmbeds: processedEmbedsForCast,
            urls: urlsToIgnoreUpdated,
          }),
        };
      });

      setUrlsToIgnore((prevUrlsToIgnore) => ({
        ...prevUrlsToIgnore,
        [castLocalKey]: urlsToIgnoreUpdated,
      }));
    },
    [canonicalEmbeds, setCanonicalEmbeds, urlsToIgnore],
  );

  const fetchCastEmbed = useFetchCastAttachment();

  const preProcessEmbeds = useCallback(async () => {
    const castHasCanonicalMedia = (castLocalKey: number) => {
      const embedsForCast = embeds[castLocalKey];
      return (
        (embedsForCast?.images.length ?? 0) > 0 ||
        (embedsForCast?.videos.length ?? 0) > 0
      );
    };

    const alreadyCachedUrlEmbeds: {
      [castLocalKey: number]: ApiCastUrlEmbed[];
    } = {};
    let someUrlEmbedMissingFromCache = false;
    const allEmbedUrls: { [castLocalKey: number]: string[] } = {};
    for (const castLocalKey in embeds) {
      const embedsForCast = embeds[castLocalKey];
      allEmbedUrls[castLocalKey] = [];
      const seenNormalizedRequestUrls = new Set<string>();
      for (const { url } of embedsForCast.urls) {
        const norm = normalizeComposerEmbedUrl(url);
        if (seenNormalizedRequestUrls.has(norm)) {
          continue;
        }
        seenNormalizedRequestUrls.add(norm);
        allEmbedUrls[castLocalKey].push(url);
        // Don't eagerly cache Farcaster URLs so we get better quote cast views
        if (
          url.indexOf('warpcast.com') !== -1 ||
          url.indexOf('farcaster.xyz') !== -1
        ) {
          someUrlEmbedMissingFromCache = true;
          continue;
        }

        const previewCacheResult = checkCastAttachmentPreviewCache({
          previewUrl: url,
        });
        if (typeof previewCacheResult === 'undefined') {
          someUrlEmbedMissingFromCache = true;
        } else if (alreadyCachedUrlEmbeds[castLocalKey]) {
          alreadyCachedUrlEmbeds[castLocalKey].push(previewCacheResult);
        } else {
          alreadyCachedUrlEmbeds[castLocalKey] = [previewCacheResult];
        }
      }
    }

    if (!someUrlEmbedMissingFromCache) {
      setProcessedEmbeds((prevProcessedEmbeds) => {
        let result = { ...prevProcessedEmbeds };
        for (const castLocalKey in allEmbedUrls) {
          const cachedUrlEmbeds = alreadyCachedUrlEmbeds[castLocalKey];
          const hasNoUrls = (allEmbedUrls[castLocalKey]?.length ?? 0) === 0;
          const shouldClearMedia =
            hasNoUrls && !castHasCanonicalMedia(Number(castLocalKey));
          const existingEmbeds = result[castLocalKey] ?? emptyApiCastEmbeds;

          result = {
            ...result,
            [castLocalKey]: {
              ...existingEmbeds,
              urls: cachedUrlEmbeds ?? [],
              ...(shouldClearMedia && { images: [], videos: [] }),
            },
          };
        }
        if (isEqual(prevProcessedEmbeds, result)) {
          return prevProcessedEmbeds;
        }
        return result;
      });
      return;
    }

    const newFetchedUrlEmbeds: CastEmbedsPerCast[] = await Promise.all(
      Object.entries(allEmbedUrls).map(async ([key, castEmbedUrls]) => {
        const castLocalKey = Number(key);

        if (castEmbedUrls.length === 0) {
          return { [castLocalKey]: emptyApiCastEmbeds };
        }

        const data = await fetchCastEmbed({
          embeds: castEmbedUrls,
        });
        if (data === null) {
          // eslint-disable-next-line no-console
          console.warn(
            'data was null: useCastComposerEmbeds:processCastAttachments',
          );
          return { [castLocalKey]: emptyApiCastEmbeds };
        }
        const {
          responseData: { result },
          embeds: resolvedEmbedUrls,
        } = data;

        if (!result.embeds || !isEqual(resolvedEmbedUrls, castEmbedUrls)) {
          return { [castLocalKey]: emptyApiCastEmbeds };
        }

        const embeds = result.embeds;

        const crawledUrlEmbeds = filterCrawlableUrlEmbeds(embeds.urls);
        let fallbackUrlEmbeds: ApiCastUrlEmbed[] = [];

        if (resolveUrlEmbedsOnFailure) {
          const missingUrls = findMissingOrIncompleteRequestedUrls({
            requestedUrls: castEmbedUrls,
            urlEmbeds: crawledUrlEmbeds,
          });

          if (missingUrls.length > 0) {
            try {
              fallbackUrlEmbeds =
                (await resolveUrlEmbedsOnFailure({
                  castLocalKey: castLocalKey,
                  urls: missingUrls,
                })) ?? [];
            } catch (error) {
              trackError(error);
            }
          }
        }

        embeds.urls = projectUrlEmbedsForRequestedUrls({
          requestedUrls: castEmbedUrls,
          crawledUrlEmbeds,
          fallbackUrlEmbeds,
        });
        const strippedEmbeds = stripQuoteCastUrlEmbeds(embeds, {
          requestedUrls: castEmbedUrls,
        });
        // Remove processed text because we always get an empty string
        // (since we always use an empty string in the request) which breaks
        // the preview screen. Alternative is to pass in the cast text eventually
        // from the composers but debouncing will be pain in that scenario.
        strippedEmbeds.processedCastText = undefined;

        return { [castLocalKey]: strippedEmbeds };
      }),
    );

    const flattenedFetchedUrlEmbeds: { [castLocalKey: number]: ApiCastEmbeds } =
      {};
    for (const result of newFetchedUrlEmbeds) {
      for (const castLocalKey in result) {
        flattenedFetchedUrlEmbeds[castLocalKey] = result[castLocalKey];
      }
    }

    setProcessedEmbeds((prevProcessedEmbeds) => {
      if (
        typeof preProcessEmbeds === 'undefined' ||
        // We have to check this because above the default for the state is an invalidly typed empty object.
        // FIXME: Fix the type above to be a proper undefined!
        JSON.stringify(prevProcessedEmbeds) === '{}'
      ) {
        return flattenedFetchedUrlEmbeds;
      }

      let result = { ...prevProcessedEmbeds };
      const castLocalKeys = new Set([
        ...Object.keys(result),
        ...Object.keys(flattenedFetchedUrlEmbeds),
      ]);
      for (const castLocalKey of castLocalKeys) {
        const castLocalKeyNumber = Number(castLocalKey);
        const newEmbeds = flattenedFetchedUrlEmbeds[castLocalKeyNumber];
        const hasNoUrls = (allEmbedUrls[castLocalKeyNumber]?.length ?? 0) === 0;
        const shouldPreserveMedia =
          hasNoUrls && castHasCanonicalMedia(castLocalKeyNumber);
        const existingEmbeds = result[castLocalKeyNumber] ?? emptyApiCastEmbeds;
        const mergedProcessedEmbeds =
          mergeHydratedProcessedEmbedsPreservingTextUrls({
            existingProcessedEmbeds: existingEmbeds,
            hydratedProcessedEmbeds: newEmbeds ?? emptyApiCastEmbeds,
            currentCanonicalEmbeds:
              canonicalEmbedsRef.current[castLocalKeyNumber] ?? [],
          });

        const mergedEmbeds = {
          ...existingEmbeds,
          ...mergedProcessedEmbeds,
          urls: mergedProcessedEmbeds.urls,
          images: shouldPreserveMedia
            ? existingEmbeds.images
            : (mergedProcessedEmbeds.images ?? []),
          videos: shouldPreserveMedia
            ? existingEmbeds.videos
            : (mergedProcessedEmbeds.videos ?? []),
        };
        result = {
          ...result,
          [castLocalKeyNumber]: mergedEmbeds,
        };
      }

      if (isEqual(prevProcessedEmbeds, result)) {
        return prevProcessedEmbeds;
      }

      return result;
    });
  }, [
    checkCastAttachmentPreviewCache,
    embeds,
    fetchCastEmbed,
    resolveUrlEmbedsOnFailure,
    trackError,
  ]);

  useEffect(() => {
    preProcessEmbeds();
    // We want to process the embeds whenever they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeds]);

  // ---------------------------------------------------------------------------
  // New canonical store primitives
  // ---------------------------------------------------------------------------

  const addEmbed = useCallback(
    ({
      castLocalKey,
      embed,
    }: {
      castLocalKey: number;
      embed: CastComposerEmbed;
    }) => {
      dispatchCanonicalEmbeds({
        type: 'add',
        castLocalKey,
        embed,
        maxEmbedsLength,
      });
    },
    [maxEmbedsLength],
  );

  const removeEmbed = useCallback(
    ({
      castLocalKey,
      predicate,
    }: {
      castLocalKey: number;
      predicate: (embed: CastComposerEmbed) => boolean;
    }) => {
      dispatchCanonicalEmbeds({
        type: 'remove',
        castLocalKey,
        predicate,
      });
    },
    [],
  );

  const syncEmbedsBySource = useCallback(
    ({
      castLocalKey,
      source,
      candidates,
    }: {
      castLocalKey: number;
      source: string;
      candidates: CastComposerEmbed[];
    }) => {
      const ignoredUrls =
        urlsToIgnoreRef.current[castLocalKey] ?? new Set<string>();
      const filteredCandidates = candidates.filter(
        (candidate) =>
          !(
            (candidate.kind === 'url' || candidate.kind === 'snap') &&
            urlSnapEmbedMatchesAnyUrl({ embed: candidate, urls: ignoredUrls })
          ),
      );
      const currentEmbeds = canonicalEmbedsRef.current[castLocalKey] ?? [];
      const nextEmbeds = syncEmbedsBySourceForCast(
        currentEmbeds,
        source,
        filteredCandidates,
        maxEmbedsLength,
      );

      if (!isEqual(currentEmbeds, nextEmbeds)) {
        dispatchCanonicalEmbeds({
          type: 'syncSource',
          castLocalKey,
          source,
          candidates: filteredCandidates,
          maxEmbedsLength,
        });
      }

      setProcessedEmbeds((prev) => {
        const processedEmbedsForCast = prev[castLocalKey];
        if (!processedEmbedsForCast) {
          return prev;
        }
        const nextProcessedEmbeds = pruneProcessedUrlEmbedsToCanonicalUrls({
          processedEmbeds: processedEmbedsForCast,
          canonicalEmbeds: nextEmbeds,
        });
        if (isEqual(processedEmbedsForCast, nextProcessedEmbeds)) {
          return prev;
        }

        return {
          ...prev,
          [castLocalKey]: nextProcessedEmbeds,
        };
      });
    },
    [maxEmbedsLength],
  );

  const { getEmbedsToStoreForDraft, getEmbedsToSubmit } =
    useCastComposerSubmitEmbeds({ canonicalEmbeds });

  return {
    embeds,
    embedUrls,
    draftEmbedUrls,
    getCanAddMoreEmbeds,
    getRemainingEmbedsCount,
    getMediaEmbedUrls,
    getSnapEmbedUrls,
    getDraftEmbedUrls,
    processedEmbeds,
    setEmbedsFromDraftCast,
    setEmbedsFromAllDraftCasts,
    addImageEmbedViaUpload,
    addVideoEmbed,
    addMediaEmbed,
    removeImageEmbedByUrl,
    removeVideoEmbed,
    cancelActiveVideoUpload,
    removeUrlEmbed,
    imageAspectRatios,
    uploadingStatuses,
    uploadingErrors,
    detailedUploadingErrors,
    hasPendingMediaUploads,
    addEmbed,
    removeEmbed,
    syncEmbedsBySource,
    getEmbedsToSubmit,
    getEmbedsToStoreForDraft,
  };
};
