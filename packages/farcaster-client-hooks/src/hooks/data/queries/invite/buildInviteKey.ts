const buildInviteKey = ({
  inviteId,
  inviteCode,
}: {
  inviteId?: string;
  inviteCode?: string;
}) => ['invite', inviteId, inviteCode];

export { buildInviteKey };
