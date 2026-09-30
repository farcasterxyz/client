import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getNewsArticleUrl = ({
  publicId,
  host,
}: {
  publicId: string;
  host: string | undefined;
}) => {
  const path = `${appPathPrefix}/news/${publicId}`;

  return `${host}${path}`;
};

export { getNewsArticleUrl };
