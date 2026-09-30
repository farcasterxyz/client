import { ApiVideo } from 'farcaster-client-data';

/**
 * How long we keep polling `getVideoState` after the upload transport
 * completes before giving up and surfacing an error to the user. Processing is
 * normally well under a minute, but large videos and Cloudflare retries can
 * push it much longer, so this is deliberately generous.
 *
 * The direct cast path (`pollVideoUntilReady` in farcaster-mobile) uses the
 * same bound, but do not treat it as a reference implementation: it throws its
 * `video-processing-failed` inside the same `try` whose `catch` swallows
 * everything as a network hiccup, so a failed video spins there for the full
 * twenty minutes instead of erroring, and it handles none of `abandoned`,
 * `deleted` or `hidden`.
 */
export const VIDEO_PROCESSING_TIMEOUT_MS = 20 * 60 * 1000;

/**
 * If the upload reports no progress for this long we treat it as stalled and
 * abort, rather than leaving the composer spinning forever.
 *
 * This has to clear the transport's own retry budget, otherwise it would kill
 * uploads that are merely retrying: `retryDelays` sums to 38s of pure waiting
 * on top of however long each of the five attempts takes to fail, which on a
 * bad connection can run well past two minutes. Progress events do not fire
 * during that window, so the timer cannot tell retrying apart from dead.
 * Five minutes leaves room for the full retry cycle while still bounding the
 * hang this exists to prevent.
 */
export const VIDEO_UPLOAD_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export const VIDEO_PROCESSING_TIMEOUT_MESSAGE =
  'Video is taking too long to process, please try again';

export const VIDEO_PROCESSING_FAILED_MESSAGE =
  'Error processing video, please make sure it is valid';

export const VIDEO_UPLOAD_STALLED_MESSAGE =
  'Video upload stalled, please try again';

export const VIDEO_UNAVAILABLE_MESSAGE = 'This video is not available';

const VIDEO_POLL_BASE_DELAY_MS = 1000;
const VIDEO_POLL_MAX_DELAY_MS = 5000;

/**
 * How long we keep polling once a second before backing off. Typical
 * processing lands well inside this window, so the common case pays no added
 * latency at all -- which matters, because this is the moment the user is
 * staring at a spinner waiting to post.
 */
const VIDEO_POLL_FAST_WINDOW_ATTEMPTS = 60;

/**
 * Poll once a second through the window that covers most videos, then back off
 * to a five second ceiling for the long tail.
 *
 * The ceiling is matched to the server's own throttle: it only re-checks
 * upstream once every five seconds, so polling faster than that on the tail
 * mostly re-reads cached state, while polling slower than it would add latency
 * for nothing. Worst case this is ~285 requests across the full processing
 * timeout instead of ~1200 at a flat one second.
 */
export const getVideoPollDelayMs = (attempt: number) => {
  if (attempt <= VIDEO_POLL_FAST_WINDOW_ATTEMPTS) {
    return VIDEO_POLL_BASE_DELAY_MS;
  }

  const attemptsPastWindow = attempt - VIDEO_POLL_FAST_WINDOW_ATTEMPTS;

  return Math.min(
    VIDEO_POLL_MAX_DELAY_MS,
    VIDEO_POLL_BASE_DELAY_MS * (attemptsPastWindow + 1),
  );
};

export type VideoPollDecision =
  | { type: 'ready' }
  | { type: 'failed'; message: string }
  | { type: 'keepPolling'; status: string };

/**
 * Decides what to do with a `getVideoState` response.
 *
 * The property that matters is that every state which is not a terminal
 * outcome keeps the poll alive.
 *
 * `pending` in particular is what the API reports for the first moments after
 * the upload transport completes -- which is exactly when the first poll lands.
 * Previously that state matched no branch, so the poll loop returned without
 * rescheduling itself and never ran again: the video went on to process
 * successfully server-side while the composer sat on "Processing..." forever
 * with the cast button disabled. Roughly one in five video uploads was lost
 * this way, with no error surfaced anywhere.
 */
export const decideVideoPollAction = (video: ApiVideo): VideoPollDecision => {
  switch (video.state) {
    // `active` means the video is already attached to a published cast, so it
    // should not occur while composing. It is grouped with `ready` because if
    // it ever does occur the video is unambiguously processed and usable --
    // treating it as unknown would leave the composer waiting on a state that
    // will never advance.
    case 'ready':
    case 'active':
      // Dimensions arrive alongside the `ready` transition. Until we have them
      // the embed is not usable, so keep waiting rather than committing it.
      return video.embed.width && video.embed.height
        ? { type: 'ready' }
        : { type: 'keepPolling', status: 'Processing...' };

    case 'failed':
    case 'abandoned':
    case 'deleted':
      return {
        type: 'failed',
        message: video.errorMessage ?? VIDEO_PROCESSING_FAILED_MESSAGE,
      };

    // Moderation, not a processing problem -- telling the user to check that
    // the file is a valid video would send them chasing the wrong thing.
    case 'hidden':
      return {
        type: 'failed',
        message: video.errorMessage ?? VIDEO_UNAVAILABLE_MESSAGE,
      };

    case 'pending':
    case 'processing':
      return { type: 'keepPolling', status: 'Processing...' };

    // Compile-time exhaustiveness only protects the build being compiled.
    // Shipped clients live in the wild for months, so a state added to the API
    // later would otherwise fall out of this function as `undefined` and throw
    // on `decision.type` -- reviving the exact silent hang this module exists
    // to remove. The `never` assignment keeps the compile error for whoever
    // adds that state here; keeping the poll alive keeps already-shipped
    // builds working, and the processing timeout still bounds it.
    default: {
      const unhandledState: never = video.state;
      void unhandledState;

      return { type: 'keepPolling', status: 'Processing...' };
    }
  }
};
