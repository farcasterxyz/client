import Link from 'next/link';
import { FC, ReactNode } from 'react';

import { useRequest } from '~/contexts/RequestProvider';

type InternalLinkProps = {
  path: string;
  children: ReactNode;
};

const InternalLink: FC<InternalLinkProps> = ({ path, children }) => {
  if (!path.startsWith('/')) {
    throw new Error(`InternalLink path must start with /: ${path}`);
  }

  const { host } = useRequest();
  return <Link href={`${host}${path}`}>{children}</Link>;
};

InternalLink.displayName = 'InternalLink';

export { InternalLink };
