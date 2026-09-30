import { useUserCast } from 'farcaster-client-hooks';
import { memo } from 'react';

import { ConversationReactions } from '~/components/conversation/ConversationReactions';
import { useParams } from '~/hooks/navigation/useParams';

const ConversationReactionsWithUsernamePage = memo(() => {
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

  return <ConversationReactions castHash={castHash} />;
});

ConversationReactionsWithUsernamePage.displayName =
  'ConversationReactionsWithUsernamePage';

export { ConversationReactionsWithUsernamePage };
