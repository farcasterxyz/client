import { ApiStarterPack } from 'farcaster-client-data';
import { FC } from 'react';

import { StarterPackHead } from './StarterPackHead';

type StarterPackProps = {
  starterPackId: string;
  starterPack: ApiStarterPack;
};

const StarterPack: FC<StarterPackProps> = ({
  starterPackId,
  starterPack,
}: StarterPackProps) => {
  return (
    <>
      <StarterPackHead
        starterPackId={starterPackId}
        starterPack={starterPack}
      />
      <div>{starterPackId}</div>
    </>
  );
};

StarterPack.displayName = 'StarterPack';

export { StarterPack };
