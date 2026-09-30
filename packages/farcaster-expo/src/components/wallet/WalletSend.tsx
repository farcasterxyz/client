import * as React from 'react';

import { useEmbeddedWallet } from '../../contexts';
import { useWalletGeoRestricted } from '../../hooks';
import { WalletSendParams } from '../../types';
import { SendTokens } from '../crypto/tokens/send/SendTokens';
import { SendTokensProvider } from '../crypto/tokens/send/SendTokensProvider';
import { WalletNotAvailableInRegion } from './auth/WalletNotAvailableInRegion';
import { WalletNotConnected } from './auth/WalletNotConnected';

export function WalletSend(props: WalletSendParams) {
  const { evmAddress, solanaAddress, getWalletClient, transactionCounterRef } =
    useEmbeddedWallet();
  const geoRestricted = useWalletGeoRestricted();

  if (geoRestricted) {
    return <WalletNotAvailableInRegion />;
  }

  if (!evmAddress) {
    return <WalletNotConnected source="wallet-send" />;
  }

  return (
    <SendTokensProvider
      origin={props.origin}
      attributedDomain={props.attributedDomain}
      platformType={props.platformType}
      getWalletClient={getWalletClient}
      evmAddress={evmAddress}
      solanaAddress={solanaAddress}
      transactionCounterRef={transactionCounterRef}
      onSuccess={props.onSuccess}
      onError={props.onError}
      onSendExecuted={props.onSendExecuted}
      sendIntent={props.sendIntent}
    >
      <SendTokens />
    </SendTokensProvider>
  );
}
