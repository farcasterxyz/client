import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import { FeedSourceOn } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToProfileStarterPacksWithoutUsername } from '~/components/links/LinkToProfileStarterPacksWithoutUsername';
import { LinkToProfileStarterPacksWithUsername } from '~/components/links/LinkToProfileStarterPacksWithUsername';

export type LinkToProfileStarterPacksProps = Omit<
  LinkProps<
    'profileStarterPacksWithoutUsername' | 'profileStarterPacksWithUsername'
  >,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileStarterPacks: FC<LinkToProfileStarterPacksProps> = memo(
  ({ user, includeReason, sourceOn, castHash, ...props }) => {
    if (user.username) {
      return (
        <LinkToProfileStarterPacksWithUsername
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
      <LinkToProfileStarterPacksWithoutUsername
        {...props}
        params={{ fid: user.fid }}
        includeReason={includeReason}
        sourceOn={sourceOn}
        castHash={castHash}
      />
    );
  },
);

LinkToProfileStarterPacks.displayName = 'LinkToProfileStarterPacks';

export { LinkToProfileStarterPacks };
