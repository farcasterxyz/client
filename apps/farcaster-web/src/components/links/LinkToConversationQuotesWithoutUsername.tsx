import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToConversationQuotesWithoutUsernameProps = Omit<
  LinkProps<'conversationQuotesWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToConversationQuotesWithoutUsername: FC<LinkToConversationQuotesWithoutUsernameProps> =
  memo((props) => {
    return (
      <Link
        to="conversationQuotesWithoutUsername"
        searchParams={{}}
        {...props}
      />
    );
  });

LinkToConversationQuotesWithoutUsername.displayName =
  'LinkToConversationQuotesWithoutUsername';

export { LinkToConversationQuotesWithoutUsername };
