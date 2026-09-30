import { ApiChannel } from 'farcaster-client-data';
import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getChannelUrl = ({
  channel,
  host,
}: {
  channel: ApiChannel;
  host: string | undefined;
}) => {
  const path = `${appPathPrefix}/channel/${channel.key}`;

  return `${host}${path}`;
};

export { getChannelUrl };
