import { useUserCast } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { ConversationRecasts } from '~/components/conversation/ConversationRecasts';
import { useParams } from '~/hooks/navigation/useParams';

const ConversationRecastsWithUsernamePage: FC = memo(() => {
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

  return <ConversationRecasts castHash={castHash} />;
});

ConversationRecastsWithUsernamePage.displayName =
  'ConversationRecastsWithUsernamePage';

export { ConversationRecastsWithUsernamePage };
