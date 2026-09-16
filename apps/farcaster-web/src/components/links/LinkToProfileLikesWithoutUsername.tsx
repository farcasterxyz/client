import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  FeedSourceOn,
  getFeedSourceOn,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToProfileLikesWithoutUsernameProps = Omit<
  LinkProps<'profileLikesWithoutUsername'>,
  'to' | 'searchParams'
> & {
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileLikesWithoutUsername: FC<LinkToProfileLikesWithoutUsernameProps> =
  memo(({ includeReason, sourceOn, castHash, ...props }) => {
    const {
      defaultEventProps: { castHash: defaultCastHash, on },
    } = useTrackEvent();
    const resolvedSourceOn = sourceOn ?? getFeedSourceOn(on);

    return (
      <Link
        to="profileLikesWithoutUsername"
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

LinkToProfileLikesWithoutUsername.displayName =
  'LinkToProfileLikesWithoutUsername';

export { LinkToProfileLikesWithoutUsername };
