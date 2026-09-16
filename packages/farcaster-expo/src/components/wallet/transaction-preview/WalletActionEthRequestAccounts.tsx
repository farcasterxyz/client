import { useQueryClient } from '@tanstack/react-query';
import { useUpdateEmbeddedWallet } from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';

import { useEmbeddedWallet, useWalletSurface } from '../../../contexts';
import {
  getLocalMiniAppPolicyOverridesKey,
  parseLocalMiniAppPolicyOverrides,
  useActiveWallet,
  useCurrentUserFid,
} from '../../../hooks';
import { ConnectionContext, EvmPreviewRequest } from '../../../types';
import { logInDevOnly } from '../../../utils/LogUtils';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import { ButtonV2, Text2 } from '../../design-system';
import { WalletAuthentication } from '../auth/WalletAuthentication';
import { ActionButtons } from './common/ActionButtons';
import { WalletActionPreviewHeader } from './WalletActionPreviewHeader';
import { WebWalletTransactionOverlay } from './WebWalletTransactionOverlay';

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

function getMiniAppPermission(
  wallet:
    | {
        miniAppPolicy?:
          | { default: 'allowed' | 'blocked' }
          | 'allowed'
          | 'blocked';
      }
    | undefined,
) {
  const miniAppPolicy = wallet?.miniAppPolicy;
  return typeof miniAppPolicy === 'string'
    ? miniAppPolicy
    : (miniAppPolicy?.default ?? 'blocked');
}

