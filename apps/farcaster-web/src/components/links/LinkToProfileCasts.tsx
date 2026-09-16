import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import { FeedSourceOn } from 'farcaster-client-hooks';
import { FC, memo, MouseEventHandler, useCallback } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToProfileCastsWithoutUsername } from '~/components/links/LinkToProfileCastsWithoutUsername';
import { LinkToProfileCastsWithUsername } from '~/components/links/LinkToProfileCastsWithUsername';
import { useOptimisticallyPrefetchProfile } from '~/hooks/data/useOptimisticallyPrefetchProfile';

export type LinkToProfileCastsProps = Omit<
  LinkProps<'profileCastsWithoutUsername' | 'profileCastsWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
  includeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  castHash?: string;
};

const LinkToProfileCasts: FC<LinkToProfileCastsProps> = memo(
  ({
    user,
    onMouseOver: onMouseOverProp,
    includeReason,
    sourceOn,
    castHash,
    ...props
  }) => {
    const optimisticallyPrefetchProfile = useOptimisticallyPrefetchProfile({
      user,
    });

    const onMouseOver: MouseEventHandler<HTMLAnchorElement> = useCallback(
      (e) => {
        // Lets start the fetching first and we can worry about
        // follow-up calls later.
        optimisticallyPrefetchProfile();

        if (onMouseOverProp) {
          onMouseOverProp(e);
        }
      },
      [onMouseOverProp, optimisticallyPrefetchProfile],
    );

    if (user.username) {
      return (
        <LinkToProfileCastsWithUsername
          {...props}
          onMouseOver={onMouseOver}
          params={{ username: user.username }}
          fid={user.fid}
          includeReason={includeReason}
          sourceOn={sourceOn}
          castHash={castHash}
        />
      );
    }

    return (
      <LinkToProfileCastsWithoutUsername
        {...props}
        onMouseOver={onMouseOver}
        params={{ fid: user.fid }}
        includeReason={includeReason}
        sourceOn={sourceOn}
        castHash={castHash}
      />
    );
  },
);

LinkToProfileCasts.displayName = 'LinkToProfileCasts';

export { LinkToProfileCasts };
