import {
  configure,
  makeRequest as makeRequestWalletMobile,
  Result,
  WalletMobileSDKEVMProvider,
} from '@coinbase/wallet-mobile-sdk';
import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { errorCodes, EthereumProviderError, ethErrors } from 'eth-rpc-errors';
import { AnalyticsEvent } from 'farcaster-analytics';
import { extractWalletChain, WalletChainId } from 'farcaster-client-data';
import { useRecordWalletTransaction } from 'farcaster-client-hooks';
import {
  assertHex,
  ConnectionContext,
  ConnectResult,
  EvmWalletProvider,
  GetWalletClient,
  MWPWalletType,
  SendTransactionArgs,
  SendTransactionResult,
  SignatureResult,
  SignTypedDataV4Args,
  usePublicClient,
  Wallet,
  WalletConfig,
} from 'farcaster-expo';
import * as Provider from 'ox/Provider';
import * as RpcSchema from 'ox/RpcSchema';
import * as RpcTransport from 'ox/RpcTransport';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
import {
  createWalletClient as createViemWalletClient,
  custom,
  fromHex,
  Hex,
  hexToNumber,
  toHex,
} from 'viem';
import * as chains from 'viem/chains';

import { supportedNetworkIds } from '~/constants/MwpWallets';
import { trackError } from '~/utils/ErrorUtils';
import { logInDevOnly } from '~/utils/LogUtils';

import { useAnalytics } from './AnalyticsProvider';

const MWPWalletContext = createContext<Wallet>(null!);

export const useMWPWallet = () => useContext(MWPWalletContext);

const provider = new WalletMobileSDKEVMProvider({
  chainId: 1,
  jsonRpcUrl: getPublicRpc('0x1'),
});

// type safe provider
const typedProvider = Provider.from(provider, { includeEvents: true });

// Extracted from WalletMobileSDKEVMProvider
function getProviderError(result: Result) {
  const errorMessage = result.errorMessage ?? '';
  if (errorMessage.match(/(denied|rejected)/i)) {
    return ethErrors.provider.userRejectedRequest();
  } else {
    return ethErrors.provider.custom({
      code: result.errorCode ?? 1000,
      message: errorMessage,
    });
  }
}

function getPublicRpc(chainId: string) {
  const id = parseInt(chainId);
  for (const chain of Object.values(chains)) {
    if ('id' in chain) {
      if (chain.id === id) {
        return chain.rpcUrls.default.http[0];
      }
    }
  }

  throw new Error(`RPC for chainId ${chainId} not found`);
}

