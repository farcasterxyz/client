import { memo } from 'react';

import { ConversationQuotes } from '~/components/conversation/ConversationQuotes';
import { useParams } from '~/hooks/navigation/useParams';

const ConversationQuotesWithoutUsernamePage = memo(() => {
  const { castHash } = useParams('conversationQuotesWithoutUsername');

  return <ConversationQuotes castHash={castHash} />;
});

ConversationQuotesWithoutUsernamePage.displayName =
  'ConversationQuotesWithoutUsernamePage';

export { ConversationQuotesWithoutUsernamePage };
