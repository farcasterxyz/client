import {
  ApiCast,
  ApiQuoteCastEmbed,
  getCastHashPrefix,
} from 'farcaster-client-data';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToConversationWithoutUsername } from '~/components/links/LinkToConversationWithoutUsername';
import { LinkToConversationWithUsername } from '~/components/links/LinkToConversationWithUsername';

export type LinkToConversationProps = Omit<
  LinkProps<'conversationWithoutUsername' | 'conversationWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  cast: ApiCast | ApiQuoteCastEmbed;
};

const LinkToConversation: FC<LinkToConversationProps> = memo(
  ({ cast, ...props }) => {
    const { username } = cast.author;

    if (username) {
      return (
        <LinkToConversationWithUsername
          params={{
            castHashPrefix: getCastHashPrefix({ castHash: cast.hash }),
            username,
          }}
          {...props}
        />
      );
    }

    return (
      <LinkToConversationWithoutUsername
        params={{ castHash: cast.hash }}
        {...props}
      />
    );
  },
);

LinkToConversation.displayName = 'LinkToConversation';

export { LinkToConversation };
