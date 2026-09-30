import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getTokenLinkUrl = ({
  ticker,
  host,
}: {
  ticker: string;
  host: string | undefined;
}) => {
  const path = `${appPathPrefix}/token/${ticker}`;

  return `${host}${path}`;
};

export { getTokenLinkUrl };
