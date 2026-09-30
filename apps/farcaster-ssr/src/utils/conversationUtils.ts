import { ApiCast, getCastHashPrefix } from 'farcaster-client-data';
import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getConversationUrl = ({
  cast,
  host,
}: {
  cast: ApiCast;
  host: string | undefined;
}) => {
  const path = cast.author.username
    ? `/${cast.author.username}/${getCastHashPrefix({ castHash: cast.hash })}`
    : `${appPathPrefix}/conversations/${cast.hash}`;

  return `${host}${path}`;
};

export { getConversationUrl };
