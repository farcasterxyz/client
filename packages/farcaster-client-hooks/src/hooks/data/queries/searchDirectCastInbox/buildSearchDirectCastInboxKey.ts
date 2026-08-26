import { ApiDirectCastConversationViewCategory } from 'farcaster-client-data';

export const buildSearchDirectCastInboxKey = ({
  q,
  category,
}: {
  q: string;
  category: ApiDirectCastConversationViewCategory;
}) => ['searchDirectCastInbox', q, category];
