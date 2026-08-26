import { ApiUser } from 'farcaster-client-data';
import { FC, memo, MouseEventHandler, useCallback } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToProfileSnapCastsWithoutUsername } from '~/components/links/LinkToProfileSnapCastsWithoutUsername';
import { LinkToProfileSnapCastsWithUsername } from '~/components/links/LinkToProfileSnapCastsWithUsername';
import { useOptimisticallyPrefetchProfile } from '~/hooks/data/useOptimisticallyPrefetchProfile';

export type LinkToProfileSnapCastsProps = Omit<
  LinkProps<'profileSnapCastsWithoutUsername' | 'profileSnapCastsWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
};

const LinkToProfileSnapCasts: FC<LinkToProfileSnapCastsProps> = memo(
  ({ user, onMouseOver: onMouseOverProp, ...props }) => {
    const optimisticallyPrefetchProfile = useOptimisticallyPrefetchProfile({
      user,
    });

    const onMouseOver: MouseEventHandler<HTMLAnchorElement> = useCallback(
      (e) => {
        optimisticallyPrefetchProfile();

        if (onMouseOverProp) {
          onMouseOverProp(e);
        }
      },
      [onMouseOverProp, optimisticallyPrefetchProfile],
    );

    if (user.username) {
      return (
        <LinkToProfileSnapCastsWithUsername
          {...props}
          onMouseOver={onMouseOver}
          params={{ username: user.username }}
          fid={user.fid}
        />
      );
    }

    return (
      <LinkToProfileSnapCastsWithoutUsername
        {...props}
        onMouseOver={onMouseOver}
        params={{ fid: user.fid }}
      />
    );
  },
);

LinkToProfileSnapCasts.displayName = 'LinkToProfileSnapCasts';

export { LinkToProfileSnapCasts };
