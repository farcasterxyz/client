import { ApiAMA } from 'farcaster-client-data';
import { FC } from 'react';

import { AMAHead } from './AMAHead';

type AMAProps = {
  ama: ApiAMA;
};

const AMA: FC<AMAProps> = ({ ama }: AMAProps) => {
  return (
    <>
      <AMAHead ama={ama} />
      <div>{ama.guest.displayName}</div>
      <div>{ama.at}</div>
    </>
  );
};

AMA.displayName = 'AMA';

export { AMA };
