import { PersonIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { ApiChannel } from 'farcaster-client-data';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { FollowChannelButton } from '~/components/forms/buttons/FollowChannelButton';
import { Image } from '~/components/images/Image';
import { LinkToChannelWithSummaryTooltip } from '~/components/links/LinkToChannelWithSummaryTooltip';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { useOptimisticallyPrefetchFeed } from '~/hooks/data/useOptimisticallyPrefetchFeed';
import { applyCloudflarePath } from '~/utils/images';

type ChannelProps = {
  channel: ApiChannel;
  className?: string;
  hideDescription?: boolean;
  hideMemberCount?: boolean;
  style?: 'default' | 'suggestion' | 'notification' | 'notification-vertical';
  onFollowCallback?: (followed: boolean) => void;
  showBottomBorder?: boolean;
};

const Channel: React.FC<ChannelProps> = ({
  className,
  channel,
  style = 'default',
  hideDescription = false,
  hideMemberCount = false,
  showBottomBorder = true,
  onFollowCallback,
}) => {
  const imageUrl = React.useMemo(() => {
    return channel.imageUrl || NFT_IMAGE_UNAVAILABLE_URL;
  }, [channel.imageUrl]);

  const optimisticallyPrefetchChannelFeed = useOptimisticallyPrefetchFeed();

  const onMouseOver = React.useCallback(() => {
    optimisticallyPrefetchChannelFeed({ feedKey: channel.key });
  }, [channel.key, optimisticallyPrefetchChannelFeed]);

  const nameAndDescription = useMemo(
    () => (
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex min-w-0 flex-1 flex-row items-center space-x-2">
          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left text-base font-semibold text-default">
            {channel.name}
          </span>
        </div>
        {style !== 'notification' && style !== 'notification-vertical' && (
          <div className="mb-0.5 flex flex-row items-center gap-2">
            <span className="truncate text-sm text-muted">/{channel.key}</span>
            {!hideMemberCount && (
              <>
                <span className="text-sm text-muted">·</span>
                <div className="flex flex-row items-center gap-1">
                  <PersonIcon className="text-muted" size={14} />
                  <span className="text-sm leading-[10px] text-muted">
                    {formatShorthandNumber(channel.followerCount || 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
        {!hideDescription && typeof channel.description !== 'undefined' && (
          <span className="text-left text-sm text-muted">
            <div className="max-w-[480px] break-gracefully">
              <LinkifiedText
                content={channel.description}
                mentions={channel.descriptionMentionedUsernames}
                channelMentions={[]}
                tokenMentions={undefined}
                tokenMentionsV2={undefined}
              />
            </div>
          </span>
        )}
      </div>
    ),
    [channel, hideDescription, hideMemberCount, style],
  );

  const followButton = useMemo(
    () => (
      <FollowChannelButton
        channel={channel}
        onClickCallback={onFollowCallback}
        style={style === 'suggestion' ? 'inverted-small' : 'default'}
      />
    ),
    [channel, onFollowCallback, style],
  );

  return (
    <LinkToChannelWithSummaryTooltip
      title={''}
      channelKey={channel.key}
      className={cn(
        'relative flex w-full flex-row gap-2',
        style === 'default' ? 'p-4' : style === 'suggestion' ? 'p-2' : '',
        style === 'notification' ||
          style === 'notification-vertical' ||
          !showBottomBorder
          ? ''
          : 'border-b border-default',
        className,
      )}
      onMouseOver={onMouseOver}
    >
      <Image
        src={applyCloudflarePath(imageUrl, 40)}
        className={cn(
          'aspect-square shrink-0 rounded-full border object-cover border-default',
          style === 'suggestion' ? 'h-[40px] w-[40px]' : 'h-[48px] w-[48px]',
        )}
        alt={`${channel.name} image`}
        fallback={NFT_IMAGE_UNAVAILABLE_URL}
      />
      {style === 'notification-vertical' ? (
        <div className="flex flex-col gap-2">
          {nameAndDescription}
          {followButton}
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1 grow pr-1">{nameAndDescription}</div>
          <div className="self-center">{followButton}</div>
        </>
      )}
    </LinkToChannelWithSummaryTooltip>
  );
};

Channel.displayName = 'Channel';

export { Channel };
