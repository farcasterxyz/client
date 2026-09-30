import { useUserCast } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { ConversationQuotes } from '~/components/conversation/ConversationQuotes';
import { useParams } from '~/hooks/navigation/useParams';

const ConversationQuotesWithUsernamePage: FC = memo(() => {
  const { castHashPrefix, username } = useParams(
    'conversationReactionsWithUsername',
  );

  const {
    result: {
      cast: { hash: castHash },
    },
  } = useUserCast({
    hashPrefix: castHashPrefix,
    username,
  }).data!;

  return <ConversationQuotes castHash={castHash} />;
});

ConversationQuotesWithUsernamePage.displayName =
  'ConversationQuotesWithUsernamePage';

export { ConversationQuotesWithUsernamePage };
