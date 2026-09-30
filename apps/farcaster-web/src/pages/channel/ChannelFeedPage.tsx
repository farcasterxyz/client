import { EventingProvider } from 'farcaster-client-hooks';
import React from 'react';

import { useParams } from '~/hooks/navigation/useParams';

import { ChannelPageContent } from './ChannelPageContent';

const ChannelFeedPage = React.memo(() => {
  const { channelKey } = useParams('channelFeed');
  const { tab } = useParams('channelFeed');

  return (
    <EventingProvider on="channel" channel={channelKey} feed={tab}>
      <ChannelPageContent channelKey={channelKey} feedType={tab} />
    </EventingProvider>
  );
});

ChannelFeedPage.displayName = 'ChannelPage';

export { ChannelFeedPage };
