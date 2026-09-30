import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToProfileSnapCastsWithoutUsernameProps = Omit<
  LinkProps<'profileSnapCastsWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToProfileSnapCastsWithoutUsername: FC<LinkToProfileSnapCastsWithoutUsernameProps> =
  memo((props) => {
    return (
      <Link to="profileSnapCastsWithoutUsername" searchParams={{}} {...props} />
    );
  });

LinkToProfileSnapCastsWithoutUsername.displayName =
  'LinkToProfileSnapCastsWithoutUsername';

export { LinkToProfileSnapCastsWithoutUsername };
