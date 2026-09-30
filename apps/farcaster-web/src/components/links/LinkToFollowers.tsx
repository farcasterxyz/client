import { ApiUser } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { LinkProps } from '~/components/links/Link';
import { LinkToFollowersWithoutUsername } from '~/components/links/LinkToFollowersWithoutUsername';
import { LinkToFollowersWithUsername } from '~/components/links/LinkToFollowersWithUsername';

type LinkToFollowersProps = Omit<
  LinkProps<'followersWithoutUsername' | 'followersWithUsername'>,
  'to' | 'params' | 'searchParams'
> & {
  user: Pick<ApiUser, 'fid' | 'username'>;
};

const LinkToFollowers: FC<LinkToFollowersProps> = memo(({ user, ...props }) => {
  if (user.username) {
    return (
      <LinkToFollowersWithUsername
        params={{ username: user.username }}
        fid={user.fid}
        {...props}
      />
    );
  } else {
    return (
      <LinkToFollowersWithoutUsername params={{ fid: user.fid }} {...props} />
    );
  }
});

LinkToFollowers.displayName = 'LinkToFollowers';

export { LinkToFollowers };
