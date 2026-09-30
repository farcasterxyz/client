/**
 * Fetches token price from CoinGecko's simple price API.
 * Used for tokens that need correct price overrides (e.g., HYPE on HyperEVM).
 */
const COINGECKO_SIMPLE_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price';
const COINGECKO_PRICE_TIMEOUT_MS = 3000;
const COINGECKO_PRICE_CACHE_TTL_MS = 60_000;

const priceCache = new Map<string, { price: number; fetchedAt: number }>();
const pendingPriceRequests = new Map<string, Promise<number | undefined>>();

export async function fetchTokenPriceFromCoingecko(
  coingeckoId: string,
): Promise<number | undefined> {
  const cached = priceCache.get(coingeckoId);
  if (cached && Date.now() - cached.fetchedAt < COINGECKO_PRICE_CACHE_TTL_MS) {
    return cached.price;
  }

  const pendingRequest = pendingPriceRequests.get(coingeckoId);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = fetchTokenPriceFromCoingeckoUncached(coingeckoId).finally(
    () => {
      pendingPriceRequests.delete(coingeckoId);
    },
  );
  pendingPriceRequests.set(coingeckoId, request);
  return request;
}

async function fetchTokenPriceFromCoingeckoUncached(
  coingeckoId: string,
): Promise<number | undefined> {
  try {
    const url = `${COINGECKO_SIMPLE_PRICE_URL}?ids=${encodeURIComponent(coingeckoId)}&vs_currencies=usd`;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      COINGECKO_PRICE_TIMEOUT_MS,
    );
    const response = await fetch(url, { signal: controller.signal }).finally(
      () => {
        clearTimeout(timeout);
      },
    );
    if (!response.ok) {
      return undefined;
    }
    const data = (await response.json()) as Record<
      string,
      { usd?: number } | undefined
    >;
    const price = data[coingeckoId]?.usd;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      return undefined;
    }
    priceCache.set(coingeckoId, { price, fetchedAt: Date.now() });
    return price;
  } catch {
    return undefined;
  }
}

export function clearTokenPriceFromCoingeckoCacheForTests() {
  priceCache.clear();
  pendingPriceRequests.clear();
}
