import { ApiChannelFeedTab } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { LinkToChannel } from '~/components/links/LinkToChannel';
import { LinkToChannelFeed } from '~/components/links/LinkToChannelFeed';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';

interface ChannelFeedTabsProps {
  channelKey: string;
  feeds: ApiChannelFeedTab[];
  focusedFeedType: string;
}

const ChannelFeedTabs: FC<ChannelFeedTabsProps> = memo(
  ({ channelKey, feeds, focusedFeedType }) => {
    return (
      <Tabs>
        {feeds.map((feed, index) =>
          // First tab is always considered the default
          index === 0 ? (
            <LinkToChannel
              key={index}
              title={feed.name}
              channelKey={channelKey}
              className="flex size-full items-center justify-center text-inherit"
            >
              <Tab isFocused={feed.type === focusedFeedType}>{feed.name}</Tab>
            </LinkToChannel>
          ) : (
            <LinkToChannelFeed
              key={index}
              title={feed.name}
              channelKey={channelKey}
              tab={feed.type}
              className="flex size-full items-center justify-center text-inherit"
            >
              <Tab isFocused={feed.type === focusedFeedType}>{feed.name}</Tab>
            </LinkToChannelFeed>
          ),
        )}
      </Tabs>
    );
  },
);

ChannelFeedTabs.displayName = 'ChannelFeedTabs';

export { ChannelFeedTabs };
