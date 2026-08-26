import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
} from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastInboxByAccountKey = ({
  fid,
  category,
  filter,
}: {
  fid?: number;
  category?: ApiDirectCastConversationViewCategory;
  filter?: ApiDirectCastConversationFilter;
}) => compactQueryKey(['directCastInbox', category, filter, fid]);

export { buildDirectCastInboxByAccountKey };
