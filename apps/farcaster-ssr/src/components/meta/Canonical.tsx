import { FC } from 'react';

type CanonicalProps = {
  url: string;
};

const Canonical: FC<CanonicalProps> = ({ url }) => {
  return <link rel="canonical" href={url}></link>;
};

Canonical.displayName = 'Canonical';

export { Canonical };
