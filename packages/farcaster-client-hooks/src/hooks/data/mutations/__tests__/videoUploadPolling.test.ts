import type { ApiVideo, ApiVideoState } from 'farcaster-client-data';
import { describe, expect, it } from 'vitest';

import {
  decideVideoPollAction,
  getVideoPollDelayMs,
  VIDEO_PROCESSING_FAILED_MESSAGE,
  VIDEO_UNAVAILABLE_MESSAGE,
} from '../videoUploadPolling';

const buildVideo = ({
  state,
  width = 1080,
  height = 1920,
  errorMessage,
}: {
  state: ApiVideoState;
  width?: number | undefined;
  height?: number | undefined;
  errorMessage?: string;
}): ApiVideo => ({
  id: 'video-id',
  state,
  errorMessage,
  embed: {
    type: 'video',
    url: 'https://stream.farcaster.xyz/v1/video/video-id.m3u8',
    sourceUrl: 'https://stream.farcaster.xyz/v1/video/video-id.m3u8',
    width,
    height,
  },
});

describe('decideVideoPollAction', () => {
  it('commits the embed once the video is ready with dimensions', () => {
    expect(decideVideoPollAction(buildVideo({ state: 'ready' }))).toEqual({
      type: 'ready',
    });
  });

  // This is the regression that stranded roughly one in five video uploads:
  // `pending` is what the API returns for the first moments after the upload
  // transport completes, which is exactly when the first poll lands.
  it('keeps polling while the video is still pending', () => {
    expect(decideVideoPollAction(buildVideo({ state: 'pending' }))).toEqual({
      type: 'keepPolling',
      status: 'Processing...',
    });
  });

  it('keeps polling while the video is processing', () => {
    expect(decideVideoPollAction(buildVideo({ state: 'processing' }))).toEqual({
      type: 'keepPolling',
      status: 'Processing...',
    });
  });

  it.each([
    ['width', { width: undefined }],
    ['height', { height: undefined }],
    ['both dimensions', { width: 0, height: 0 }],
  ])('keeps polling when ready but missing %s', (_label, dimensions) => {
    const video = buildVideo({ state: 'ready' });

    expect(
      decideVideoPollAction({
        ...video,
        embed: { ...video.embed, ...dimensions },
      }),
    ).toEqual({ type: 'keepPolling', status: 'Processing...' });
  });

  it.each<ApiVideoState>(['failed', 'abandoned', 'deleted'])(
    'surfaces a failure for terminal state %s',
    (state) => {
      expect(decideVideoPollAction(buildVideo({ state }))).toEqual({
        type: 'failed',
        message: VIDEO_PROCESSING_FAILED_MESSAGE,
      });
    },
  );

  it('does not blame the file when the video was hidden by moderation', () => {
    expect(decideVideoPollAction(buildVideo({ state: 'hidden' }))).toEqual({
      type: 'failed',
      message: VIDEO_UNAVAILABLE_MESSAGE,
    });
  });

  it('prefers the server error message when one is provided', () => {
    expect(
      decideVideoPollAction(
        buildVideo({
          state: 'failed',
          errorMessage: 'Uploaded file is not a video',
        }),
      ),
    ).toEqual({ type: 'failed', message: 'Uploaded file is not a video' });
  });

  it('never returns a decision that silently ends the poll loop', () => {
    const allStates: ApiVideoState[] = [
      'pending',
      'processing',
      'ready',
      'active',
      'hidden',
      'failed',
      'abandoned',
      'deleted',
    ];

    for (const state of allStates) {
      const decision = decideVideoPollAction(buildVideo({ state }));
      expect(['ready', 'failed', 'keepPolling']).toContain(decision.type);
    }
  });

  // Compile-time exhaustiveness only covers the build being compiled. A client
  // already shipped to a phone will happily receive a state added to the API
  // months later, and returning `undefined` there would throw on
  // `decision.type` and kill the poll loop -- exactly the hang this module
  // removes. The cast is the point of the test: it simulates a future API.
  it('keeps polling on a state this build has never heard of', () => {
    const futureState = 'transcoding' as ApiVideoState;

    const decision = decideVideoPollAction(buildVideo({ state: futureState }));

    expect(decision).toEqual({ type: 'keepPolling', status: 'Processing...' });
  });
});

describe('getVideoPollDelayMs', () => {
  it('polls once a second through the first minute', () => {
    expect(getVideoPollDelayMs(1)).toBe(1000);
    expect(getVideoPollDelayMs(30)).toBe(1000);
    expect(getVideoPollDelayMs(60)).toBe(1000);
  });

  it('backs off past the fast window and caps at the server throttle', () => {
    expect(getVideoPollDelayMs(61)).toBe(2000);
    expect(getVideoPollDelayMs(63)).toBe(4000);
    expect(getVideoPollDelayMs(64)).toBe(5000);
    expect(getVideoPollDelayMs(1000)).toBe(5000);
  });

  it('never returns a zero or negative delay', () => {
    expect(getVideoPollDelayMs(0)).toBe(1000);
    expect(getVideoPollDelayMs(-5)).toBe(1000);
  });

  // The whole point of the fast window is that a normal video costs the user
  // nothing versus the previous flat one-second poll.
  it('adds no latency for a video that processes within the fast window', () => {
    let elapsedMs = 0;
    let attempt = 0;

    while (elapsedMs < 45_000) {
      attempt += 1;
      elapsedMs += getVideoPollDelayMs(attempt);
    }

    expect(elapsedMs).toBeLessThanOrEqual(46_000);
  });
});
