import {
  type ApiGetKeyTransaction200Response,
  HandledFetchError,
} from 'farcaster-client-data';
import { describe, expect, it, vi } from 'vitest';

import { pollExternalUserSignerKeyTransaction } from '../useCreateExternalUserSigner';

const keyTransactionId = 'key-tx-1';

const buildHandledFetchError = (status: number): HandledFetchError =>
  new HandledFetchError('key transaction fetch failed', {
    status,
    responseData: { errors: [{ message: 'boom' }] },
    method: 'GET',
    relativeUrl: '/v2/key-transaction',
    isOffline: false,
    isNetworkError: false,
  } as never);

const buildKeyTransactionResponse = ({
  completedAt,
  failedAt,
}: {
  completedAt?: number;
  failedAt?: number;
}): ApiGetKeyTransaction200Response => ({
  result: {
    keyTransaction: {
      key: '0x1234',
      completedAt,
      failedAt,
    },
  },
});

describe('pollExternalUserSignerKeyTransaction', () => {
  it('retries a transient fetch failure until the key transaction completes', async () => {
    const fetchKeyTransaction = vi
      .fn<() => Promise<ApiGetKeyTransaction200Response>>()
      .mockRejectedValueOnce(new Error('temporary getKeyTransaction failure'))
      .mockResolvedValueOnce(
        buildKeyTransactionResponse({ completedAt: 1000 }),
      );
    const invalidateSigners = vi.fn();
    const invalidateUserAppContext = vi.fn();
    const delayFn = vi
      .fn<(ms: number) => Promise<void>>()
      .mockResolvedValue(undefined);

    await expect(
      pollExternalUserSignerKeyTransaction({
        keyTransactionId,
        fetchKeyTransaction,
        invalidateSigners,
        invalidateUserAppContext,
        maxAttempts: 3,
        pollIntervalMs: 50,
        delayFn,
      }),
    ).resolves.toEqual({ keyTransactionId });

    expect(fetchKeyTransaction).toHaveBeenCalledTimes(2);
    expect(delayFn).toHaveBeenCalledOnce();
    expect(delayFn).toHaveBeenCalledWith(50);
    expect(invalidateSigners).toHaveBeenCalledOnce();
    expect(invalidateUserAppContext).toHaveBeenCalledOnce();
  });

  it('times out instead of throwing the transient fetch error directly', async () => {
    const fetchKeyTransaction = vi
      .fn<() => Promise<ApiGetKeyTransaction200Response>>()
      .mockRejectedValue(new Error('temporary getKeyTransaction failure'));
    const invalidateSigners = vi.fn();
    const invalidateUserAppContext = vi.fn();
    const delayFn = vi
      .fn<(ms: number) => Promise<void>>()
      .mockResolvedValue(undefined);

    await expect(
      pollExternalUserSignerKeyTransaction({
        keyTransactionId,
        fetchKeyTransaction,
        invalidateSigners,
        invalidateUserAppContext,
        maxAttempts: 3,
        pollIntervalMs: 50,
        delayFn,
      }),
    ).rejects.toThrow(
      `External user signer key transaction timed out (keyTransactionId=${keyTransactionId})`,
    );

    expect(fetchKeyTransaction).toHaveBeenCalledTimes(3);
    expect(delayFn).toHaveBeenCalledTimes(3);
    expect(invalidateSigners).not.toHaveBeenCalled();
    expect(invalidateUserAppContext).not.toHaveBeenCalled();
  });

  it.each([401, 403])(
    'fails fast on a %i auth/permission error instead of polling until timeout',
    async (status) => {
      const authError = buildHandledFetchError(status);
      const fetchKeyTransaction = vi
        .fn<() => Promise<ApiGetKeyTransaction200Response>>()
        .mockRejectedValue(authError);
      const invalidateSigners = vi.fn();
      const invalidateUserAppContext = vi.fn();
      const delayFn = vi
        .fn<(ms: number) => Promise<void>>()
        .mockResolvedValue(undefined);

      await expect(
        pollExternalUserSignerKeyTransaction({
          keyTransactionId,
          fetchKeyTransaction,
          invalidateSigners,
          invalidateUserAppContext,
          maxAttempts: 3,
          pollIntervalMs: 50,
          delayFn,
        }),
      ).rejects.toBe(authError);

      // No polling loop, no delay — the caller gets the failure immediately.
      expect(fetchKeyTransaction).toHaveBeenCalledOnce();
      expect(delayFn).not.toHaveBeenCalled();
      expect(invalidateSigners).not.toHaveBeenCalled();
      expect(invalidateUserAppContext).not.toHaveBeenCalled();
    },
  );

  it('keeps polling a non-auth fetch error (503) until timeout', async () => {
    const fetchKeyTransaction = vi
      .fn<() => Promise<ApiGetKeyTransaction200Response>>()
      .mockRejectedValue(buildHandledFetchError(503));
    const invalidateSigners = vi.fn();
    const invalidateUserAppContext = vi.fn();
    const delayFn = vi
      .fn<(ms: number) => Promise<void>>()
      .mockResolvedValue(undefined);

    await expect(
      pollExternalUserSignerKeyTransaction({
        keyTransactionId,
        fetchKeyTransaction,
        invalidateSigners,
        invalidateUserAppContext,
        maxAttempts: 3,
        pollIntervalMs: 50,
        delayFn,
      }),
    ).rejects.toThrow(
      `External user signer key transaction timed out (keyTransactionId=${keyTransactionId})`,
    );

    expect(fetchKeyTransaction).toHaveBeenCalledTimes(3);
    expect(delayFn).toHaveBeenCalledTimes(3);
  });

  it('throws immediately when the key transaction fails', async () => {
    const fetchKeyTransaction = vi
      .fn<() => Promise<ApiGetKeyTransaction200Response>>()
      .mockResolvedValueOnce(buildKeyTransactionResponse({ failedAt: 1000 }));
    const invalidateSigners = vi.fn();
    const invalidateUserAppContext = vi.fn();
    const delayFn = vi
      .fn<(ms: number) => Promise<void>>()
      .mockResolvedValue(undefined);

    await expect(
      pollExternalUserSignerKeyTransaction({
        keyTransactionId,
        fetchKeyTransaction,
        invalidateSigners,
        invalidateUserAppContext,
        maxAttempts: 3,
        pollIntervalMs: 50,
        delayFn,
      }),
    ).rejects.toThrow(
      `External user signer key transaction failed (keyTransactionId=${keyTransactionId})`,
    );

    expect(fetchKeyTransaction).toHaveBeenCalledOnce();
    expect(delayFn).not.toHaveBeenCalled();
    expect(invalidateSigners).toHaveBeenCalledOnce();
    expect(invalidateUserAppContext).toHaveBeenCalledOnce();
  });
});
