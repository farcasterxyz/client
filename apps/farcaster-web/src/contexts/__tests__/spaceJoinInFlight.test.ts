import { describe, expect, test, vi } from 'vitest';

import {
  type InFlightJoinRef,
  runDedupedJoin,
} from '~/contexts/spaceJoinInFlight';

function createRef(): InFlightJoinRef {
  return { current: null };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('runDedupedJoin (farcaster-web)', () => {
  test('shares one in-flight join between concurrent calls for the same room', async () => {
    const ref = createRef();
    const first = deferred<boolean>();
    const start = vi.fn().mockReturnValue(first.promise);

    const a = runDedupedJoin({ ref, roomId: 'room-1', generation: 0, start });
    const b = runDedupedJoin({ ref, roomId: 'room-1', generation: 0, start });

    expect(start).toHaveBeenCalledTimes(1);
    expect(ref.current?.roomId).toBe('room-1');

    first.resolve(true);
    await expect(a).resolves.toBe(true);
    await expect(b).resolves.toBe(true);
    expect(ref.current).toBeNull();
  });

  test('starts a separate join for a different room', async () => {
    const ref = createRef();
    const first = deferred<boolean>();
    const start = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(true);

    const a = runDedupedJoin({ ref, roomId: 'room-1', generation: 0, start });
    const b = runDedupedJoin({ ref, roomId: 'room-2', generation: 0, start });

    expect(start).toHaveBeenCalledTimes(2);
    expect(ref.current?.roomId).toBe('room-2');

    await expect(b).resolves.toBe(true);
    expect(ref.current).toBeNull();

    first.resolve(false);
    await expect(a).resolves.toBe(false);
    expect(ref.current).toBeNull();
  });

  test('clears the slot after a failed join and lets a later call start fresh', async () => {
    const ref = createRef();
    const error = new Error('connect failed');
    const start = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(true);

    await expect(
      runDedupedJoin({ ref, roomId: 'room-1', generation: 0, start }),
    ).rejects.toBe(error);
    expect(ref.current).toBeNull();

    await expect(
      runDedupedJoin({ ref, roomId: 'room-1', generation: 0, start }),
    ).resolves.toBe(true);
    expect(start).toHaveBeenCalledTimes(2);
  });

  test('starts a new join once the previous one for the room has settled', async () => {
    const ref = createRef();
    const start = vi.fn().mockResolvedValue(true);

    await runDedupedJoin({ ref, roomId: 'room-1', generation: 0, start });
    await runDedupedJoin({ ref, roomId: 'room-1', generation: 0, start });

    expect(start).toHaveBeenCalledTimes(2);
  });

  test('starts a new join when the join generation was invalidated meanwhile', async () => {
    const ref = createRef();
    const first = deferred<boolean>();
    const start = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(true);

    const canceled = runDedupedJoin({
      ref,
      roomId: 'room-1',
      generation: 0,
      start,
    });
    // leave() bumps the generation; the pending attempt will resolve false.
    const fresh = runDedupedJoin({
      ref,
      roomId: 'room-1',
      generation: 1,
      start,
    });

    expect(start).toHaveBeenCalledTimes(2);
    expect(ref.current?.generation).toBe(1);

    first.resolve(false);
    await expect(canceled).resolves.toBe(false);
    await expect(fresh).resolves.toBe(true);
    expect(ref.current).toBeNull();
  });
});
