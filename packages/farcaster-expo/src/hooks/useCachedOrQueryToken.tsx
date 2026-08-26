import { type QueryClient, useQuery } from '@tanstack/react-query';
import {
  ApiChain,
  ApiGetToken200Response,
  ApiTokenLink,
} from 'farcaster-client-data';
import {
  buildGloballyCachedTokenKey,
  extendResult,
  useGlobalTokenPrice,
  useNonSuspenseToken,
} from 'farcaster-client-hooks';
import { UseQueryParameters } from 'farcaster-client-hooks/dist/hooks/data/queries/types';
import { useMemo } from 'react';

type UseCachedOrQueryTokenResult = Omit<
  ReturnType<typeof useNonSuspenseToken>,
  'data'
> & {
  data: ApiTokenLink | undefined;
};

function parsePositiveNumber(
  value?: string | number | null,
): number | undefined {
  if (value === null || typeof value === 'undefined') {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function deriveUsdValue({
  quantity,
  priceUsd,
}: {
  quantity?: string | number | null;
  priceUsd: number;
}): number | undefined {
  const parsedQuantity = parsePositiveNumber(quantity);
  if (!parsedQuantity) {
    return undefined;
  }

  const valueUsd = parsedQuantity * priceUsd;
  return Number.isFinite(valueUsd) && valueUsd > 0 ? valueUsd : undefined;
}

export const getTokenFromGlobalCache = (
  queryClient: QueryClient,
  chain: ApiChain,
  ca: string,
) => {
  const cachedToken = queryClient.getQueryData<ApiTokenLink>(
    buildGloballyCachedTokenKey({
      chain,
      ca,
    }),
  );
  return cachedToken;
};

export const useCachedOrQueryToken = ({
  chain,
  ca,
  query,
}: {
  chain: ApiChain;
  ca: string;
  query?: UseQueryParameters<ApiGetToken200Response['result']>;
}): UseCachedOrQueryTokenResult => {
  const result = useNonSuspenseToken({
    params: { chain, ca },
    query,
  });

  const tokenDataFromGlobalCache = useQuery<ApiTokenLink>({
    queryKey: buildGloballyCachedTokenKey({
      chain,
      ca,
    }),
    enabled: false,
  }).data;

  const price = useGlobalTokenPrice({ chain, ca });
  const token = useMemo(() => {
    const preferredToken = result.data?.token ?? tokenDataFromGlobalCache;

    if (preferredToken) {
      if (!price?.priceUsd) {
        return preferredToken;
      }

      const priceUsd = price.priceUsd;
      const derivedFdv = deriveUsdValue({
        quantity: preferredToken.totalSupply,
        priceUsd,
      });
      const derivedMarketCapFromCirculatingSupply = deriveUsdValue({
        quantity: preferredToken.circulatingSupply,
        priceUsd,
      });
      return {
        ...preferredToken,
        priceUsd: priceUsd.toString(),
        priceUpdatedAt: price.timestamp ?? preferredToken.priceUpdatedAt,
        marketCap:
          derivedMarketCapFromCirculatingSupply ?? preferredToken.marketCap,
        fdv: derivedFdv ?? preferredToken.fdv,
      };
    }

    return undefined;
  }, [
    result.data?.token,
    tokenDataFromGlobalCache,
    price?.priceUsd,
    price?.timestamp,
  ]);

  return extendResult(result, {
    data: token,
  });
};
