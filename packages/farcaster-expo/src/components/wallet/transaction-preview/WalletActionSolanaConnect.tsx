import React, { useCallback, useEffect, useRef } from 'react';

import { useEmbeddedWallet, useWalletSurface } from '../../../contexts';
import { SolanaConnectPreviewRequest } from '../../../types';
import { WalletAuthentication } from '../auth/WalletAuthentication';
import { WebWalletTransactionOverlay } from './WebWalletTransactionOverlay';

export function WalletActionSolanaConnect({
  request,
}: {
  request: SolanaConnectPreviewRequest;
}) {
  const { solanaAddress, isInitializing } = useEmbeddedWallet();

  // Synchronous gate: the auto-approve effect below and the cancel handler
  // both resolve `request`. Without this, a re-render that flips
  // solanaAddress on/off, or a double-tap on cancel, would approve/reject
  // more than once.
  const resolvedRef = useRef(false);

  const handleCancel = useCallback(() => {
    if (resolvedRef.current) {
      return;
    }
    resolvedRef.current = true;
    request.reject();
  }, [request]);

  useEffect(() => {
    if (solanaAddress && !resolvedRef.current) {
      resolvedRef.current = true;
      void request.approve();
    }
  }, [solanaAddress, request]);

  const { surface } = useWalletSurface();

  if (surface === 'mini_app_modal') {
    if (solanaAddress) {
      return null;
    }
    // Wallet still initializing — wait for auto-approve once solanaAddress is
    // available rather than flashing WalletAuthentication prematurely.
    if (isInitializing) {
      return null;
    }

    return (
      <WebWalletTransactionOverlay cancel={handleCancel}>
        <WalletAuthentication />
      </WebWalletTransactionOverlay>
    );
  }

  // Not supported outside mini app transaction modal on web.
  return null;
}
