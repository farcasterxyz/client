import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

export type LinkToProfileSnapCastsWithUsernameProps = Omit<
  LinkProps<'profileSnapCastsWithUsername'>,
  'to' | 'searchParams'
> & {
  fid?: number;
};

const LinkToProfileSnapCastsWithUsername: FC<LinkToProfileSnapCastsWithUsernameProps> =
  memo((props) => {
    return (
      <Link to="profileSnapCastsWithUsername" searchParams={{}} {...props} />
    );
  });

LinkToProfileSnapCastsWithUsername.displayName =
  'LinkToProfileSnapCastsWithUsername';

export { LinkToProfileSnapCastsWithUsername };
