import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationRecastsWithUsernameProps = Omit<
  LinkProps<'conversationRecastsWithUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationRecastsWithUsername: FC<LinkToConversationRecastsWithUsernameProps> =
  memo((props) => {
    return (
      <Link to="conversationRecastsWithUsername" searchParams={{}} {...props} />
    );
  });

LinkToConversationRecastsWithUsername.displayName =
  'LinkToConversationRecastsWithUsername';

export { LinkToConversationRecastsWithUsername };
