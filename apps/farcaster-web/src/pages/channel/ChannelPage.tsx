import {
  EventingProvider,
  getChannelDefaultFeed,
  useChannelFromGlobalCache,
} from 'farcaster-client-hooks';
import React from 'react';

import { useParams } from '~/hooks/navigation/useParams';

import { ChannelPageContent } from './ChannelPageContent';

const ChannelPage = React.memo(
  ({ openSettings }: { openSettings: boolean }) => {
    // Use the params from the channel settings section page which are a superset of the params
    // for the channel settings page and the channel page
    const { channelKey, section } = useParams('channelSettingsSection');

    const { data: channel } = useChannelFromGlobalCache({
      key: channelKey,
    });

    if (!channel) {
      return null;
    }

    return (
      <EventingProvider
        on="channel"
        channel={channel.key}
        feed={getChannelDefaultFeed(channel)}
      >
        <ChannelPageContent
          channelKey={channelKey}
          feedType={getChannelDefaultFeed(channel)}
          settingsModalState={{
            isOpen: openSettings,
            section,
          }}
        />
      </EventingProvider>
    );
  },
);

ChannelPage.displayName = 'ChannelPage';

export { ChannelPage };