export function MWPWalletProvider({ children }: { children: React.ReactNode }) {
  // Track provider load time once on mount. Calling startAction/stopAction in
  // the render body fired on every re-render (15+ times during SpaceRoom due to
  // cascading context updates), polluting telemetry and adding render overhead.
  const mountedRef = React.useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
    DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'MWPWalletProvider',
    });
  }

  const [type, setType] = useState<MWPWalletType | undefined>();
  const [name, setName] = useState<string | undefined>();
  const { getEthereumClient } = usePublicClient();
  const [protocol, setProtocol] = useState<string | undefined>();
  const recordWalletTransaction = useRecordWalletTransaction();
  const connectionContextRef = useRef<ConnectionContext | undefined>(undefined);

  const [address, setAddress] = useState<string | undefined>(
    provider.selectedAddress,
  );

  const [publicProvider, _setPublicProvider] = useState<Provider.Provider>(
    Provider.from(RpcTransport.fromHttp(getPublicRpc('0x1'))),
  );

  // Not ideal but we maintain two sources of truth for chainId. The state
  // values are used to expose values in the UI. The ref values are used by the
  // provider request function so it always uses the latest state regardless of
  // React component rendering lifecycles.
  //
  // Ideally this state moves to the provider like address but we need an
  // upstream change in the MWP SDK to support this, so we maintain this state
  // ourselves for now.
  const [chainId, _setChainId] = useState(provider.chainId);
  const chainIdRef = useRef(provider.chainId);
  const setChainId = useCallback(
    (newChainId: string) => {
      _setPublicProvider(
        Provider.from(RpcTransport.fromHttp(getPublicRpc(newChainId))),
      );
      _setChainId(newChainId);
      chainIdRef.current = newChainId;
      provider.emit('chainChanged', newChainId);
    },
    [_setPublicProvider],
  );

  const [customNetworksString, setCustomNetworksString] = useMMKVString(
    `mwp-provider.custom-networks.${type}`,
  );
  const customNetworkIds = (customNetworksString ?? '').split(',').map(Number);

  const checkIfInstalled = React.useCallback(async () => {
    return protocol ? await Linking.canOpenURL(protocol) : false;
  }, [protocol]);

  const [isInitialized, setIsInitialized] = useState(false);

  const isConnected = React.useMemo(() => {
    return address !== undefined;
  }, [address]);

  const { trackEvent } = useAnalytics();

  const initialize = useCallback((params: WalletConfig) => {
    if (params.type !== 'rainbow' && params.type !== 'coinbase') {
      throw new Error('Invalid wallet type');
    }

    configure({
      callbackURL: new URL('https://farcaster.xyz/wsegue'),
      hostURL: new URL(params.hostUrl),
      hostPackageName: params.hostPackageName,
    });
    setType(params.type);
    setName(params.name);
    setProtocol(params.protocol);
    setIsInitialized(true);
  }, []);

  const connectPromise = useRef<Promise<string> | null>(null);
  const connect = useCallback(() => {
    // Link concurrent calls to an in-progress connect flow.
    if (connectPromise.current === null) {
      connectPromise.current = (async () => {
        try {
          trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
            name,
            action: 'connectWallet_start',
          });
          const accounts = (await provider.request({
            method: 'eth_requestAccounts',
            params: [],
          })) as string[];

          trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
            name,
            action: 'connectWallet_success',
            address: accounts[0],
          });
          setAddress(accounts[0]);

          return accounts[0];
        } catch (e) {
          trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
            name,
            action: 'connectWallet_error',
            error: (e as Error).toString(),
          });
          throw e;
        } finally {
          connectPromise.current = null;
        }
      })();
    }

    return connectPromise.current;
  }, [name, trackEvent]);

  const getAddress = useCallback(
    async (forceConnect = false) => {
      if (!provider.connected || !provider.selectedAddress || forceConnect) {
        return await connect();
      }

      return provider.selectedAddress;
    },
    [connect],
  );

  const withConnectedAddress = useCallback(
    async function <T>(fn: ({ address }: { address: string }) => Promise<T>) {
      if (!(await checkIfInstalled())) {
        return 'wallet-not-installed';
      }

      const executeFn = async (forceConnect = false) => {
        try {
          const addr = await getAddress(forceConnect);
          return fn({ address: addr });
        } catch (e) {
          logInDevOnly(e);
          throw e;
        }
      };

      try {
        return await executeFn();
      } catch (e) {
        // We're in discussion with how the CBW team on how to recognize
        // these errors accurately.
        if (
          e instanceof Error &&
          (e.message.includes('Session not found') ||
            e.message.includes('MWPWalletSDK.MWPWalletSDK.Error error 0.'))
        ) {
          // attempt again but force a connection
          return await executeFn(true);
        }

        throw e;
      }
    },
    [getAddress, checkIfInstalled],
  );

  /**
   * Switch to a chain, adding it in the wallet if it's natively supported
   * and hasn't been added before.
   *
   * Limitation - once we add an unsupported network once we will never
   * attempt to add it again, so if a user removes the network in their
   * wallet app they will have to manually re-add it.
   */
  const switchChain = useCallback(
    async (chainId: number): Promise<ConnectResult> => {
      // If chain ID is a non-supported network
      if (!supportedNetworkIds[type!].includes(chainId)) {
        // And we didn't already add it
        if (!customNetworkIds.includes(chainId)) {
          const walletClient = createViemWalletClient({
            account: assertHex(provider.selectedAddress),
            transport: custom(typedProvider),
          });

          await walletClient.addChain({
            chain: extractWalletChain({ id: chainId as WalletChainId }),
          });

          // Cache detected custom networks locally
          setCustomNetworksString(customNetworkIds.concat([chainId]).join(','));
        }
      }

      setChainId(toHex(chainId));
      return { success: true };
    },
    [customNetworkIds, setChainId, setCustomNetworksString, type],
  );

  const sendTransaction = useCallback(
    async (args: SendTransactionArgs) => {
      try {
        trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
          name,
          action: 'sendTransaction_start',
        });

        return await withConnectedAddress<SendTransactionResult>(
          async ({ address }) => {
            const connected = await switchChain(Number(args.chainId));
            if (!connected.success) {
              return connected;
            }

            const [result] = await makeRequestWalletMobile(
              [
                {
                  method: 'eth_sendTransaction',
                  params: {
                    fromAddress: address,
                    ...args,
                  },
                },
              ],
              {
                chain: 'eth',
                networkId: parseInt(args.chainId!),
                address,
              },
            );

            if (!result.result) {
              if (result.errorCode === 4001) {
                return { success: false, errorReason: 'user_rejected' };
              }

              trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
                name,
                action: 'sendTransaction_failed',
                error: `${result.errorCode}: ${result.errorMessage}`,
              });
              return { success: false, errorReason: 'unknown' };
            }

            const txHash = JSON.parse(result.result);

            setTimeout(async () => {
              try {
                const publicClient = getEthereumClient({
                  chain: extractWalletChain({
                    id: Number(args.chainId) as WalletChainId,
                  }),
                });
                const receipt = await publicClient.waitForTransactionReceipt({
                  hash: txHash,
                });

                if (receipt.status === 'success') {
                  void recordWalletTransaction({
                    params: {
                      ethAddress: address,
                      ethChainId: Number(args.chainId),
                      ethTxHash: txHash,
                      provider: type,
                      attributedDomain: connectionContextRef.current?.domain,
                      metadata: {
                        type: 'request',
                        request: {
                          method: 'eth_sendTransaction',
                          params: {
                            from: address,
                            to: args.toAddress,
                            data: args.data,
                            value: args.weiValue,
                            chainId: args.chainId ?? '',
                          },
                        },
                      },
                    },
                  });
                }
              } catch (e) {
                trackError(e);
              }
            }, 0);

            trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
              name,
              action: 'sendTransaction_success',
            });
            return {
              success: true,
              transactionHash: txHash,
            };
          },
        );
      } catch (e) {
        trackEvent(AnalyticsEvent.CoinbaseWalletEvent, {
          name,
          action: 'sendTransaction_error',
          error: (e as Error).toString(),
        });

        throw e;
      }
    },
    [
      name,
      switchChain,
      withConnectedAddress,
      trackEvent,
      recordWalletTransaction,
      type,
      getEthereumClient,
    ],
  );

  const signTypedDataV4 = useCallback(
    async (chainId: number, typedData: SignTypedDataV4Args) => {
      return await withConnectedAddress<SignatureResult>(
        async ({ address }) => {
          const connected = await switchChain(chainId);
          if (!connected.success) {
            return connected;
          }

          const [, result] = await makeRequestWalletMobile(
            [
              {
                method: 'wallet_switchEthereumChain',
                params: {
                  chainId: chainId.toString(),
                },
              },
              {
                method: 'eth_signTypedData_v4',
                params: { address, typedDataJson: JSON.stringify(typedData) },
              },
            ],
            {
              chain: 'eth',
              networkId: chainId,
              address,
            },
          );

          if (result.errorCode === 4001) {
            return {
              success: false,
              errorReason: 'user_rejected',
            };
          }

          return {
            success: false,
            errorReason: 'unknown',
          };
        },
      );
    },
    [withConnectedAddress, switchChain],
  );

  const personalSign = useCallback(
    async (message: string) => {
      return await withConnectedAddress<SignatureResult>(
        async ({ address }) => {
          const [result] = await makeRequestWalletMobile([
            {
              method: 'personal_sign',
              params: { message, address },
            },
          ]);

          if (result.result) {
            return {
              success: true,
              signature: JSON.parse(result.result),
            };
          }

          if (result.errorCode === 4001) {
            return {
              success: false,
              errorReason: 'user_rejected',
            };
          }

          return {
            success: false,
            errorReason: 'unknown',
          };
        },
      );
    },
    [withConnectedAddress],
  );

  const disconnect = useCallback(async () => {
    provider.disconnect();
  }, []);

  const handleRequest = useCallback(
    async (request: RpcSchema.ExtractRequest<RpcSchema.Default>) => {
      try {
        switch (request.method) {
          case 'eth_requestAccounts': {
            return [await getAddress()];
          }
          case 'eth_chainId': {
            return chainIdRef.current;
          }
          /**
           * MWP supports requesting actions on arbitrary chains rather than
           * the currently connected one so switching chains in the MWP wallet
           * is not necessary.
           *
           * We want to provide a standard Ethereum Provider object that
           * behaves to spec so we keep local chainId so interacting apps can
           * execute a transaction on specific network with
           * wallet_switchEthereumChain followed by eth_sendTransaction without
           * having to open the wallet twice.
           */
          case 'wallet_switchEthereumChain':
            await switchChain(
              fromHex(assertHex(request.params[0].chainId), 'number'),
            );
            return;
          case 'eth_sendTransaction': {
            const chainId = request.params[0].chainId ?? chainIdRef.current;

            // It's not clear that we actually need this or we can just use the provider.
            // The cases to test are CBW x Rainbow x same chain x different chain
            const [result] = await makeRequestWalletMobile(
              [
                {
                  method: 'eth_sendTransaction',
                  params: {
                    fromAddress: request.params[0].from,
                    toAddress: request.params[0].to,
                    // Coinbase Wallet crashes if value is undefined
                    weiValue: request.params[0].value ?? '0x0',
                    data: request.params[0].data,
                    gasPriceInWei: request.params[0].gasPrice,
                    maxFeePerGas: request.params[0].maxFeePerGas,
                    gasLimit: request.params[0].gas,
                    maxPriorityFeePerGas:
                      request.params[0].maxPriorityFeePerGas,
                    // Coinbase Wallet crashes if chainId is not specified
                    chainId,
                  },
                },
              ],
              {
                chain: chainId,
                networkId: hexToNumber(assertHex(chainIdRef.current)),
                address: provider.selectedAddress!,
              },
            );

            if (!result.result) {
              throw getProviderError(result);
            }

            const txHash = JSON.parse(result.result);

            setTimeout(async () => {
              try {
                const publicClient = getEthereumClient({
                  chain: extractWalletChain({
                    id: Number(chainId) as WalletChainId,
                  }),
                });
                const receipt = await publicClient.waitForTransactionReceipt({
                  hash: txHash,
                });

                if (receipt.status === 'success') {
                  void recordWalletTransaction({
                    params: {
                      ethAddress: request.params[0].from as Hex,
                      ethChainId: hexToNumber(assertHex(chainIdRef.current)),
                      ethTxHash: txHash,
                      provider: type,
                      attributedDomain: connectionContextRef.current?.domain,
                      metadata: {
                        type: 'request',
                        request: {
                          method: 'eth_sendTransaction',
                          params: {
                            from: request.params[0].from as string,
                            to: request.params[0].to as string,
                            data: request.params[0].data as string,
                            value: request.params[0].value as string,
                            chainId: chainId,
                          },
                        },
                      },
                    },
                  }).catch((e) => {
                    trackError(e);
                  });
                }
              } catch (e) {
                trackError(e);
              }
            }, 0);

            return txHash;
          }
          case 'eth_signTransaction':
          case 'eth_accounts':
          case 'eth_coinbase':
          case 'personal_sign':
          case 'eth_signTypedData_v4':
          case 'wallet_addEthereumChain':
          case 'wallet_watchAsset':
            return await provider.request(request);
          default:
            return await publicProvider.request(request);
        }
      } catch (e) {
        logInDevOnly(`[MwpProvider] request error:\n${e}`);
        if (e instanceof Error) {
          if (
            e.message.match(
              /(session not found|session expired|missingsymmetrickey)/i,
            )
          ) {
            throw ethErrors.provider.disconnected(e.message);
          }

          if (e.message.match(/(denied|rejected)/i)) {
            throw ethErrors.provider.userRejectedRequest();
          }

          trackError(new Error(`[MwpWalletProvider] request error:\n${e}`));
          throw ethErrors.provider.custom({
            code: 1000,
            message: e.message,
          });
        }

        trackError(new Error(`[MwpWalletProvider] request error:\n${e}`));
        throw e;
      }
    },
    [
      switchChain,
      publicProvider,
      getAddress,
      getEthereumClient,
      recordWalletTransaction,
      type,
    ],
  );

  const wrappedProvider = useMemo<EvmWalletProvider>(() => {
    return {
      on: provider.on.bind(provider),
      removeListener: provider.removeListener.bind(provider),
      async request(request) {
        logInDevOnly('[mwp:request]', request);

        try {
          // @ts-expect-error - hard to generalize typings
          return await handleRequest(request);
        } catch (e) {
          logInDevOnly(`[MwpProvider] handleRequest error:\n${e}`);
          if (e instanceof EthereumProviderError) {
            if (e.code === errorCodes.provider.disconnected) {
              try {
                // automatically attempt to reconnect
                await connect();
              } catch (e) {
                // if we still can't connect, explicitly disconnect the
                // provider so it's internal state is accurate
                provider.disconnect();
                throw e;
              }

              // @ts-expect-error - hard to generalize typings
              return await handleRequest(request);
            }
          }

          throw e;
        }
      },
    };
  }, [connect, handleRequest]);

  const getWalletClient = useCallback<GetWalletClient>(
    async (chain) => {
      const address = await getAddress();

      const c = createViemWalletClient({
        chain,
        account: assertHex(address),
        transport: custom(wrappedProvider),
      });

      await c.switchChain({ id: chain.id });

      return c;
    },
    [getAddress, wrappedProvider],
  );

  useEffect(() => {
    const onConnect: Provider.EventMap['connect'] = ({ chainId }) => {
      setChainId(chainId);
    };

    const onDisconnect: Provider.EventMap['disconnect'] = () => {
      setAddress(undefined);
    };

    const onAccountsChanged: Provider.EventMap['accountsChanged'] = (
      accounts,
    ) => {
      if (accounts.length) {
        setAddress(accounts[0]);
      } else {
        setAddress(undefined);
      }
    };

    typedProvider.on('connect', onConnect);
    typedProvider.on('disconnect', onDisconnect);
    typedProvider.on('accountsChanged', onAccountsChanged);

    return () => {
      typedProvider.removeListener('connect', onConnect);
      typedProvider.removeListener('disconnect', onDisconnect);
      typedProvider.removeListener('accountsChanged', onAccountsChanged);
    };
  }, [setChainId]);

  const contextValue = useMemo(
    () => ({
      type,
      name,
      address: address as `0x${string}` | undefined,
      chainId: chainId ? parseInt(chainId) : undefined,
      isInitialized,
      isConnected,
      provider: wrappedProvider,
      connectionContextRef,
      getWalletClient,
      sendTransaction,
      initialize,
      connect: () => connect().then(() => {}),
      signTypedDataV4,
      personalSign,
      disconnect,
    }),
    [
      type,
      name,
      address,
      chainId,
      isInitialized,
      isConnected,
      wrappedProvider,
      getWalletClient,
      sendTransaction,
      initialize,
      connect,
      signTypedDataV4,
      personalSign,
      disconnect,
    ],
  );

  // Runs once after the initial commit, pairing with the startAction call
  // above to measure actual mount time. Calling stopAction directly in the
  // render body would fire in the same synchronous pass as startAction above,
  // measuring ~0ms.
  useEffect(() => {
    DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
      name: 'MWPWalletProvider',
    });
  }, []);

  return (
    <MWPWalletContext.Provider value={contextValue}>
      {children}
    </MWPWalletContext.Provider>
  );
}
