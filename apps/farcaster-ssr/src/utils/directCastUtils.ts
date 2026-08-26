import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getDirectCastInviteUrl = ({
  inviteCode,
  host,
}: {
  inviteCode: string;
  host: string | undefined;
}) => {
  const path = `${appPathPrefix}/group/${inviteCode}`;

  return `${host}${path}`;
};

export { getDirectCastInviteUrl };
