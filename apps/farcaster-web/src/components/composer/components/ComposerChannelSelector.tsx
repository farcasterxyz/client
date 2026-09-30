import { ChevronDownIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useChannelFromGlobalCache } from 'farcaster-client-hooks';
import React, { useEffect, useState } from 'react';

import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { AnchoredPopover } from '~/components/popovers/AnchoredPopover';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

import { ComposerChannelListChannelsV3 } from './ComposerChannelListChannelsV3';

const HOME_FEED_IMAGE_URL = 'https://farcaster.xyz/~/channel-images/home.png';

interface ChannelForComposer {
  key: string;
  name: string;
  imageUrl: string;
  followerCount: number | undefined;
}

interface ComposerChannelSelectorProps {
  channelKey?: string;
  selectChannel: ({ channelKey }: { channelKey?: string }) => void;
}

const ComposerChannelSelector: React.FC<ComposerChannelSelectorProps> = ({
  channelKey,
  selectChannel,
}) => {
  if (channelKey) {
    return (
      <ComposerChannelSelectorChannel
        channelKey={channelKey}
        selectChannel={selectChannel}
      />
    );
  }

  return (
    <ComposerChannelSelectorContentChannelsV3
      channelKey={channelKey}
      channelImageUrl={HOME_FEED_IMAGE_URL}
      selectChannel={selectChannel}
    />
  );
};

ComposerChannelSelector.displayName = 'ComposerChannelSelector';

interface ComposerChannelSelectorChannelProps {
  channelKey: string;
  selectChannel: ({ channelKey }: { channelKey?: string }) => void;
}

const ComposerChannelSelectorChannel: React.FC<
  ComposerChannelSelectorChannelProps
> = ({ channelKey, selectChannel }) => {
  const { data: channel } = useChannelFromGlobalCache({
    key: channelKey,
  });

  const [channelImageUrl, setChannelImageUrl] = useState(
    NFT_IMAGE_UNAVAILABLE_URL,
  );

  useEffect(() => {
    setChannelImageUrl(channel?.imageUrl || NFT_IMAGE_UNAVAILABLE_URL);
  }, [channel]);

  return (
    <ComposerChannelSelectorContentChannelsV3
      channelKey={channelKey}
      channelImageUrl={channelImageUrl}
      selectChannel={selectChannel}
    />
  );
};

ComposerChannelSelectorChannel.displayName = 'ComposerChannelSelectorChannel';

interface ComposerChannelSelectorContentChannelsV3Props {
  channelKey?: string;
  channelImageUrl: string;
  selectChannel: ({ channelKey }: { channelKey?: string }) => void;
}

const ComposerChannelSelectorContentChannelsV3: React.FC<
  ComposerChannelSelectorContentChannelsV3Props
> = ({ channelKey, channelImageUrl, selectChannel }) => {
  const { trackEvent } = useAnalytics();
  const [open, setOpen] = React.useState(false);

  return (
    <AnchoredPopover
      contentClassName="outline-hidden z-20"
      onOpenChange={setOpen}
      open={open}
      sideOffset={12}
      trigger={
        <div
          className="flex cursor-pointer flex-row items-center space-x-1 rounded-md px-2 py-1 bg-elevated"
          onClick={() => {
            trackEvent(AnalyticsEvent.CastComposerChannelSelectorPressed, {
              hasChannel: typeof channelKey !== 'undefined',
            });
          }}
        >
          {typeof channelKey === 'undefined' ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10.8087 2.15819C10.3422 1.76237 9.65778 1.76237 9.19128 2.15819L2.94128 7.46122C2.66136 7.69872 2.5 8.04726 2.5 8.41436V16.25C2.5 16.9404 3.05964 17.5 3.75 17.5H7.70833C8.05351 17.5 8.33333 17.2202 8.33333 16.875V11.6667H11.6667V16.875C11.6667 17.2202 11.9465 17.5 12.2917 17.5H16.25C16.9404 17.5 17.5 16.9404 17.5 16.25V8.41436C17.5 8.04726 17.3386 7.69872 17.0587 7.46122L10.8087 2.15819Z"
                fill="#7C65C1"
              />
            </svg>
          ) : (
            <ChannelImage
              channelImageUrl={channelImageUrl}
              size="composer-quick-selector"
            />
          )}
          {typeof channelKey !== 'undefined' && <span>{channelKey}</span>}
          <span>
            <ChevronDownIcon className="text-action-purple" />
          </span>
        </div>
      }
    >
      <ComposerChannelListChannelsV3
        selectChannel={selectChannel}
        onClose={() => setOpen(false)}
      />
    </AnchoredPopover>
  );
};

ComposerChannelSelectorContentChannelsV3.displayName =
  'ComposerChannelSelectorContentChannelsV3';

export {
  type ChannelForComposer,
  ComposerChannelSelector,
  HOME_FEED_IMAGE_URL,
};
