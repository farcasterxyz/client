import { FarcasterApiClient } from '../FarcasterApiClient';

const minimalCreateCastResponse = {
  result: {
    cast: {
      hash: '0xabc',
      text: 'hi',
      author: { fid: 1, username: 'test' },
    },
  },
};

describe('FarcasterApiClient.createCast', () => {
  const authOptions = {
    authToken: { secret: 'test-token', expiresAt: Date.now() + 60_000 },
  } as const;

  it('does not retry when retryLimit is 0', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));

    const client = new FarcasterApiClient({
      ...authOptions,
      getFetch: () => fetchMock as typeof fetch,
    });

    await expect(
      client.createCast({ text: 'hi' }, { retryLimit: 0 }),
    ).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries on transient errors when retryLimit uses the default', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));

    const client = new FarcasterApiClient({
      ...authOptions,
      getFetch: () => fetchMock as typeof fetch,
    });

    await expect(client.createCast({ text: 'hi' })).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('preserves a caller-provided Idempotency-Key header', async () => {
    const idempotencyKey = 'client-key-123';
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(minimalCreateCastResponse), {
        status: 201,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    );

    const client = new FarcasterApiClient({
      ...authOptions,
      getFetch: () => fetchMock as typeof fetch,
    });

    await client.createCast(
      { text: 'hi' },
      { headers: { 'Idempotency-Key': idempotencyKey }, retryLimit: 0 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe(idempotencyKey);
  });

  it('uses a fetcher provided by updateOptions', async () => {
    const initialFetchMock = jest.fn();
    const updatedFetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(minimalCreateCastResponse), {
        status: 201,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    );

    const client = new FarcasterApiClient({
      ...authOptions,
      getFetch: () => initialFetchMock as typeof fetch,
    });

    client.updateOptions({
      getFetch: () => updatedFetchMock as typeof fetch,
    });

    await client.createCast({ text: 'hi' }, { retryLimit: 0 });

    expect(initialFetchMock).not.toHaveBeenCalled();
    expect(updatedFetchMock).toHaveBeenCalledTimes(1);
  });
});
