import { ApiUser } from 'farcaster-client-data';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

import { useRequest } from '~/contexts/RequestProvider';
import { getProfileCastsUrl } from '~/utils/profileUtils';

type LinkToProfileCastsProps = {
  children: ReactNode;
  user: ApiUser;
};

const LinkToProfileCasts: FC<LinkToProfileCastsProps> = ({
  children,
  user,
}) => {
  const { host } = useRequest();
  return <Link href={getProfileCastsUrl({ host, user })}>{children}</Link>;
};

LinkToProfileCasts.displayName = 'LinkToProfileCasts';

export { LinkToProfileCasts };
