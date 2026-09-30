import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildPlaintextDirectCastGroupInviteKey = ({
  fid,
  conversationId,
  inviteCode,
}: {
  fid: number;
  conversationId?: string;
  inviteCode?: string;
}) =>
  compactQueryKey([
    'plaintextDirectCastGroupInvite',
    fid,
    conversationId,
    inviteCode,
  ]);

export { buildPlaintextDirectCastGroupInviteKey };
