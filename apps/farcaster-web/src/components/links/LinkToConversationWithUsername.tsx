import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationWithUsernameProps = Omit<
  LinkProps<'conversationWithUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationWithUsername: FC<LinkToConversationWithUsernameProps> =
  memo((props) => {
    return <Link to="conversationWithUsername" searchParams={{}} {...props} />;
  });

LinkToConversationWithUsername.displayName = 'LinkToConversationWithUsername';

export { LinkToConversationWithUsername };
