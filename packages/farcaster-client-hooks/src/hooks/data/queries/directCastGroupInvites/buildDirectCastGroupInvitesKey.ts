import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastGroupInvitesKey = ({
  conversationId,
}: {
  conversationId: string;
}) => compactQueryKey(['directCastGroupInvites', conversationId]);

export { buildDirectCastGroupInvitesKey };
