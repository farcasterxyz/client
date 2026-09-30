import { memo } from 'react';

import { ConversationReactions } from '~/components/conversation/ConversationReactions';
import { useParams } from '~/hooks/navigation/useParams';

const ConversationReactionsWithoutUsernamePage = memo(() => {
  const { castHash } = useParams('conversationReactionsWithoutUsername');

  return <ConversationReactions castHash={castHash} />;
});

ConversationReactionsWithoutUsernamePage.displayName =
  'ConversationReactionsWithoutUsernamePage';

export { ConversationReactionsWithoutUsernamePage };
