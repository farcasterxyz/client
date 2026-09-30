import { ApiChain, apiChainDisplayName } from 'farcaster-client-data';
import React from 'react';

type ChainNameProps = {
  chain: ApiChain | undefined;
};

const ChainName: React.FC<ChainNameProps> = React.memo(({ chain }) => {
  const chainName = React.useMemo(() => {
    if (!chain) {
      return 'Ethereum';
    }
    const displayName = apiChainDisplayName(chain);
    return displayName === 'Unknown' ? 'Ethereum' : displayName;
  }, [chain]);

  return <span className="text-default">{chainName}</span>;
});

ChainName.displayName = 'ChainName';

export { ChainName };
