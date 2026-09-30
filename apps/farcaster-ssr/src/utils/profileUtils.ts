import { ApiUser } from 'farcaster-client-data';
import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getProfileCastsUrl = ({
  host,
  user,
}: {
  host: string | undefined;
  user: ApiUser;
}) => {
  const path = user.username
    ? `/${user.username}`
    : `${appPathPrefix}/profiles/${user.fid}/casts`;

  return `${host}${path}`;
};

const getProfileCastsAndRepliesUrl = ({
  host,
  user,
}: {
  host: string | undefined;
  user: ApiUser;
}) => {
  const path = user.username
    ? `/${user.username}/casts-and-replies`
    : `${appPathPrefix}/profiles/${user.fid}/casts-and-replies`;

  return `${host}${path}`;
};

export { getProfileCastsAndRepliesUrl, getProfileCastsUrl };
