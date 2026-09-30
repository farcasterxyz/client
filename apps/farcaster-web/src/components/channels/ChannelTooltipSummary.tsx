import cn from 'classnames';
import { ApiChannel } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  useGloballyCachedChannel,
} from 'farcaster-client-hooks';
import React from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { FollowChannelButton } from '~/components/forms/buttons/FollowChannelButton';
import { Image } from '~/components/images/Image';
import { LinkToChannel } from '~/components/links/LinkToChannel';
import { LinkToChannelFollowers } from '~/components/links/LinkToChannelFollowers';
import { LinkifiedText } from '~/components/text/LinkifiedText';

type ChannelTooltipSummaryProps = {
  channel: ApiChannel;
};

const ChannelTooltipSummary: React.FC<ChannelTooltipSummaryProps> = React.memo(
  ({ channel: fallbackChannel }) => {
    const channel = useGloballyCachedChannel({ fallback: fallbackChannel });

    const imageUrl = React.useMemo(() => {
      return channel.imageUrl || NFT_IMAGE_UNAVAILABLE_URL;
    }, [channel.imageUrl]);

    const channelImageComponent = React.useMemo(
      () => (
        <div className="relative shrink-0">
          <Image
            src={imageUrl}
            className={cn(
              'aspect-square h-[48px] w-[48px] shrink-0 rounded-full border object-cover border-default',
            )}
            alt={`${channel.name} image`}
            fallback={NFT_IMAGE_UNAVAILABLE_URL}
          />
        </div>
      ),
      [channel.name, imageUrl],
    );

    const channelNameComponent = React.useMemo(
      () => (
        <span className="text-xl font-semibold text-default">
          {channel.name}
        </span>
      ),
      [channel.name],
    );

    const mainContent = React.useMemo(() => {
      return (
        <div className="flex flex-col space-y-2">
          <div>
            <div className="flex flex-row items-baseline space-x-2">
              <LinkToChannel
                title="Navigate to channel"
                channelKey={channel.key}
              >
                {channelNameComponent}
              </LinkToChannel>
            </div>
          </div>
          {typeof channel.description !== 'undefined' && (
            <div
              className={cn(
                'max-h-[100px] overflow-hidden text-ellipsis text-sm break-gracefully text-faint',
              )}
            >
              <LinkifiedText
                content={channel.description}
                mentions={channel.descriptionMentionedUsernames}
                channelMentions={[]}
                tokenMentions={undefined}
                tokenMentionsV2={undefined}
              />
            </div>
          )}
          <LinkToChannelFollowers
            title={`Users following /${channel.key}`}
            channelKey={channel.key}
            className="shrink-0 text-muted hover:underline"
          >
            <span className="font-semibold text-default">
              {formatShorthandNumber(channel.followerCount || 0)}
            </span>
            <span>
              &nbsp;{channel.followerCount === 1 ? 'Follower' : 'Followers'}
            </span>
          </LinkToChannelFollowers>
        </div>
      );
    }, [
      channel.description,
      channel.descriptionMentionedUsernames,
      channel.followerCount,
      channel.key,
      channelNameComponent,
    ]);

    return (
      <div className="min-h-0 w-[320px] grow overflow-hidden rounded-lg p-4 shadow-md bg-app">
        <div className="flex flex-col items-start justify-between">
          <div className="mb-2 flex w-full flex-row justify-between">
            <LinkToChannel
              title="Navigate to channel"
              channelKey={channel.key}
              className="mr-2 shrink-0 md:mr-4"
            >
              {channelImageComponent}
            </LinkToChannel>
            <FollowChannelButton channel={channel} />
          </div>
          {mainContent}
        </div>
      </div>
    );
  },
);

ChannelTooltipSummary.displayName = 'ChannelTooltipSummary';

export { ChannelTooltipSummary };
