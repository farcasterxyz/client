import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import { FeedSourceOn } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToProfileLikesWithoutUsername } from '~/components/links/LinkToProfileLikesWithoutUsername';
import { LinkToProfileLikesWithUsername } from '~/components/links/LinkToProfileLikesWithUsername';

export type LinkToProfileLikesProps = Omit<
  LinkProps<'profileLikesWithoutUsername' | 'profileLikesWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileLikes: FC<LinkToProfileLikesProps> = memo(
  ({ user, includeReason, sourceOn, castHash, ...props }) => {
    if (user.username) {
      return (
        <LinkToProfileLikesWithUsername
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
      <LinkToProfileLikesWithoutUsername
        {...props}
        params={{ fid: user.fid }}
        includeReason={includeReason}
        sourceOn={sourceOn}
        castHash={castHash}
      />
    );
  },
);

LinkToProfileLikes.displayName = 'LinkToProfileLikes';

export { LinkToProfileLikes };
