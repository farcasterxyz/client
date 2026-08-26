import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationWithoutUsernameProps = Omit<
  LinkProps<'conversationWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationWithoutUsername: FC<LinkToConversationWithoutUsernameProps> =
  memo((props) => {
    return (
      <Link to="conversationWithoutUsername" searchParams={{}} {...props} />
    );
  });

LinkToConversationWithoutUsername.displayName =
  'LinkToConversationWithoutUsername';

export { LinkToConversationWithoutUsername };
