import { PersonIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  usePrefetchFeedItems,
} from 'farcaster-client-hooks';
import React from 'react';
import { matchPath } from 'react-router-dom';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
import { LinkToChannel } from '~/components/links/LinkToChannel';
import { routes } from '~/constants/routes';

type ChannelAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
  variant: 'default' | 'direct-cast';
};

const ChannelAttachment: React.FC<ChannelAttachmentProps> = ({
  og,
  disabled,
  variant,
}) => {
  const prefetchFeedItems = usePrefetchFeedItems();

  const onNullFeedItemsResponse = React.useCallback(() => {
    // FIXME: Fill this out if we notice issues on web clients similar to Web
  }, []);

  const params = React.useMemo(() => {
    const matched = matchPath(routes.channel.path, new URL(og.url).pathname);

    if (!matched || !matched.params.channelKey) {
      return undefined;
    }

    return matched.params as {
      channelKey: string;
    };
  }, [og.url]);

  const optimisticallyPrefetchChannelFeed = React.useCallback(() => {
    if (typeof params === 'undefined') {
      return;
    }

    prefetchFeedItems({
      feedKey: params.channelKey,
      feedType: 'default',
      updateState: false,
      onNullFeedItemsResponse: onNullFeedItemsResponse,
    });
  }, [params, prefetchFeedItems, onNullFeedItemsResponse]);

  return (
    <div
      className="relative flex w-full flex-row items-center rounded-lg"
      onMouseOver={optimisticallyPrefetchChannelFeed}
    >
      {typeof params !== 'undefined' && !disabled && (
        <LinkToChannel
          className="absolute inset-0"
          channelKey={params.channelKey}
          title={og.title!}
        />
      )}
      <Image
        alt="Channel image"
        className="h-24 w-[88px] min-w-[88px] rounded-l-lg border border-faint"
        src={og.image || NFT_IMAGE_UNAVAILABLE_URL}
      />
      <div className="flex h-24 flex-1 flex-col justify-center rounded-lg rounded-l-none border border-l-0 p-2 border-faint">
        <div className="flex flex-row space-x-1">
          <span
            className={cn(
              'line-clamp-1 text-sm font-semibold break-gracefully text-default',
            )}
          >
            {og.title}
            {typeof og.channel !== 'undefined' && (
              <span
                className={cn(
                  'ml-1 text-sm font-normal',
                  variant === 'direct-cast'
                    ? 'text-direct-casts-link'
                    : 'text-faint',
                )}
              >
                · /{og.channel.key}
              </span>
            )}
          </span>
          <div
            className={cn(
              'flex flex-row items-center text-xs leading-[20px] text-faint',
            )}
          >
            <PersonIcon size={10} />
            <span className="ml-0.5">
              {formatShorthandNumber(og.channel?.followerCount || 0)}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'line-clamp-3 text-sm break-gracefully',
            variant === 'direct-cast' ? 'text-default' : 'text-faint',
          )}
        >
          {og.description}
        </span>
      </div>
    </div>
  );
};

export { ChannelAttachment };
