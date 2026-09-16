import { ApiChain, apiChainDisplayName } from 'farcaster-client-data';
import React from 'react';

import { useTheme } from '../../../contexts';
import { Text } from '../../design-system';

type ChainNameProps = {
  chain: ApiChain | undefined;
};

export function getChainName(chain: ApiChain | undefined): string {
  if (!chain) {
    return 'Ethereum';
  }
  const displayName = apiChainDisplayName(chain);
  return displayName === 'Unknown' ? 'Ethereum' : displayName;
}

const ChainName: React.FC<ChainNameProps> = React.memo(({ chain }) => {
  const t = useTheme();

  const chainName = React.useMemo(() => {
    return getChainName(chain);
  }, [chain]);

  return <Text style={[t.texts.primary, t.fontSemibold]}>{chainName}</Text>;
});

ChainName.displayName = 'ChainName';

export { ChainName };
