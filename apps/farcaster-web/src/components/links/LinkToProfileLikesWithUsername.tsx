import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  FeedSourceOn,
  getFeedSourceOn,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToProfileLikesWithUsernameProps = Omit<
  LinkProps<'profileLikesWithUsername'>,
  'to' | 'searchParams'
> & {
  fid: number;
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileLikesWithUsername: FC<LinkToProfileLikesWithUsernameProps> =
  memo(({ includeReason, sourceOn, castHash, ...props }) => {
    const {
      defaultEventProps: { castHash: defaultCastHash, on },
    } = useTrackEvent();
    const resolvedSourceOn = sourceOn ?? getFeedSourceOn(on);

    return (
      <Link
        to="profileLikesWithUsername"
        searchParams={{
          ...(includeReason ? { includeReason } : {}),
          ...(resolvedSourceOn ? { sourceOn: resolvedSourceOn } : {}),
          ...((castHash ?? defaultCastHash)
            ? { castHash: castHash ?? defaultCastHash }
            : {}),
        }}
        {...props}
      />
    );
  });

LinkToProfileLikesWithUsername.displayName = 'LinkToProfileLikesWithUsername';

export { LinkToProfileLikesWithUsername };
