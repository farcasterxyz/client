import { ApiEthNonFungibleToken, ApiPlatformType } from 'farcaster-client-data';
import * as React from 'react';

import { useEmbeddedWallet } from '../../contexts';
import { useWalletGeoRestricted } from '../../hooks';
import { SendTokens } from '../crypto';
import { SendTokensProvider } from '../crypto/tokens/send/SendTokensProvider';
import { WalletNotAvailableInRegion } from './auth/WalletNotAvailableInRegion';
import { WalletNotConnected } from './auth/WalletNotConnected';

export function WalletSendCollectible({
  platformType,
  data,
}: {
  platformType: ApiPlatformType;
  data: ApiEthNonFungibleToken;
}) {
  const { evmAddress, solanaAddress, getWalletClient, transactionCounterRef } =
    useEmbeddedWallet();
  const geoRestricted = useWalletGeoRestricted();

  if (geoRestricted) {
    return <WalletNotAvailableInRegion />;
  }

  if (!evmAddress) {
    return <WalletNotConnected source="wallet-send-collectible" />;
  }

  return (
    <SendTokensProvider
      platformType={platformType}
      getWalletClient={getWalletClient}
      evmAddress={evmAddress}
      solanaAddress={solanaAddress}
      transactionCounterRef={transactionCounterRef}
      sendIntent={{
        token: data,
      }}
    >
      <SendTokens />
    </SendTokensProvider>
  );
}
