import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationReactionsWithUsernameProps = Omit<
  LinkProps<'conversationReactionsWithUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationReactionsWithUsername: FC<LinkToConversationReactionsWithUsernameProps> =
  memo((props) => {
    return (
      <Link
        to="conversationReactionsWithUsername"
        searchParams={{}}
        {...props}
      />
    );
  });

LinkToConversationReactionsWithUsername.displayName =
  'LinkToConversationReactionsWithUsername';

export { LinkToConversationReactionsWithUsername };
