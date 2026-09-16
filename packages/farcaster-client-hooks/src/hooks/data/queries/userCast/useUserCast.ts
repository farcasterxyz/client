import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  ApiCast,
  ApiQuoteCastEmbed,
  CastHashPrefix,
  getCastHashPrefix,
} from 'farcaster-client-data';
import { useMemo } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  useGloballyCachedCastWithoutFallback,
  useMergeIntoGloballyCachedCast,
} from '../globallyCachedCast';
import { buildUserCastFetcher } from './buildUserCastFetcher';
import { buildUserCastKey } from './buildUserCastKey';

const useUserCast = ({
  username,
  hashPrefix,
}: {
  username: string;
  hashPrefix: CastHashPrefix;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();

  return useSuspenseQuery({
    queryKey: buildUserCastKey({ username, hashPrefix }),

    queryFn: buildUserCastFetcher({
      apiClient,
      hashPrefix,
      mergeIntoGloballyCachedCast,
      username,
    }),
  });
};

const useNonSuspenseUserCast = ({
  username,
  hashPrefix,
  enabled = true,
}: {
  username: string | undefined;
  hashPrefix: CastHashPrefix | undefined;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();

  return useQuery({
    queryKey: buildUserCastKey({ username, hashPrefix }),
    queryFn: buildUserCastFetcher({
      apiClient,
      hashPrefix: hashPrefix!,
      mergeIntoGloballyCachedCast,
      username: username!,
    }),
    enabled: enabled && !!username && !!hashPrefix,
  });
};

type HydratedQuoteCast = ApiCast | ApiQuoteCastEmbed;

const SPACE_URL_RE =
  /^https?:\/\/(?:www\.)?(?:warpcast\.com|farcaster\.xyz)\/~\/spaces\/[\w-]+\/?(?:\?[^#\s]*)?(?:#[^\s]*)?$/;

const quoteCastHasContent = (cast: HydratedQuoteCast | undefined) => {
  if (!cast) {
    return false;
  }

  if (cast.text.length > 0) {
    return true;
  }

  return Object.values(cast.embeds ?? {}).some(
    (embedBucket) => Array.isArray(embedBucket) && embedBucket.length > 0,
  );
};

const getSpaceUrlEmbeds = (cast: HydratedQuoteCast | undefined) =>
  cast?.embeds?.urls?.filter(({ openGraph }) =>
    SPACE_URL_RE.test(openGraph.url),
  ) ?? [];

const mergeSpaceUrlEmbeds = ({
  cast,
  sourceCast,
}: {
  cast: ApiQuoteCastEmbed;
  sourceCast: HydratedQuoteCast | undefined;
}) => {
  if (cast.deleted) {
    return cast;
  }

  const existingUrls = new Set(
    cast.embeds?.urls?.map(({ openGraph }) => openGraph.url) ?? [],
  );
  const missingSpaceUrlEmbeds = getSpaceUrlEmbeds(sourceCast).filter(
    ({ openGraph }) => !existingUrls.has(openGraph.url),
  );

  if (missingSpaceUrlEmbeds.length === 0) {
    return cast;
  }

  return {
    ...cast,
    embeds: {
      ...cast.embeds,
      urls: [...(cast.embeds?.urls ?? []), ...missingSpaceUrlEmbeds],
    },
  };
};

const useHydratedQuoteCast = ({ cast }: { cast: ApiQuoteCastEmbed }) => {
  const cachedCast = useGloballyCachedCastWithoutFallback({
    hash: cast.hash,
    recast: false,
  });

  const needsHydration =
    !cast.deleted &&
    !quoteCastHasContent(cast) &&
    !quoteCastHasContent(cachedCast);
  const hashPrefix = getCastHashPrefix({ castHash: cast.hash });

  const { data } = useNonSuspenseUserCast({
    username: cast.author.username,
    hashPrefix,
    enabled: needsHydration,
  });

  const fetchedCast = data?.result.cast;
  const sourceCast =
    getSpaceUrlEmbeds(cachedCast).length > 0
      ? cachedCast
      : getSpaceUrlEmbeds(fetchedCast).length > 0
        ? fetchedCast
        : undefined;

  return useMemo(
    () => mergeSpaceUrlEmbeds({ cast, sourceCast }),
    [cast, sourceCast],
  );
};

export { useHydratedQuoteCast, useUserCast };
