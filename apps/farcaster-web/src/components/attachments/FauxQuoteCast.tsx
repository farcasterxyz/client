import { ApiOpenGraphMetadata, CastHashPrefix } from 'farcaster-client-data';
import { usePrefetchUserThreadCasts } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useMemo } from 'react';
import { matchPath } from 'react-router-dom';

import { Image } from '~/components/images/Image';
import { LinkToConversationWithUsername } from '~/components/links/LinkToConversationWithUsername';
import { routes } from '~/constants/routes';
import { getOpenGraphFallbackImageUrl } from '~/utils/openGraphUtils';

interface FauxQuoteCastProps {
  og: ApiOpenGraphMetadata;
}

const FauxQuoteCast: FC<FauxQuoteCastProps> = memo(({ og }) => {
  const prefetchUserThreadCasts = usePrefetchUserThreadCasts();

  const params = useMemo(() => {
    const matched = matchPath(
      routes.conversationWithUsername.path,
      new URL(og.url).pathname,
    );

    if (
      !matched ||
      !matched.params.castHashPrefix ||
      !matched.params.username
    ) {
      return undefined;
    }

    return matched.params as {
      username: string;
      castHashPrefix: CastHashPrefix;
    };
  }, [og.url]);

  const optimisticallyPrefetchQuoteCast = useCallback(() => {
    if (typeof params === 'undefined') {
      return;
    }

    prefetchUserThreadCasts({
      castHashPrefix: params.castHashPrefix,
      username: params.username,
      shouldAvoidUpdatingGlobalCache: true,
    });
  }, [params, prefetchUserThreadCasts]);

  return (
    <div
      className="flex w-full flex-col rounded-lg border p-3 pt-2 border-faint"
      onMouseOver={optimisticallyPrefetchQuoteCast}
    >
      {typeof params !== 'undefined' && (
        <LinkToConversationWithUsername
          className="absolute inset-0"
          params={params}
          title={og.title!}
        />
      )}
      <div className="flex flex-row items-center">
        <Image
          alt="og"
          className="mr-1 size-5 rounded-md"
          src={getOpenGraphFallbackImageUrl({
            assetName: 'Farcaster',
            assetExtension: 'webp',
          })}
        />
        <div className="max-w-sm truncate text-sm">
          {og.title?.indexOf('Farcaster') !== -1
            ? og.title?.split('on Farcaster')[0]
            : og.title?.split('on Warpcast')[0]}
        </div>
      </div>
      <div className="mt-1 text-sm break-gracefully text-faint">
        {og.description}
      </div>
    </div>
  );
});

FauxQuoteCast.displayName = 'FauxQuoteCast';

export { FauxQuoteCast };
