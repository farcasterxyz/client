import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getAppUrl = ({
  appSlug,
  host,
}: {
  appSlug: string;
  host: string | undefined;
}) => {
  const path = `${appPathPrefix}/explore/apps/${appSlug}`;

  return `${host}${path}`;
};

export { getAppUrl };
