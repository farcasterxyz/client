import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  Chain,
  createPublicClient,
  http,
  HttpTransport,
  PublicClient,
} from 'viem';
import { PublicActionsL2, publicActionsL2 } from 'viem/op-stack';

import { baseApiUrl } from '../constants/Api';

type GetTransport = ({ chainId }: { chainId: number }) => HttpTransport;

type GetPublicClient = <chain extends Chain = Chain>({
  chain,
}: {
  chain: chain;
}) => PublicClient<HttpTransport, chain>;

type GetL2PublicClient = <chain extends Chain = Chain>({
  chain,
}: {
  chain: chain;
}) => PublicClient<HttpTransport, chain> & PublicActionsL2<chain>;

type PublicClientContextValue = {
  getEthereumTransport: GetTransport;
  getEthereumClient: GetPublicClient;
  getL2EthereumClient: GetL2PublicClient;
};

const PublicClientContext = createContext<PublicClientContextValue>({
  getEthereumTransport: () => {
    throw new Error(
      'getEthereumTransport not available outside of PublicClientProvider',
    );
  },
  getEthereumClient: () => {
    throw new Error(
      'getEthereumClient not available outside of PublicClientProvider',
    );
  },
  getL2EthereumClient: () => {
    throw new Error(
      'getL2EthereumClient not available outside of PublicClientProvider',
    );
  },
});

export const usePublicClient = () => useContext(PublicClientContext);

export function PublicClientProvider({ children }: { children: ReactNode }) {
  // TODO cache so transports are shared
  const getEthereumTransport = useCallback<GetTransport>(({ chainId }) => {
    return http(`${baseApiUrl}/${chainId}/eth-rpc`);
  }, []);

  // TODO cache so public clients are shared
  const getEthereumClient = useCallback<GetPublicClient>(
    ({ chain }) => {
      const transport = getEthereumTransport({ chainId: chain.id });

      const publicClient = createPublicClient({
        chain,
        transport,
      });

      return publicClient;
    },
    [getEthereumTransport],
  );

  // TODO cache so public clients are shared
  const getL2EthereumClient = useCallback<GetL2PublicClient>(
    ({ chain }) => {
      const transport = getEthereumTransport({ chainId: chain.id });

      const publicClient = createPublicClient({
        chain,
        transport,
      }).extend(publicActionsL2());

      return publicClient;
    },
    [getEthereumTransport],
  );

  const contextValue = useMemo(() => {
    return {
      getEthereumTransport,
      getEthereumClient,
      getL2EthereumClient,
    };
  }, [getEthereumTransport, getEthereumClient, getL2EthereumClient]);

  return (
    <PublicClientContext.Provider value={contextValue}>
      {children}
    </PublicClientContext.Provider>
  );
}
