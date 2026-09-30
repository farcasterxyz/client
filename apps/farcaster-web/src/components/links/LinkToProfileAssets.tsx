import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import { FeedSourceOn } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToProfileAssetsWithoutUsername } from '~/components/links/LinkToProfileAssetsWithoutUsername';
import { LinkToProfileAssetsWithUsername } from '~/components/links/LinkToProfileAssetsWithUsername';

export type LinkToProfileAssetsProps = Omit<
  LinkProps<'profileAssetsWithoutUsername' | 'profileAssetsWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileAssets: FC<LinkToProfileAssetsProps> = memo(
  ({ user, includeReason, sourceOn, castHash, ...props }) => {
    if (user.username) {
      return (
        <LinkToProfileAssetsWithUsername
          {...props}
          params={{ username: user.username }}
          includeReason={includeReason}
          sourceOn={sourceOn}
          castHash={castHash}
        />
      );
    }

    return (
      <LinkToProfileAssetsWithoutUsername
        {...props}
        params={{ fid: user.fid }}
        includeReason={includeReason}
        sourceOn={sourceOn}
        castHash={castHash}
      />
    );
  },
);

LinkToProfileAssets.displayName = 'LinkToProfileAssets';

export { LinkToProfileAssets };
