import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToFollowersYouKnowWithoutUsernameProps = Omit<
  LinkProps<'followersYouKnowWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToFollowersYouKnowWithoutUsername: FC<LinkToFollowersYouKnowWithoutUsernameProps> =
  memo((props) => {
    return (
      <Link to="followersYouKnowWithoutUsername" searchParams={{}} {...props} />
    );
  });

LinkToFollowersYouKnowWithoutUsername.displayName =
  'LinkToFollowersYouKnowWithoutUsername';

export { LinkToFollowersYouKnowWithoutUsername };
