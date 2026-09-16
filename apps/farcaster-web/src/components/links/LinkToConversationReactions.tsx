import { ApiCast, getCastHashPrefix } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToConversationReactionsWithoutUsername } from '~/components/links/LinkToConversationReactionsWithoutUsername';
import { LinkToConversationReactionsWithUsername } from '~/components/links/LinkToConversationReactionsWithUsername';

export type LinkToConversationReactionsProps = Omit<
  LinkProps<
    'conversationReactionsWithoutUsername' | 'conversationReactionsWithUsername'
  >,
  'to' | 'params' | 'searchParams'
> & {
  cast: ApiCast;
};

const LinkToConversationReactions: FC<LinkToConversationReactionsProps> = memo(
  ({ cast, ...props }) => {
    if (cast.author.username) {
      return (
        <LinkToConversationReactionsWithUsername
          params={{
            castHashPrefix: getCastHashPrefix({ castHash: cast.hash }),
            username: cast.author.username,
          }}
          {...props}
        />
      );
    }

    return (
      <LinkToConversationReactionsWithoutUsername
        params={{ castHash: cast.hash }}
        {...props}
      />
    );
  },
);

LinkToConversationReactions.displayName = 'LinkToConversationReactions';

export { LinkToConversationReactions };
