import { Provider } from 'ox';
import {
  createContext,
  MutableRefObject,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Connector, useAccount, useConnectors } from 'wagmi';

import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { PreferredWalletDialog } from '~/components/wallet/PreferredWalletDialog';
import { logError } from '~/utils/logUtils';

const PREFERRED_WALLET_KEY = 'preferred_wallet';
const MAX_AGE = 30 * 1000;

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

interface WalletContextType {
  // Connect Wallet
  connectors: readonly Connector[];
  openConnectModal: () => void;
  closeConnectModal: () => void;
  isConnectModalOpen: boolean;

  // Preferred Wallet
  preferredWallet: string | undefined;
  setPreferredWallet: (wallet: string) => void;
  clearPreferredWallet: () => void;

  // Common Wallet Data
  address: `0x${string}` | undefined;
  provider: Provider.Provider | undefined;
  connectionContextRef: MutableRefObject<
    | {
        domain: string;
        iconUrl?: string;
      }
    | undefined
  >;
}

const WalletContext = createContext<WalletContextType>({
  connectors: [],
  openConnectModal: () => undefined,
  closeConnectModal: () => undefined,
  isConnectModalOpen: false,
  preferredWallet: undefined,
  setPreferredWallet: () => undefined,
  clearPreferredWallet: () => undefined,
  address: undefined,
  provider: undefined,
  connectionContextRef: { current: undefined },
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

interface PendingConnectRequest {
  createdAt: Date;
  resolve: (result: unknown) => void;
  reject: (error: unknown) => void;
}

const WalletProvider = ({ children }: WalletProviderProps) => {
  // External hooks
  const connectors = useConnectors();
  const { connector, address } = useAccount();
  const { ethProvider, isConnected } = useEmbeddedWalletBridge();

  // State management
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [preferredWallet, setPreferredWallet] = useState<string | undefined>(
    () => localStorage.getItem(PREFERRED_WALLET_KEY) ?? undefined,
  );
  const [connectedProvider, setConnectedProvider] =
    useState<Provider.Provider>();
  const [warpcastWalletAddress, setWarpcastWalletAddress] = useState<
    `0x${string}` | undefined
  >();

  // Refs
  const connectionContextRef = useRef<
    { domain: string; iconUrl?: string } | undefined
  >(undefined);
  const pendingConnectRequestsRef = useRef<PendingConnectRequest[]>([]);
  const isRunningRefresh = useRef(false);

  // Helper to update preferred wallet and trigger re-load if needed
  const setPreferredWalletInner = useCallback(
    (wallet: string | undefined) => {
      setPreferredWallet(wallet);
      if (wallet !== preferredWallet) {
        setIsFullyLoaded(false);
      }
    },
    [preferredWallet],
  );

  // Modal controls
  const openConnectModal = useCallback(() => setIsConnectModalOpen(true), []);
  const closeConnectModal = useCallback(() => setIsConnectModalOpen(false), []);

  // Wallet preference handlers
  const handleSetPreferredWallet = useCallback(
    (wallet: string) => {
      setPreferredWalletInner(wallet);
      localStorage.setItem(PREFERRED_WALLET_KEY, wallet);

      // Trigger Warpcast connection immediately when selected
      if (wallet === 'warpcast') {
        siwfLog(
          'WalletProvider dispatching warpcast eth_requestAccounts to iframe',
          {
            hasEthProvider: !!ethProvider,
            ts: Date.now(),
          },
        );
        ethProvider?.request({ method: 'eth_requestAccounts' });
      }
    },
    [ethProvider, setPreferredWalletInner],
  );

  const clearPreferredWallet = useCallback(() => {
    setPreferredWalletInner(undefined);
    localStorage.removeItem(PREFERRED_WALLET_KEY);
  }, [setPreferredWalletInner]);

  // Disconnected provider that queues requests while loading
  const disconnectedProvider = useMemo(
    () =>
      Provider.from({
        ...Provider.createEmitter(),
        async request(request) {
          switch (request.method) {
            case 'eth_accounts':
              return [];

            case 'eth_requestAccounts': {
              siwfLog(
                'WalletProvider.disconnectedProvider received eth_requestAccounts',
                {
                  isFullyLoaded,
                  queueLen: pendingConnectRequestsRef.current.length,
                  ts: Date.now(),
                },
              );
              // Only open modal if fully loaded (prevents premature modal during init)
              if (isFullyLoaded) {
                openConnectModal();
              }

              // Queue the request to be processed once provider is ready
              return new Promise<unknown>((resolve, reject) => {
                pendingConnectRequestsRef.current.push({
                  createdAt: new Date(),
                  resolve,
                  reject,
                });
              });
            }

            default:
              throw new Provider.UnauthorizedError();
          }
        },
      }),
    [openConnectModal, isFullyLoaded],
  );

  // Helper: Process pending connect requests
  const processPendingRequests = async (provider: Provider.Provider) => {
    siwfLog('WalletProvider.processPendingRequests entered', {
      queueLen: pendingConnectRequestsRef.current.length,
      ts: Date.now(),
    });
    while (pendingConnectRequestsRef.current.length) {
      const request = pendingConnectRequestsRef.current.shift();
      if (!request) {
        continue;
      }

      const age = Date.now() - request.createdAt.getTime();
      if (age < MAX_AGE) {
        siwfLog('WalletProvider.processPendingRequests RESOLVING', {
          ageMs: age,
          ts: Date.now(),
        });
        request.resolve(provider.request({ method: 'eth_requestAccounts' }));
      } else {
        siwfLog('WalletProvider.processPendingRequests EXPIRED (>30s)', {
          ageMs: age,
          ts: Date.now(),
        });
        request.reject(new Error('Connect request expired'));
      }
    }
  };

  // Helper: Wrap provider with event handling
  const wrapProvider = (provider: Provider.Provider): Provider.Provider => {
    return Provider.from(
      {
        on: provider.on.bind(provider),
        removeListener: provider.removeListener.bind(provider),
        request: (params) => provider.request(params as never),
      },
      { includeEvents: true },
    );
  };

  // Resolve and set up the provider based on preferred wallet
  const refreshConnectedProvider = useCallback(async () => {
    // No preferred wallet - clear provider and potentially show modal
    if (!preferredWallet) {
      setConnectedProvider(undefined);
      setIsFullyLoaded(true);

      // Show modal if requests are waiting
      if (pendingConnectRequestsRef.current.length > 0) {
        openConnectModal();
      }
      return;
    }

    // Attempt to resolve the provider
    let nextProvider: Provider.Provider | undefined;

    try {
      if (preferredWallet === 'warpcast' && ethProvider) {
        // Get Warpcast embedded wallet
        const accounts = await ethProvider.request({ method: 'eth_accounts' });
        setWarpcastWalletAddress(accounts[0]);
        nextProvider = ethProvider as Provider.Provider;
      } else if (connector) {
        // Get external wallet provider (MetaMask, etc.)
        nextProvider = (await connector.getProvider()) as Provider.Provider;
      }
    } catch (error) {
      // Log the error for debugging but continue with disconnected provider
      logError(
        '[WalletProvider] Failed to resolve provider:',
        error,
        preferredWallet,
      );
      nextProvider = undefined;
    }

    // Process queued requests if provider is ready
    if (nextProvider) {
      await processPendingRequests(nextProvider);
      setConnectedProvider(wrapProvider(nextProvider));
    } else {
      setConnectedProvider(undefined);
    }

    setIsFullyLoaded(true);

    // Show modal if provider failed but requests are waiting
    if (!nextProvider && pendingConnectRequestsRef.current.length > 0) {
      openConnectModal();
    }
  }, [preferredWallet, connector, ethProvider, openConnectModal]);

  // Refresh provider when dependencies change (prevents concurrent refreshes)
  useEffect(() => {
    if (isRunningRefresh.current) {
      return;
    }

    isRunningRefresh.current = true;
    refreshConnectedProvider().finally(() => {
      isRunningRefresh.current = false;
    });
  }, [refreshConnectedProvider, isConnected]);

  // Build context value
  const value = useMemo<WalletContextType>(
    () => ({
      // Connectors
      connectors: connectors.toReversed(),

      // Modal controls
      openConnectModal,
      closeConnectModal,
      isConnectModalOpen,

      // Wallet preferences
      preferredWallet,
      setPreferredWallet: handleSetPreferredWallet,
      clearPreferredWallet,

      // Provider & address (only exposed when fully loaded)
      provider:
        isFullyLoaded && connectedProvider
          ? connectedProvider
          : disconnectedProvider,
      address: isFullyLoaded
        ? preferredWallet === 'warpcast'
          ? warpcastWalletAddress
          : address
        : undefined,

      // Connection context
      connectionContextRef,
    }),
    [
      connectors,
      openConnectModal,
      closeConnectModal,
      isConnectModalOpen,
      preferredWallet,
      handleSetPreferredWallet,
      clearPreferredWallet,
      isFullyLoaded,
      connectedProvider,
      disconnectedProvider,
      warpcastWalletAddress,
      address,
      connectionContextRef,
    ],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      {isConnectModalOpen && <PreferredWalletDialog />}
    </WalletContext.Provider>
  );
};

export { WalletProvider };
