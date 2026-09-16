import { ApiChannel } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getChannelUrl } from '~/utils/channelUtils';
import { getImageUrl } from '~/utils/imageUtils';

type ChannelHeadProps = {
  channel: ApiChannel;
};

const ChannelHead: FC<ChannelHeadProps> = ({ channel }) => {
  const { host } = useRequest();

  const title = useMemo(() => {
    return `${channel.name} Channel on Farcaster`;
  }, [channel.name]);

  const description = useMemo(() => {
    const followerText =
      typeof channel.followerCount !== 'undefined'
        ? `Join ${channel.followerCount.toLocaleString()} followers in the ${channel.name} channel on Farcaster.`
        : `Join the ${channel.name} channel on Farcaster.`;
    return channel.description
      ? `${channel.description} — ${followerText}`
      : followerText;
  }, [channel.description, channel.name, channel.followerCount]);

  const url = useMemo(() => {
    return getChannelUrl({ channel, host });
  }, [channel, host]);

  const imageUrl = useMemo(() => {
    return (
      channel.fastImageUrl ||
      channel.imageUrl ||
      getImageUrl({
        host,
        path: defaultOGImagePath,
      })
    );
  }, [channel.fastImageUrl, channel.imageUrl, host]);

  const extras = useMemo(() => {
    const extras = [];

    extras.push({
      property: 'warpcast:channel:key',
      content: channel.key,
    });

    if (typeof channel.followerCount !== 'undefined') {
      extras.push({
        property: 'warpcast:channel:follower_count',
        content: channel.followerCount.toString(),
      });
    }

    return extras;
  }, [channel.followerCount, channel.key]);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      title={title}
      type="website"
      url={url}
      extras={extras}
    />
  );
};

ChannelHead.displayName = 'ChannelHead';

export { ChannelHead };
