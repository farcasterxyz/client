import { trackError } from '~/utils/ErrorUtils';

type OptimisticEmbedResolutionMode = 'strict' | 'best-effort';

type OptimisticMediaAsset = {
  uploadPromise: Promise<string>;
};

type SettledMediaEmbedUrl =
  | { status: 'fulfilled'; value: string }
  | { status: 'rejected'; reason: unknown }
  | { status: 'timed-out' };

function getRejectedEmbedErrorMessage({
  rejectedPromise,
  fallback,
}: {
  rejectedPromise: Extract<
    SettledMediaEmbedUrl,
    { status: 'rejected' | 'timed-out' }
  >;
  fallback: string;
}): string {
  if (
    rejectedPromise.status === 'rejected' &&
    rejectedPromise.reason instanceof Error &&
    rejectedPromise.reason.message
  ) {
    return rejectedPromise.reason.message;
  }

  return fallback;
}

function shouldTrackRejectedEmbedError({
  rejectedPromise,
  fallback,
}: {
  rejectedPromise: Extract<
    SettledMediaEmbedUrl,
    { status: 'rejected' | 'timed-out' }
  >;
  fallback: string;
}): boolean {
  return (
    getRejectedEmbedErrorMessage({ rejectedPromise, fallback }) === fallback
  );
}

function waitForMediaEmbedUrl({
  uploadPromise,
  timeoutMs,
}: {
  uploadPromise: Promise<string>;
  timeoutMs: number | undefined;
}): Promise<SettledMediaEmbedUrl> {
  const settledPromise = uploadPromise.then(
    (value): SettledMediaEmbedUrl => ({ status: 'fulfilled', value }),
    (reason): SettledMediaEmbedUrl => ({ status: 'rejected', reason }),
  );

  if (typeof timeoutMs === 'undefined') {
    return settledPromise;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    settledPromise.finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }),
    new Promise<SettledMediaEmbedUrl>((resolve) => {
      timeoutId = setTimeout(() => resolve({ status: 'timed-out' }), timeoutMs);
    }),
  ]);
}

async function getSettledMediaEmbedUrls({
  media,
  errorMessage,
  mode,
  timeoutMs,
}: {
  media: OptimisticMediaAsset[];
  errorMessage: string;
  mode: OptimisticEmbedResolutionMode;
  timeoutMs?: number;
}): Promise<string[]> {
  const settledPromises = await Promise.all(
    media.map((o) =>
      waitForMediaEmbedUrl({ uploadPromise: o.uploadPromise, timeoutMs }),
    ),
  );

  const rejectedPromise = settledPromises.find(
    (promise) =>
      promise.status === 'rejected' || promise.status === 'timed-out',
  );
  if (rejectedPromise && mode === 'strict') {
    const rejectedEmbedErrorMessage = getRejectedEmbedErrorMessage({
      rejectedPromise,
      fallback: errorMessage,
    });

    if (
      shouldTrackRejectedEmbedError({ rejectedPromise, fallback: errorMessage })
    ) {
      trackError(JSON.stringify(rejectedPromise));
    }

    throw new Error(rejectedEmbedErrorMessage);
  }

  return settledPromises
    .filter((promise) => promise.status === 'fulfilled')
    .map((promise) => promise.value);
}

async function getDedupedEmbedsArrayFromOptimisticEmbeds({
  optimisticVideos,
  optimisticImages,
  urls,
  mode = 'strict',
  timeoutMs,
}: {
  optimisticVideos: OptimisticMediaAsset[];
  optimisticImages: OptimisticMediaAsset[];
  urls: string[];
  mode?: OptimisticEmbedResolutionMode;
  timeoutMs?: number;
}): Promise<{ dedupedEmbeds: string[] }> {
  const [videoEmbeds, imageEmbeds] = await Promise.all([
    getSettledMediaEmbedUrls({
      media: optimisticVideos,
      errorMessage: 'Failed to upload video.',
      mode,
      timeoutMs,
    }),
    getSettledMediaEmbedUrls({
      media: optimisticImages,
      errorMessage: 'Failed to upload image.',
      mode,
      timeoutMs,
    }),
  ]);

  const embeds = [...videoEmbeds, ...imageEmbeds, ...urls];

  // Deduplicate embeds to avoid duplicate URL and image references.
  const dedupedEmbeds = Array.from(new Set(embeds));

  return { dedupedEmbeds };
}

export { getDedupedEmbedsArrayFromOptimisticEmbeds };
