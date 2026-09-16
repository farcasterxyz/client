import { ApiCast, getCastHashPrefix } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToConversationRecastsWithoutUsername } from '~/components/links/LinkToConversationRecastsWithoutUsername';
import { LinkToConversationRecastsWithUsername } from '~/components/links/LinkToConversationRecastsWithUsername';

export type LinkToConversationRecastsProps = Omit<
  LinkProps<
    'conversationRecastsWithoutUsername' | 'conversationRecastsWithUsername'
  >,
  'to' | 'params' | 'searchParams'
> & {
  cast: ApiCast;
};

const LinkToConversationRecasts: FC<LinkToConversationRecastsProps> = memo(
  ({ cast, ...props }) => {
    if (cast.author.username) {
      return (
        <LinkToConversationRecastsWithUsername
          params={{
            castHashPrefix: getCastHashPrefix({ castHash: cast.hash }),
            username: cast.author.username,
          }}
          {...props}
        />
      );
    }

    return (
      <LinkToConversationRecastsWithoutUsername
        params={{ castHash: cast.hash }}
        {...props}
      />
    );
  },
);

LinkToConversationRecasts.displayName = 'LinkToConversationRecasts';

export { LinkToConversationRecasts };
