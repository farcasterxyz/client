import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToSignUpProps = Omit<
  LinkProps<'signup'>,
  'to' | 'params' | 'searchParams'
>;

const LinkToSignup: FC<LinkToSignUpProps> = memo((props) => {
  return <Link to="signup" params={{}} searchParams={{}} {...props} />;
});

LinkToSignup.displayName = 'LinkToSignup';

export { LinkToSignup };
