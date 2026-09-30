import { UnhandledFetchError } from '../../types/errors';
import { FarcasterApiClient } from '../FarcasterApiClient';

// Every request fails at the network layer so the thrown UnhandledFetchError
// exposes the timeout the request actually ran with (resolvedTimeout).
const buildFailingFetchMock = () =>
  jest.fn().mockRejectedValue(new TypeError('Network request failed'));

async function resolvedTimeoutOf(
  call: () => Promise<unknown>,
): Promise<number> {
  try {
    await call();
  } catch (e) {
    return (e as UnhandledFetchError).resolvedTimeout;
  }
  throw new Error('expected the request to fail');
}

describe('timeout retry decay', () => {
  it('does not decay explicit per-request timeouts on repeated calls (NEYN-13137)', async () => {
    const client = new FarcasterApiClient({
      getFetch: () => buildFailingFetchMock() as unknown as typeof fetch,
      timeoutRetryDecayFactor: 0.3,
    });

    // The decay key is url+params, and getFeedItems is a POST (params
    // undefined), so before the fix every one of these calls shared one
    // counter and the 4th ran with 5000 * 0.3 = 1500ms — unmeetable on the
    // slow connections the explicit P99-derived timeout was tuned for.
    const timeouts: number[] = [];
    for (let i = 0; i < 4; i++) {
      timeouts.push(
        await resolvedTimeoutOf(() =>
          client.getFeedItems(
            { feedKey: 'home' },
            { timeout: 5000, retryLimit: 0 },
          ),
        ),
      );
    }

    expect(timeouts).toEqual([5000, 5000, 5000, 5000]);
  });

  it('still decays the default timeout for repeated same-URL calls', async () => {
    const client = new FarcasterApiClient({
      getFetch: () => buildFailingFetchMock() as unknown as typeof fetch,
      timeoutRetryDecayFactor: 0.3,
    });

    // GET with no explicit timeout runs on the 20s default read timeout,
    // where the decay's load-shedding intent still applies:
    // 1.0, 0.7, 0.4, then the 0.3 floor.
    const timeouts: number[] = [];
    for (let i = 0; i < 4; i++) {
      timeouts.push(await resolvedTimeoutOf(() => client.getInvitesViewed()));
    }

    expect(timeouts).toEqual([20000, 14000, 8000, 6000]);
  });
});
