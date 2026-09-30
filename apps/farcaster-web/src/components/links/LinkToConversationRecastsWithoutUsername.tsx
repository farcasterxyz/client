import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationRecastsWithoutUsernameProps = Omit<
  LinkProps<'conversationRecastsWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationRecastsWithoutUsername: FC<LinkToConversationRecastsWithoutUsernameProps> =
  memo((props) => {
    return (
      <Link
        to="conversationRecastsWithoutUsername"
        searchParams={{}}
        {...props}
      />
    );
  });

LinkToConversationRecastsWithoutUsername.displayName =
  'LinkToConversationRecastsWithoutUsername';

export { LinkToConversationRecastsWithoutUsername };
