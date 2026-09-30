import { ApiUser } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToFollowingWithoutUsername } from '~/components/links/LinkToFollowingWithoutUsername';
import { LinkToFollowingWithUsername } from '~/components/links/LinkToFollowingWithUsername';

type LinkToFollowingProps = Omit<
  LinkProps<'followingWithoutUsername' | 'followingWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
};

const LinkToFollowing: FC<LinkToFollowingProps> = memo(({ user, ...props }) => {
  if (user.username) {
    return (
      <LinkToFollowingWithUsername
        params={{ username: user.username }}
        fid={user.fid}
        {...props}
      />
    );
  }

  return (
    <LinkToFollowingWithoutUsername params={{ fid: user.fid }} {...props} />
  );
});

LinkToFollowing.displayName = 'LinkToFollowing';

export { LinkToFollowing };
