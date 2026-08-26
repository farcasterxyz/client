import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

const getInviteUrl = ({
  inviteId,
  fid,
  host,
}: {
  inviteId: string;
  fid: number;
  host: string;
}) => {
  const path = `${appPathPrefix}/invite-page/${fid}?id=${inviteId}`;

  return `${host}${path}`;
};

export { getInviteUrl };
