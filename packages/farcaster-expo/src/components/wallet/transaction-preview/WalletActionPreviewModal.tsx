import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';

import { useEmbeddedWallet } from '../../../contexts/EmbeddedWalletContext';
import { ConnectionContext, EvmPreviewRequest } from '../../../types';
import { WalletActionSolanaSignMessage } from './sign/WalletActionSolanaSignMessage';
import { WalletActionEthRequestAccounts } from './WalletActionEthRequestAccounts';
import { WalletActionEthSendTransaction } from './WalletActionEthSendTransaction';
import { WalletActionSolanaConnect } from './WalletActionSolanaConnect';
import { WalletActionSolanaSendTransaction } from './WalletActionSolanaSendTransaction';

const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.location?.search?.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[swap-debug][expo]', ...args);
};

export function WalletActionPreviewModal() {
  const { previewRequest, getConnectionContext, isConnected } =
    useEmbeddedWallet();

  // Key the cached context by preview id. A shared key let a new preview paint
  // with the previous request's stale walletLinkAttribution (NEYN-12452).
  const { data: connectionContext, refetch } = useQuery({
    queryKey: ['connectionContext', previewRequest?.id],
    queryFn: async () => {
      const context = await getConnectionContext();
      return context ?? { domain: 'farcaster.xyz' };
    },
    // getConnectionContext is sync on mobile (ref read): seed each request's
    // first paint with its real context. On web (Promise) use the placeholder.
    initialData: (): ConnectionContext => {
      const context = getConnectionContext();
      return context && !(context instanceof Promise)
        ? context
        : { domain: 'farcaster.xyz' };
    },
  });

  // Prefer the context captured on the request itself (threaded from the
  // surface that dispatched it); fall back to the shared query for surfaces
  // that don't thread it (web / mini-app). This is what closes the
  // stale-attribution race for wallet-link transactions (NEYN-12452).
  const requestConnectionContext =
    previewRequest?.connectionContext ?? connectionContext;

  useEffect(() => {
    siwfLog('WalletActionPreviewModal previewRequest changed', {
      hasPreviewRequest: !!previewRequest,
      protocol: previewRequest?.protocol,
      evmMethod:
        previewRequest?.protocol === 'evm'
          ? previewRequest?.evmPreviewRequest?.request?.method
          : undefined,
      solanaMethod:
        previewRequest?.protocol === 'solana'
          ? previewRequest?.solanaPreviewRequest?.method
          : undefined,
      isConnected,
      ts: Date.now(),
    });
    if (previewRequest) {
      refetch();
    }
  }, [previewRequest, refetch, isConnected]);

  if (!previewRequest) {
    return null;
  }

  if (previewRequest.protocol === 'solana') {
    const { solanaPreviewRequest } = previewRequest;
    if (solanaPreviewRequest.method === 'connect') {
      return <WalletActionSolanaConnect request={solanaPreviewRequest} />;
    } else if (solanaPreviewRequest.method === 'signMessage') {
      return (
        <WalletActionSolanaSignMessage
          connectionContext={requestConnectionContext}
          request={solanaPreviewRequest}
        />
      );
    } else if (
      solanaPreviewRequest.method === 'signTransaction' ||
      solanaPreviewRequest.method === 'signAndSendTransaction'
    ) {
      return (
        <WalletActionSolanaSendTransaction
          key={previewRequest.id}
          connectionContext={requestConnectionContext}
          request={solanaPreviewRequest}
          previewRequestId={previewRequest.id}
        />
      );
    }

    return null;
  }

  const { evmPreviewRequest } = previewRequest;

  if (
    !isConnected ||
    evmPreviewRequest?.request.method === 'eth_requestAccounts'
  ) {
    return (
      <WalletActionEthRequestAccounts
        key={previewRequest.id}
        connectionContext={requestConnectionContext}
        request={evmPreviewRequest as EvmPreviewRequest<'eth_requestAccounts'>}
      />
    );
  }

  switch (evmPreviewRequest.request.method) {
    case 'eth_sendTransaction':
    case 'eth_signTypedData_v4':
    case 'personal_sign':
    case 'wallet_sendCalls':
      return (
        <WalletActionEthSendTransaction
          key={previewRequest.id}
          connectionContext={requestConnectionContext}
          previewRequestId={previewRequest.id}
          request={
            evmPreviewRequest as EvmPreviewRequest<
              | 'eth_sendTransaction'
              | 'eth_signTypedData_v4'
              | 'personal_sign'
              | 'wallet_sendCalls'
            >
          }
        />
      );
    default:
      return null;
  }
}
