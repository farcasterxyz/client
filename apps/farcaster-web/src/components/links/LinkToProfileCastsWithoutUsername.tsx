import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  FeedSourceOn,
  getFeedSourceOn,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToProfileCastsWithoutUsernameProps = Omit<
  LinkProps<'profileCastsWithoutUsername'>,
  'to' | 'searchParams'
> & {
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileCastsWithoutUsername: FC<LinkToProfileCastsWithoutUsernameProps> =
  memo(({ includeReason, sourceOn, castHash, ...props }) => {
    const {
      defaultEventProps: { castHash: defaultCastHash, on },
    } = useTrackEvent();
    const resolvedSourceOn = sourceOn ?? getFeedSourceOn(on);

    return (
      <Link
        to="profileCastsWithoutUsername"
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

LinkToProfileCastsWithoutUsername.displayName =
  'LinkToProfileCastsWithoutUsername';

export { LinkToProfileCastsWithoutUsername };
