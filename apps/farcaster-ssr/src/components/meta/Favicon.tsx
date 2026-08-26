import { FC } from 'react';

const Favicon: FC = () => {
  return (
    <link rel="shortcut icon" type="image/png" href={`/favicon-v3.png`}></link>
  );
};

Favicon.displayName = 'Favicon';

export { Favicon };
