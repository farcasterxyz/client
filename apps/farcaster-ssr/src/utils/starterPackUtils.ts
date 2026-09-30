import { ApiStarterPack } from 'farcaster-client-data';
import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getStarterPackUrl = ({
  starterPackId,
  starterPack,
  host,
}: {
  starterPackId: string;
  starterPack: ApiStarterPack;
  host: string | undefined;
}) => {
  if (starterPack.creator.username) {
    return `/${starterPack.creator.username}/pack/${starterPackId}`;
  }

  const path = `${appPathPrefix}/starter-pack/${starterPackId}`;

  return `${host}${path}`;
};

export { getStarterPackUrl };
