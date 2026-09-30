import { KebabHorizontalIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { ApiChannel, ApiUserChannelsCategory } from 'farcaster-client-data';
import React from 'react';

import { ChannelDropdownMenu } from '~/components/channels/ChannelDropdownMenu';
import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { ChannelBadge } from '~/components/channelUsers/ChannelBadge';
import { LinkToChannel } from '~/components/links/LinkToChannel';
import { useOptimisticallyPrefetchFeed } from '~/hooks/data/useOptimisticallyPrefetchFeed';
import { useUserChannelRole } from '~/hooks/useUserChannelRole';

type ChannelForCategoryProps = {
  channel: ApiChannel;
  category: ApiUserChannelsCategory;
};

const ChannelForCategory: React.FC<ChannelForCategoryProps> = ({ channel }) => {
  const optimisticallyPrefetchChannelFeed = useOptimisticallyPrefetchFeed();

  const onChannelMouseOver = React.useCallback(() => {
    optimisticallyPrefetchChannelFeed({ feedKey: channel.key });
  }, [channel.key, optimisticallyPrefetchChannelFeed]);

  const channelRole = useUserChannelRole(channel);

  const isOwner = channelRole === 'owner';

  const nameAndDescription = React.useMemo(
    () => (
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex min-w-0 flex-1 flex-row items-center space-x-2">
          <span className="min-w-0 truncate whitespace-nowrap text-left text-base font-semibold text-default">
            {channel.name}
          </span>
          {isOwner && <ChannelBadge label="Owner" color="primary" />}
        </div>
        <div className="mb-0.5 flex flex-row items-center gap-2">
          <span className="truncate text-sm text-muted">/{channel.key}</span>
        </div>
      </div>
    ),
    [channel.key, channel.name, isOwner],
  );

  const action = React.useMemo(() => {
    return (
      <ChannelDropdownMenu channel={channel} relationOnly={true}>
        {}
        <button className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-default text-default">
          <KebabHorizontalIcon size={16} />
        </button>
      </ChannelDropdownMenu>
    );
  }, [channel]);

  return (
    <LinkToChannel
      title={''}
      channelKey={channel.key}
      className={classNames(
        'relative flex w-full flex-row gap-2 border-b p-4 border-default',
      )}
      onMouseOver={onChannelMouseOver}
    >
      <ChannelImage
        channelImageUrl={channel.imageUrl}
        size="composer-selector-large"
      />
      <div className="min-w-0 flex-1 grow pr-1">{nameAndDescription}</div>
      <div className="self-center">{action}</div>
    </LinkToChannel>
  );
};

ChannelForCategory.displayName = 'ChannelForCategory';

export { ChannelForCategory };
