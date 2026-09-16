import {
  ApiClankerToken,
  ApiGetClankerToken200Response,
  ApiGetClankerTokenQueryParams,
} from './types';

// Calls the ssr proxy at apps/farcaster-ssr/src/pages/api/clanker/token.ts
// directly rather than routing through FarcasterApiClient. The backend schema
// has no clanker endpoint, so plumbing this through the api client forced a
// hand-stubbed method that `make sync-api` kept wiping out. See types.ts for
// the full story.
const buildClankerTokenFetcher =
  ({ params }: { params: ApiGetClankerTokenQueryParams }) =>
  async (): Promise<ApiClankerToken> => {
    const search = new URLSearchParams({ ca: params.ca });
    const res = await fetch(`/api/clanker/token?${search.toString()}`);
    if (!res.ok) {
      throw new Error(`Clanker token fetch failed: ${res.status}`);
    }
    const body = (await res.json()) as ApiGetClankerToken200Response;
    return body.result;
  };

export { buildClankerTokenFetcher };
