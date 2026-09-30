import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import { FeedSourceOn } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToProfileCastsAndRepliesWithoutUsername } from '~/components/links/LinkToProfileCastsAndRepliesWithoutUsername';
import { LinkToProfileCastsAndRepliesWithUsername } from '~/components/links/LinkToProfileCastsAndRepliesWithUsername';

export type LinkToProfileCastsAndRepliesProps = Omit<
  LinkProps<
    | 'profileCastsAndRepliesWithoutUsername'
    | 'profileCastsAndRepliesWithUsername'
  >,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileCastsAndReplies: FC<LinkToProfileCastsAndRepliesProps> =
  memo(({ user, includeReason, sourceOn, castHash, ...props }) => {
    if (user.username) {
      return (
        <LinkToProfileCastsAndRepliesWithUsername
          {...props}
          params={{ username: user.username }}
          fid={user.fid}
          includeReason={includeReason}
          sourceOn={sourceOn}
          castHash={castHash}
        />
      );
    }

    return (
      <LinkToProfileCastsAndRepliesWithoutUsername
        {...props}
        params={{ fid: user.fid }}
        includeReason={includeReason}
        sourceOn={sourceOn}
        castHash={castHash}
      />
    );
  });

LinkToProfileCastsAndReplies.displayName = 'LinkToProfileCastsAndReplies';

export { LinkToProfileCastsAndReplies };
