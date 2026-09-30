import { ApiCast, getCastHashPrefix } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToConversationQuotesWithoutUsername } from '~/components/links/LinkToConversationQuotesWithoutUsername';
import { LinkToConversationQuotesWithUsername } from '~/components/links/LinkToConversationQuotesWithUsername';

export type LinkToConversationQuotesProps = Omit<
  LinkProps<
    'conversationQuotesWithoutUsername' | 'conversationQuotesWithUsername'
  >,
  'to' | 'params' | 'searchParams'
> & {
  cast: ApiCast;
};

const LinkToConversationQuotes: FC<LinkToConversationQuotesProps> = memo(
  ({ cast, ...props }) => {
    if (cast.author.username) {
      return (
        <LinkToConversationQuotesWithUsername
          params={{
            castHashPrefix: getCastHashPrefix({ castHash: cast.hash }),
            username: cast.author.username,
          }}
          {...props}
        />
      );
    }

    return (
      <LinkToConversationQuotesWithoutUsername
        params={{ castHash: cast.hash }}
        {...props}
      />
    );
  },
);

LinkToConversationQuotes.displayName = 'LinkToConversationQuotes';

export { LinkToConversationQuotes };
