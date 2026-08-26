import {
  createSolanaWalletProvider,
  SendToken,
  SignIn,
  SolanaCombinedTransaction,
  SolanaConnectRequestArguments,
  SolanaRequestFn,
  SolanaSignAndSendTransactionRequestArguments,
  SolanaSignMessageRequestArguments,
  SolanaSignTransactionRequestArguments,
  SolanaWireRequestFn,
  SwapToken,
  unwrapSolanaProviderRequest,
} from '@farcaster/miniapp-core';
import {
  ApiChain,
  ApiSwapIntent,
  MessageChannelRpc,
} from 'farcaster-client-data';
import { useRandomUUID } from 'farcaster-client-hooks';
import { Provider, RpcResponse, RpcSchema, RpcTransport, Siwe } from 'ox';
import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { isDev } from '~/constants/env';
import { useAuth } from '~/contexts/AuthProvider';
import { EmbeddedWalletBridgeContext } from '~/contexts/EmbeddedWalletBridgeProvider';
import { useOpenableWarpcastWallet } from '~/contexts/OpenableWarpcastWalletContext';
import { useWalletLocked } from '~/contexts/WalletLockedProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { AppThemeName, useAppThemeName } from '~/hooks/theme/useAppTheme';
import { cn } from '~/lib/utils';

const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    return (
      window.location.search.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log('[swap-debug][web]', ...args);
};

const WALLET_ORIGIN = (() => {
  if (isDev) {
    return 'http://localhost:8082';
  }

  if (window.location.origin === 'https://web-dev.farcaster.xyz') {
    return 'https://wallet-dev.farcaster.xyz';
  }

  if (window.location.origin === 'https://web-stage.farcaster.xyz') {
    return 'https://wallet-stage.farcaster.xyz';
  }

  return 'https://wallet.farcaster.xyz';
})();

type EmbeddedWalletProps = {
  surface: 'mini_app_modal' | 'full_warplet' | 'bespoke_transaction';
  disableClicks?: boolean;
};

export const useEmbeddedWalletBridge = () => {
  const context = useContext(EmbeddedWalletBridgeContext);
  if (!context) {
    throw new Error(
      'useEmbeddedWallet must be used within EmbeddedWalletContext',
    );
  }
  return context;
};

export const useOptionalEmbeddedWalletBridge = () =>
  useContext(EmbeddedWalletBridgeContext);

