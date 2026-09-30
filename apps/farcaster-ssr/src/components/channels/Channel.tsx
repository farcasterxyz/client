import { ApiCastFeedItem, ApiChannel } from 'farcaster-client-data';
import { FC } from 'react';

import { Cast } from '~/components/casts/Cast';

import { ChannelHead } from './ChannelHead';

type ChannelProps = {
  channel: ApiChannel;
  feedItems: ApiCastFeedItem[];
};

const Channel: FC<ChannelProps> = ({ channel, feedItems }: ChannelProps) => {
  return (
    <>
      <ChannelHead channel={channel} />
      <div>{channel.name}</div>
      <div>{channel.description}</div>
      <div>
        {feedItems.map((item) => (
          <div key={item.id}>
            <Cast key={item.cast.hash} cast={item.cast} />
            {item.replies?.map((reply) => (
              <Cast key={reply.hash} cast={reply} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

Channel.displayName = 'Channel';

export { Channel };