export function WalletActionEthRequestAccounts({
  connectionContext,
  request,
}: {
  connectionContext: ConnectionContext;
  request: EvmPreviewRequest<'eth_requestAccounts'>;
}) {
  const { evmAddress, isInitializing } = useEmbeddedWallet();
  const { surface } = useWalletSurface();
  const { activeWallet, primaryWallet, selectPrimaryWallet } =
    useActiveWallet();
  const fid = useCurrentUserFid();
  const updateEmbeddedWallet = useUpdateEmbeddedWallet();
  const queryClient = useQueryClient();
  const modalRef = useRef<{ dismiss: () => void }>(null);
  const resolvedRef = useRef(false);
  const [rawMiniAppPolicyOverrides, setRawMiniAppPolicyOverrides] =
    useMMKVString(getLocalMiniAppPolicyOverridesKey(fid));
  const [miniAppPermission, setMiniAppPermission] = useState(
    getMiniAppPermission(activeWallet),
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const browserRequest = connectionContext.source === 'browser';

  useEffect(() => {
    setMiniAppPermission(getMiniAppPermission(activeWallet));
  }, [activeWallet]);

  const activePrivateWallet =
    activeWallet && !activeWallet.isPrimary ? activeWallet : undefined;
  const activePrivateWalletBlocked =
    activePrivateWallet && miniAppPermission !== 'allowed';
  const primaryEvmAddress = useMemo(
    () =>
      primaryWallet?.protocol === 'ethereum'
        ? primaryWallet.address
        : undefined,
    [primaryWallet],
  );

  const handleCancel = useCallback(() => {
    if (resolvedRef.current) {
      modalRef.current?.dismiss();
      return;
    }
    resolvedRef.current = true;
    setIsCancelling(true);
    request.reject();
    modalRef.current?.dismiss();
  }, [request]);

  const handleConfirm = useCallback(async () => {
    if (!evmAddress || isConfirming || resolvedRef.current) {
      return;
    }
    setIsConfirming(true);
    try {
      await request.approve(evmAddress);
      resolvedRef.current = true;
      modalRef.current?.dismiss();
    } catch (err) {
      // If approve throws, reject the dapp request instead of leaving it hung.
      logInDevOnly('eth_requestAccounts approve failed', err);
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        request.reject();
      }
      modalRef.current?.dismiss();
    } finally {
      setIsConfirming(false);
    }
  }, [evmAddress, isConfirming, request]);

  const handleConnectSelectedWallet = useCallback(async () => {
    if (evmAddress && !resolvedRef.current) {
      resolvedRef.current = true;
      await request.approve(evmAddress);
    }
  }, [evmAddress, request]);

  const handleSwitchToPublicAndConnect = useCallback(async () => {
    if (primaryEvmAddress && !resolvedRef.current) {
      resolvedRef.current = true;
      selectPrimaryWallet();
      await request.approve(primaryEvmAddress);
    }
  }, [primaryEvmAddress, request, selectPrimaryWallet]);

  const handleEnableAppTransactions = useCallback(async () => {
    if (!activePrivateWallet) {
      return;
    }
    setIsEnabling(true);
    try {
      const response = await updateEmbeddedWallet({
        walletId: activePrivateWallet.id,
        miniAppPolicy: { default: 'allowed' },
      });
      if (getMiniAppPermission(response.data.result.wallet) !== 'allowed') {
        throw new Error('Unexpected mini-app policy response');
      }
      setRawMiniAppPolicyOverrides(
        JSON.stringify({
          ...parseLocalMiniAppPolicyOverrides(rawMiniAppPolicyOverrides),
          [activePrivateWallet.id]: 'allowed',
        }),
      );
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'embeddedWallets',
      });
      setMiniAppPermission('allowed');
    } finally {
      setIsEnabling(false);
    }
  }, [
    activePrivateWallet,
    queryClient,
    rawMiniAppPolicyOverrides,
    setRawMiniAppPolicyOverrides,
    updateEmbeddedWallet,
  ]);

  useEffect(() => {
    siwfLog('WalletActionEthRequestAccounts auto-approve effect', {
      activePrivateWallet: !!activePrivateWallet,
      browserRequest,
      hasEvmAddress: !!evmAddress,
      resolved: resolvedRef.current,
      surface,
      ts: Date.now(),
    });
    if (
      !activePrivateWallet &&
      !browserRequest &&
      evmAddress &&
      !resolvedRef.current
    ) {
      siwfLog('WalletActionEthRequestAccounts auto-approving', {
        ts: Date.now(),
      });
      resolvedRef.current = true;
      void request.approve(evmAddress);
    }
  }, [activePrivateWallet, browserRequest, evmAddress, request, surface]);

  const isMiniAppSurface =
    surface === 'mini_app_modal' ||
    connectionContext.source === 'mini-app' ||
    connectionContext.surface === 'mini_app';
  const requestSurfaceLabel = isMiniAppSurface ? 'mini-app' : 'web app';
  const blockedMessage = activePrivateWallet
    ? `${activePrivateWallet.displayName} is selected, but ${requestSurfaceLabel} transactions are disabled for this wallet.`
    : '';
  const allowedMessage = activePrivateWallet
    ? `${activePrivateWallet.displayName} is selected for ${requestSurfaceLabel} activity.`
    : '';

  if (activePrivateWallet) {
    return (
      <WebWalletTransactionOverlay cancel={handleCancel}>
        <View style={{ gap: 16, padding: 24 }}>
          <View style={{ gap: 6 }}>
            <Text2 size="xl" weight="semibold" align="center">
              {isMiniAppSurface ? 'Connect mini-app' : 'Connect web app'}
            </Text2>
            <Text2 color="secondary" align="center">
              {activePrivateWalletBlocked ? blockedMessage : allowedMessage}
            </Text2>
          </View>

          {activePrivateWalletBlocked ? (
            <ButtonV2
              title={
                isEnabling
                  ? 'Enabling app transactions...'
                  : `Enable ${requestSurfaceLabel} transactions`
              }
              onPress={handleEnableAppTransactions}
              disabled={isEnabling}
            />
          ) : (
            <ButtonV2
              title="Connect selected secondary wallet"
              onPress={handleConnectSelectedWallet}
            />
          )}

          <ButtonV2
            title="Switch to public wallet and connect"
            onPress={handleSwitchToPublicAndConnect}
            variant="secondary"
            disabled={!primaryEvmAddress}
          />
        </View>
      </WebWalletTransactionOverlay>
    );
  }

  if (surface === 'mini_app_modal') {
    siwfLog('WalletActionEthRequestAccounts rendering mini_app_modal branch', {
      hasEvmAddress: !!evmAddress,
      isInitializing,
      ts: Date.now(),
    });
    if (evmAddress) {
      return null;
    }
    // Wallet still initializing — wait for auto-approve to fire once evmAddress
    // is available rather than flashing WalletAuthentication prematurely.
    if (isInitializing) {
      return null;
    }

    return (
      <WebWalletTransactionOverlay cancel={handleCancel}>
        <WalletAuthentication />
      </WebWalletTransactionOverlay>
    );
  }

  if (!browserRequest) {
    return null;
  }

  return (
    <AutoDisplayingBottomSheetModal
      ref={modalRef}
      name="BrowserWalletRequestAccounts"
      onDismiss={() => {
        if (!resolvedRef.current) {
          resolvedRef.current = true;
          request.reject();
        }
      }}
      handleComponent={null}
    >
      <View style={{ gap: 16, padding: 24 }}>
        <WalletActionPreviewHeader
          connectionContext={connectionContext}
          title="Connect wallet"
        />
        <Text2 color="secondary">
          This website can view your wallet address and request signatures or
          transactions. Signing and transactions will still require approval
          every time.
        </Text2>
        {!evmAddress ? <WalletAuthentication /> : null}
        <ActionButtons
          onCancel={handleCancel}
          onConfirm={() => {
            void handleConfirm();
          }}
          confirmTitle="Connect"
          cancelTitle="Reject"
          isConfirming={isConfirming}
          isCancelling={isCancelling}
          confirmDisabled={!evmAddress}
        />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
