import { FarcasterApiClient } from '../FarcasterApiClient';

const minimalResponse = { result: {} };

const buildFetchMock = () =>
  jest.fn().mockResolvedValue(
    new Response(JSON.stringify(minimalResponse), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    }),
  );

const getSentHeaders = (fetchMock: jest.Mock): Record<string, string> => {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return init.headers as Record<string, string>;
};

describe('FarcasterApiClient meta-derived default headers', () => {
  it('sends FC-DEVICE-ID from meta provided at construction', async () => {
    const fetchMock = buildFetchMock();

    const client = new FarcasterApiClient({
      getFetch: () => fetchMock as typeof fetch,
      meta: { deviceId: 'device-123' },
    });

    await client.getFeedItems({ feedKey: 'home' });

    expect(getSentHeaders(fetchMock)['FC-DEVICE-ID']).toBe('device-123');
  });

  it('refreshes FC-DEVICE-ID when meta is supplied via updateOptions', async () => {
    const fetchMock = buildFetchMock();

    // Constructed without meta, mirroring the module-level web apiClient.
    const client = new FarcasterApiClient({
      getFetch: () => fetchMock as typeof fetch,
    });

    // Provider supplies deviceId after construction, as the real
    // FarcasterApiClientProvider does in a useEffect.
    client.updateOptions({ meta: { deviceId: 'device-456' } });

    await client.getFeedItems({ feedKey: 'home' });

    expect(getSentHeaders(fetchMock)['FC-DEVICE-ID']).toBe('device-456');
  });

  it('does not clobber existing headers when updateOptions omits meta', async () => {
    const fetchMock = buildFetchMock();

    const client = new FarcasterApiClient({
      getFetch: () => fetchMock as typeof fetch,
      meta: { deviceId: 'device-789' },
    });

    // An unrelated update (no meta) must preserve the existing FC-DEVICE-ID.
    client.updateOptions({ debug: false });

    await client.getFeedItems({ feedKey: 'home' });

    expect(getSentHeaders(fetchMock)['FC-DEVICE-ID']).toBe('device-789');
  });

  it('updates additional meta headers on updateOptions', async () => {
    const fetchMock = buildFetchMock();

    const client = new FarcasterApiClient({
      getFetch: () => fetchMock as typeof fetch,
    });

    client.updateOptions({
      meta: { deviceId: 'device-abc', fid: 42, deviceOs: 'ios' },
    });

    await client.getFeedItems({ feedKey: 'home' });

    const headers = getSentHeaders(fetchMock);
    expect(headers['FC-DEVICE-ID']).toBe('device-abc');
    expect(headers['FC-FID']).toBe('42');
    expect(headers['FC-DEVICE-OS']).toBe('ios');
  });

  it('merges partial meta updates instead of replacing existing meta', async () => {
    const fetchMock = buildFetchMock();

    const client = new FarcasterApiClient({
      getFetch: () => fetchMock as typeof fetch,
      meta: { deviceId: 'device-keep', deviceOs: 'ios' },
    });

    // The real-world regression: AuthTokenProvider (mobile) updates
    // `{ meta: { address, fid } }` at login and useOnboardingState (web)
    // updates `{ meta: { fid } }` — neither must wipe deviceId/deviceOs from
    // the derived headers, or the backend's one-token-per-device dedup
    // silently loses coverage.
    client.updateOptions({ meta: { fid: 42 } });

    await client.getFeedItems({ feedKey: 'home' });

    const headers = getSentHeaders(fetchMock);
    expect(headers['FC-DEVICE-ID']).toBe('device-keep');
    expect(headers['FC-DEVICE-OS']).toBe('ios');
    expect(headers['FC-FID']).toBe('42');
  });

  it('clears a meta field when it is passed explicitly as undefined', async () => {
    const fetchMock = buildFetchMock();

    const client = new FarcasterApiClient({
      getFetch: () => fetchMock as typeof fetch,
      meta: { deviceId: 'device-gone', fid: 42 },
    });

    client.updateOptions({ meta: { deviceId: undefined } });

    await client.getFeedItems({ feedKey: 'home' });

    const headers = getSentHeaders(fetchMock);
    expect(headers['FC-DEVICE-ID']).toBeUndefined();
    // Fields not mentioned in the partial update are preserved.
    expect(headers['FC-FID']).toBe('42');
  });
});
