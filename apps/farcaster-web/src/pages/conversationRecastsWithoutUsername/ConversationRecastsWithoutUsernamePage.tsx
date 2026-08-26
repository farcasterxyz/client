import { memo } from 'react';

import { ConversationRecasts } from '~/components/conversation/ConversationRecasts';
import { useParams } from '~/hooks/navigation/useParams';

const ConversationRecastsWithoutUsernamePage = memo(() => {
  const { castHash } = useParams('conversationRecastsWithoutUsername');

  return <ConversationRecasts castHash={castHash} />;
});

ConversationRecastsWithoutUsernamePage.displayName =
  'ConversationRecastsWithoutUsernamePage';

export { ConversationRecastsWithoutUsernamePage };
