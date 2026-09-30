import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationQuotesWithUsernameProps = Omit<
  LinkProps<'conversationQuotesWithUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationQuotesWithUsername: FC<LinkToConversationQuotesWithUsernameProps> =
  memo((props) => {
    return (
      <Link to="conversationQuotesWithUsername" searchParams={{}} {...props} />
    );
  });

LinkToConversationQuotesWithUsername.displayName =
  'LinkToConversationQuotesWithUsername';

export { LinkToConversationQuotesWithUsername };
