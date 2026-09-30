import { ApiUser } from 'farcaster-client-data';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

import { useRequest } from '~/contexts/RequestProvider';
import { getProfileCastsAndRepliesUrl } from '~/utils/profileUtils';

type LinkToProfileCastsAndRepliesProps = {
  children: ReactNode;
  user: ApiUser;
};

const LinkToProfileCastsAndReplies: FC<LinkToProfileCastsAndRepliesProps> = ({
  children,
  user,
}) => {
  const { host } = useRequest();
  return (
    <Link href={getProfileCastsAndRepliesUrl({ host, user })}>{children}</Link>
  );
};

LinkToProfileCastsAndReplies.displayName = 'LinkToProfileCastsAndReplies';

export { LinkToProfileCastsAndReplies };