export function EmbeddedWalletBridgeProvider({
  children,
  surface,
}: {
  children: ReactNode;
  surface: 'mini_app_modal' | 'full_warplet' | 'bespoke_transaction';
}) {
  const id = useRandomUUID();
  const { authToken } = useAuth();
  const doNavigate = useNavigate();
  const { openWarpcastWallet, closeWarpcastWallet } =
    useOpenableWarpcastWallet();

  const [bridge, setBridge] = useState<ReturnType<typeof createWalletBridge>>(
    () => {
      return createWalletBridge();
    },
  );
  const [bridgeInitialized, setInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const connectionContextRef = useRef<
    | {
        domain: string;
        iconUrl?: string;
      }
    | undefined
  >(undefined);

  // Used by nested embedded wallets (i.e .mini apps)
  const parentEmbeddedWalletContext = useContext(EmbeddedWalletBridgeContext);

  const refresh = useCallback(() => {
    bridge.walletClient.request({
      method: 'refresh',
    });
  }, [bridge]);

  const clearPreviewRequests = useCallback(() => {
    bridge.walletClient.request({
      method: 'clear_preview_requests',
    });
    closeWarpcastWallet();
  }, [bridge, closeWarpcastWallet]);

  // Refresh the child if the connection status has changed
  const preventRefreshCallback = useRef(false);
  useEffect(() => {
    if (!parentEmbeddedWalletContext) {
      return;
    }

    if (preventRefreshCallback.current) {
      preventRefreshCallback.current = false;
      return;
    }

    if (parentEmbeddedWalletContext.isConnected !== isConnected) {
      refresh();
    }

    if (!parentEmbeddedWalletContext.isConnected) {
      closeWarpcastWallet();
    }
  }, [parentEmbeddedWalletContext, refresh, isConnected, closeWarpcastWallet]);

  const sendTokenResultPromiseRef =
    useRef<(result: SendToken.SendTokenResult) => void>(undefined);
  const swapTokenResultPromiseRef =
    useRef<(result: SwapToken.SwapTokenResult) => void>(undefined);
  const signInWithAuthAddressResultPromiseRef =
    useRef<(result: SignIn.SignInResult) => void>(undefined);
  const transactionStateListenersRef = useRef<
    Array<{
      listener: (
        state: 'confirmed' | 'cancelled' | 'pending' | 'failed',
        metadata?: { type?: string; [key: string]: unknown },
      ) => void;
    }>
  >([]);

  const handleRequest = useCallback(
    (
      request: RpcSchema.ExtractRequest<
        MessageChannelRpc.WarpcastSchema | MessageChannelRpc.InitSchema
      >,
    ) => {
      switch (request.method) {
        case 'open_wallet':
          openWarpcastWallet();
          return;
        case 'auth':
          return { authToken, siwfMessage: '', siwfSignature: '' };
        case 'navigate': {
          doNavigate({
            to: request.params.to,
            params: request.params.params,
          } as never);
          return;
        }
        case 'get_connection_context': {
          return connectionContextRef.current;
        }
        case 'eth_provider_event': {
          bridge.ethEmitter.emit(
            request.params.event,
            request.params.params as never,
          );
          return;
        }
        case 'connected': {
          setIsConnected(request.params.connected);
          // Refresh the parent if the connection status has changed
          if (
            parentEmbeddedWalletContext &&
            !parentEmbeddedWalletContext.isConnected &&
            request.params.connected
          ) {
            preventRefreshCallback.current = true;
            parentEmbeddedWalletContext.refresh();
          }
          if (!request.params.connected) {
            closeWarpcastWallet();
          }
          return;
        }
        case 'report_wallet_locked': {
          // This is deprecated and we do nothing now
          // Keeping this here to avoid throwing below due to incompatical builds
          // TODO remove this after a bit
          return;
        }
        case 'send_token_result': {
          sendTokenResultPromiseRef.current?.(request.params.result);
          closeWarpcastWallet();
          return;
        }
        case 'swap_token_result': {
          swapTokenResultPromiseRef.current?.(request.params.result);
          closeWarpcastWallet();
          return;
        }
        case 'sign_in_with_auth_address_result': {
          signInWithAuthAddressResultPromiseRef.current?.(
            request.params.result,
          );
          closeWarpcastWallet();
          return;
        }
        case 'report_transaction_state': {
          transactionStateListenersRef.current.forEach(({ listener }) => {
            listener(request.params.state, request.params.metadata);
          });
          return;
        }
        case 'close_wallet': {
          closeWarpcastWallet();
          return;
        }
        default:
          throw new RpcResponse.MethodNotFoundError();
      }
    },
    [
      authToken,
      bridge.ethEmitter,
      doNavigate,
      openWarpcastWallet,
      parentEmbeddedWalletContext,
      closeWarpcastWallet,
    ],
  );

  useEffect(() => {
    bridge.setHandleRequestFn(handleRequest as never);
  }, [bridge, handleRequest]);

  const navigate = useCallback(
    (options: { path: string; params?: unknown; inParent?: boolean }) => {
      if (options.inParent && parentEmbeddedWalletContext) {
        parentEmbeddedWalletContext.navigate({
          path: options.path,
          params: options.params,
        });
      } else {
        openWarpcastWallet();
        bridge.walletClient.request({
          method: 'navigate',
          params: options,
        });
      }
    },
    [bridge, openWarpcastWallet, parentEmbeddedWalletContext],
  );

  const sendToken = useCallback(
    async (options: {
      sendIntent?: {
        chain: ApiChain;
        ca: string;
        amount?: string;
        recipientAddress?: string;
        recipientFid?: number;
      };
      attributedDomain?: string;
    }) => {
      openWarpcastWallet();
      return new Promise<SendToken.SendTokenResult>((resolve, reject) => {
        sendTokenResultPromiseRef.current = resolve;

        bridge.walletClient
          .request({
            method: 'send_token',
            params: options,
          })
          .catch(reject);
      });
    },
    [bridge, openWarpcastWallet],
  );

  const swapToken = useCallback(
    async (options: {
      swapIntent?: ApiSwapIntent;
      attributedDomain?: string;
    }) => {
      openWarpcastWallet();
      return new Promise<SwapToken.SwapTokenResult>((resolve, reject) => {
        swapTokenResultPromiseRef.current = resolve;

        bridge.walletClient
          .request({
            method: 'swap_token',
            params: options,
          })
          .catch(reject);
      });
    },
    [bridge, openWarpcastWallet],
  );

  const signInWithAuthAddress = useCallback(
    async (options: { message: Omit<Siwe.Message, 'address'> }) => {
      return new Promise<SignIn.SignInResult>((resolve, reject) => {
        signInWithAuthAddressResultPromiseRef.current = resolve;

        bridge.walletClient
          .request({
            method: 'sign_in_with_auth_address',
            params: options,
          })
          .catch(reject);
      });
    },
    [bridge],
  );

  const silentlySignAuthMessage = useCallback(
    async (options: { message: string }) => {
      return (await bridge.walletClient.request({
        method: 'silently_sign_auth_message',
        params: options,
      } as never)) as { signature: `0x${string}` };
    },
    [bridge],
  );

  const silentlySignManifest = useCallback(
    async (options: { domain: string }) => {
      return bridge.walletClient.request({
        method: 'silently_sign_manifest',
        params: options,
      });
    },
    [bridge],
  );

  const onTransactionStateChange = useCallback(
    (
      listener: (
        state: 'confirmed' | 'cancelled' | 'pending' | 'failed',
        metadata?: { type?: string; [key: string]: unknown },
      ) => void,
    ) => {
      const entry = { listener };
      transactionStateListenersRef.current.push(entry);

      // Return cleanup function
      return () => {
        transactionStateListenersRef.current =
          transactionStateListenersRef.current.filter((e) => e !== entry);
      };
    },
    [],
  );

  const logout = useCallback(() => {
    bridge.walletClient.request({
      method: 'logout',
    });
  }, [bridge]);

  const { addWalletLockedListener } = useWalletLocked();
  useEffect(
    () =>
      addWalletLockedListener((locked: boolean) => {
        if (locked) {
          logout();
        }
      }),
    [addWalletLockedListener, logout],
  );

  const { appThemeName } = useAppThemeName();

  const initialize = useCallback(
    (iframe: HTMLIFrameElement, id: string, sourceWindow?: Window) => {
      let nextBridge = bridge;
      if (bridgeInitialized) {
        bridge.close();
        nextBridge = createWalletBridge();
        setBridge(nextBridge);
      }

      const walletWindow = sourceWindow ?? iframe.contentWindow;

      walletWindow?.postMessage(
        {
          type: 'theme',
          theme: appThemeName,
        },
        WALLET_ORIGIN,
      );

      siwfLog('parent sending handshake to iframe', {
        id,
        origin: WALLET_ORIGIN,
        ts: Date.now(),
      });
      walletWindow?.postMessage({ fcinit: 'v1', id }, WALLET_ORIGIN, [
        nextBridge.initChannel.port2,
        nextBridge.walletChannel.port2,
        nextBridge.ethProviderChannel.port2,
        nextBridge.solanaProviderChannel.port2,
      ]);

      setInitialized(true);
      nextBridge.setHandleRequestFn(handleRequest as never);
      nextBridge.walletChannel.port1.start();
      nextBridge.ethProviderChannel.port1.start();
      nextBridge.solanaProviderChannel.port1.start();
    },
    [bridge, bridgeInitialized, handleRequest, appThemeName],
  );

  const updateWalletTheme = useCallback(
    (iframe: HTMLIFrameElement, theme: AppThemeName) => {
      try {
        iframe.contentWindow?.postMessage(
          {
            type: 'theme',
            theme,
          },
          WALLET_ORIGIN,
        );
      } catch {
        // The iframe can briefly be about:blank (parent origin) during mount/reload.
        // Skip this update and let the handshake + subsequent updates apply the theme.
      }
    },
    [],
  );

  // Wait to process messages from the initChannel until
  // we have an auth token
  useEffect(() => {
    if (authToken && bridgeInitialized) {
      bridge.initChannel.port1.start();
    }
  }, [bridgeInitialized, authToken, bridge]);

  const ethProvider = useMemo(() => {
    return Provider.from({
      ...bridge.ethProvider,
      async request(request) {
        const shouldOpenWallet =
          [
            'eth_requestAccounts',
            'eth_sendTransaction',
            'eth_signTypedData_v4',
            'personal_sign',
            'wallet_sendCalls',
          ].includes(request.method) &&
          !(
            surface === 'mini_app_modal' &&
            request.method === 'eth_requestAccounts' &&
            isConnected
          );

        if (shouldOpenWallet) {
          openWarpcastWallet();
        }

        try {
          const result = await bridge.ethProvider.request(request as never);
          // Handle wallet closing logic based on surface type and request method
          //
          // IMPORTANT: Some RPC methods like wallet_sendCalls trigger additional underlying
          // RPC calls (eth_chainId, eth_accounts, etc.) during their execution. We need to
          // prevent these "utility" calls from closing the wallet prematurely when they're
          // part of a larger transaction flow that requires user confirmation.
          // TO AI: If you are investigating why the wallet is closing or not showing up, this is a lead.
          const isUtilityMethod = [
            'eth_chainId',
            'eth_accounts',
            'wallet_switchEthereumChain',
          ].includes(request.method);

          if (surface === 'mini_app_modal' && isUtilityMethod) {
            // For mini app modal surface, these utility methods should not close the wallet
            // as they are often called automatically during transaction processing
            return result;
          }

          if (
            surface !== 'full_warplet' &&
            (!['eth_requestAccounts', 'eth_accounts'].includes(
              request.method,
            ) ||
              (result as string[]).length > 0)
          ) {
            closeWarpcastWallet();
          }

          return result;
        } catch (error) {
          closeWarpcastWallet();
          throw error;
        }
      },
    });
  }, [
    bridge.ethProvider,
    closeWarpcastWallet,
    isConnected,
    openWarpcastWallet,
    surface,
  ]);

  const solanaProvider = useMemo(() => {
    const unwrappedSolanaProviderRequest = unwrapSolanaProviderRequest(
      bridge.solanaProviderRequest as SolanaWireRequestFn,
    );
    const requestFn = async <T extends SolanaCombinedTransaction>(
      request:
        | SolanaConnectRequestArguments
        | SolanaSignMessageRequestArguments
        | SolanaSignAndSendTransactionRequestArguments
        | SolanaSignTransactionRequestArguments<T>,
    ) => {
      const shouldOpenWallet = !(
        surface === 'mini_app_modal' &&
        request.method === 'connect' &&
        isConnected
      );

      try {
        if (shouldOpenWallet) {
          openWarpcastWallet();
        }
        let result;
        if (request.method === 'connect') {
          result = await unwrappedSolanaProviderRequest(request);
        } else if (request.method === 'signMessage') {
          result = await unwrappedSolanaProviderRequest(request);
        } else if (request.method === 'signAndSendTransaction') {
          result = await unwrappedSolanaProviderRequest(request);
        } else if (request.method === 'signTransaction') {
          result = await unwrappedSolanaProviderRequest(request);
        }
        if (surface !== 'full_warplet') {
          closeWarpcastWallet();
        }
        return result;
      } catch (error) {
        closeWarpcastWallet();
        throw error;
      }
    };
    return createSolanaWalletProvider(requestFn as SolanaRequestFn);
  }, [
    bridge.solanaProviderRequest,
    closeWarpcastWallet,
    isConnected,
    openWarpcastWallet,
    surface,
  ]);

  const contextValue = useMemo(
    () => ({
      id,
      initialized: bridgeInitialized,
      ethProvider,
      navigate,
      sendToken,
      swapToken,
      signInWithAuthAddress,
      silentlySignAuthMessage,
      silentlySignManifest,
      refresh,
      clearPreviewRequests,
      initialize,
      connectionContextRef,
      isConnected,
      solanaProvider,
      onTransactionStateChange,
      updateWalletTheme,
    }),
    [
      id,
      bridgeInitialized,
      ethProvider,
      connectionContextRef,
      navigate,
      sendToken,
      swapToken,
      signInWithAuthAddress,
      silentlySignAuthMessage,
      silentlySignManifest,
      initialize,
      isConnected,
      refresh,
      clearPreviewRequests,
      solanaProvider,
      onTransactionStateChange,
      updateWalletTheme,
    ],
  );

  return (
    <EmbeddedWalletBridgeContext.Provider value={contextValue}>
      {children}
    </EmbeddedWalletBridgeContext.Provider>
  );
}

export function EmbeddedWalletIframe({
  surface,
  disableClicks,
}: EmbeddedWalletProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { initialize, id, initialized, updateWalletTheme } =
    useEmbeddedWalletBridge();
  const { appThemeName } = useAppThemeName();

  useEffect(() => {
    function listener(e: MessageEvent<unknown>) {
      if (e.origin !== WALLET_ORIGIN) {
        return;
      }
      if (e.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const data = e.data as { fcinit: string; id: string };
      if (data.fcinit !== 'v1' || data.id !== id) {
        return;
      }

      siwfLog(
        'parent received handshake ack from iframe → calling initialize',
        {
          id,
          ts: Date.now(),
        },
      );
      initialize(
        iframeRef.current!,
        (e.data as { id: string }).id,
        e.source as Window,
      );
    }

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  }, [id, initialize]);

  useEffect(() => {
    if (!initialized || !iframeRef.current) {
      return;
    }
    updateWalletTheme(iframeRef.current, appThemeName);
  }, [initialized, iframeRef, updateWalletTheme, appThemeName]);

  const src = useMemo(() => {
    const url = new URL(
      surface === 'mini_app_modal'
        ? `${WALLET_ORIGIN}/MiniAppTransactionModal`
        : WALLET_ORIGIN,
    );

    url.searchParams.set('id', id as string);

    return url;
  }, [surface, id]);

  return (
    <iframe
      ref={iframeRef}
      src={src.href}
      className={cn([
        'size-full flex-1',
        { 'pointer-events-none': disableClicks },
      ])}
    />
  );
}

const createWalletBridge = () => {
  const initChannel = new MessageChannel();
  const walletChannel = new MessageChannel();
  const ethProviderChannel = new MessageChannel();
  const solanaProviderChannel = new MessageChannel();

  let handleRequestFn: RpcTransport.RequestFn<
    false,
    {},
    MessageChannelRpc.WarpcastSchema
  > = () => {
    throw new Error(
      'Bridge server received request before being initialized. Wait to open the port until this function is initialization.',
    );
  };

  function handleRequest(request: never) {
    return handleRequestFn(request);
  }

  function setHandleRequestFn(fn: never) {
    handleRequestFn = fn;
  }

  MessageChannelRpc.createServer<MessageChannelRpc.InitSchema>({
    channelName: 'init',
    port: initChannel.port1,
    handleRequest: {
      // @ts-expect-error
      current: handleRequest,
    },
  });

  MessageChannelRpc.createServer<MessageChannelRpc.WarpcastSchema>({
    channelName: 'warpcast',
    port: walletChannel.port1,
    handleRequest: {
      // @ts-expect-error
      current: handleRequest,
    },
  });

  const walletClient =
    MessageChannelRpc.createClient<MessageChannelRpc.WalletSchema>({
      channelName: 'walletProvider',
      port: walletChannel.port1,
    });

  const ethProviderClient = MessageChannelRpc.createClient<RpcSchema.Default>({
    channelName: 'ethProvider',
    port: ethProviderChannel.port1,
  });

  const ethEmitter = Provider.createEmitter();
  const ethProvider = Provider.from({
    ...ethEmitter,
    async request(parameters) {
      return await ethProviderClient.request(parameters as never);
    },
  });

  const solanaProviderClient =
    MessageChannelRpc.createClient<MessageChannelRpc.SolanaSchema>({
      channelName: 'solanaProvider',
      port: solanaProviderChannel.port1,
    });

  const solanaProviderRequest = solanaProviderClient.request;

  function close() {
    walletClient.destroy();
    ethProviderClient.destroy();
    solanaProviderClient.destroy();
    initChannel.port1.close();
    walletChannel.port1.close();
    ethProviderChannel.port1.close();
    solanaProviderChannel.port1.close();
  }

  return {
    walletChannel,
    initChannel,
    ethProviderChannel,
    walletClient,
    ethEmitter,
    ethProvider,
    setHandleRequestFn,
    close,
    solanaProviderChannel,
    solanaProviderRequest,
  };
};
