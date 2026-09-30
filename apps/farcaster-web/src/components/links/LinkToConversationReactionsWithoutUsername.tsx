import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationReactionsWithoutUsernameProps = Omit<
  LinkProps<'conversationReactionsWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationReactionsWithoutUsername: FC<LinkToConversationReactionsWithoutUsernameProps> =
  memo((props) => {
    return (
      <Link
        to="conversationReactionsWithoutUsername"
        searchParams={{}}
        {...props}
      />
    );
  });

LinkToConversationReactionsWithoutUsername.displayName =
  'LinkToConversationReactionsWithoutUsername';

export { LinkToConversationReactionsWithoutUsername };
