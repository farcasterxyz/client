import { ApiAMA } from 'farcaster-client-data';
import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getAMAUrl = ({
  ama,
  host,
}: {
  ama: ApiAMA;
  host: string | undefined;
}) => {
  const path = `${appPathPrefix}/ama/${ama.guest.username}`;

  return `${host}${path}`;
};

export { getAMAUrl };
