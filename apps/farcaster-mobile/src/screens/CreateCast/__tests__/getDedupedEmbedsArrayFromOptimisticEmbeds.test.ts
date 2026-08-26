import { trackError } from '~/utils/ErrorUtils';

import { getDedupedEmbedsArrayFromOptimisticEmbeds } from '../getDedupedEmbedsArrayFromOptimisticEmbeds';

jest.mock('~/utils/ErrorUtils', () => ({
  trackError: jest.fn(),
}));

const media = (uploadPromise: Promise<string>) => ({ uploadPromise });

describe('getDedupedEmbedsArrayFromOptimisticEmbeds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('keeps publish strict by throwing the upload error message when a media upload fails', async () => {
    await expect(
      getDedupedEmbedsArrayFromOptimisticEmbeds({
        optimisticVideos: [],
        optimisticImages: [media(Promise.reject(new Error('upload failed')))],
        urls: ['https://example.com/card'],
        mode: 'strict',
      }),
    ).rejects.toThrow('upload failed');

    expect(trackError).not.toHaveBeenCalled();
  });

  it('falls back to a generic upload error when a media upload rejects without a message', async () => {
    await expect(
      getDedupedEmbedsArrayFromOptimisticEmbeds({
        optimisticVideos: [],
        optimisticImages: [media(Promise.reject('upload failed'))],
        urls: ['https://example.com/card'],
        mode: 'strict',
      }),
    ).rejects.toThrow('Failed to upload image.');

    expect(trackError).toHaveBeenCalledTimes(1);
  });

  it('omits failed uploads in best-effort draft mode', async () => {
    const result = await getDedupedEmbedsArrayFromOptimisticEmbeds({
      optimisticVideos: [
        media(Promise.resolve('https://cdn.example/video.mp4')),
      ],
      optimisticImages: [
        media(Promise.resolve('https://cdn.example/image.png')),
        media(Promise.reject(new Error('upload failed'))),
      ],
      urls: ['https://example.com/card', 'https://cdn.example/image.png'],
      mode: 'best-effort',
    });

    expect(result.dedupedEmbeds).toEqual([
      'https://cdn.example/video.mp4',
      'https://cdn.example/image.png',
      'https://example.com/card',
    ]);
    expect(trackError).not.toHaveBeenCalled();
  });

  it('omits uploads that do not settle before the draft timeout', async () => {
    jest.useFakeTimers();

    const neverSettles = new Promise<string>(() => {});
    const promise = getDedupedEmbedsArrayFromOptimisticEmbeds({
      optimisticVideos: [media(neverSettles)],
      optimisticImages: [
        media(Promise.resolve('https://cdn.example/image.png')),
      ],
      urls: ['https://example.com/card'],
      mode: 'best-effort',
      timeoutMs: 10_000,
    });

    await jest.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toEqual({
      dedupedEmbeds: [
        'https://cdn.example/image.png',
        'https://example.com/card',
      ],
    });
  });
});
