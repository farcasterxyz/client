import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { EvmPreviewRequest } from '../../types';
import {
  EmbeddedWalletContextType,
  EmbeddedWalletProvider,
  useEmbeddedWallet,
} from '../EmbeddedWalletContext';

jest.mock('farcaster-client-hooks', () => ({
  sleep: jest.fn(() => Promise.resolve()),
  useRecordWalletTransaction: jest.fn(() => jest.fn(() => Promise.resolve())),
  useOnboardingStateWithoutFallback: jest.fn(() => ({
    data: { result: { state: { user: { fid: 123 } } } },
  })),
  useCachedOnboardingState: jest.fn(() => ({
    result: { state: { user: { fid: 123 } } },
  })),
  useFeatureFlag: jest.fn(() => false),
  useEmbeddedWalletsQuery: jest.fn(() => ({ data: undefined })),
}));

jest.mock('../PublicClientProvider', () => ({
  usePublicClient: jest.fn(() => ({
    getEthereumClient: jest.fn(() => ({
      waitForTransactionReceipt: jest.fn(() =>
        Promise.resolve({ status: 'success' }),
      ),
    })),
  })),
}));

jest.mock('../WalletTransactionsProvider', () => ({
  WalletTransactionsProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('../../hooks/useWalletPendingTransactions', () => ({
  useWalletPendingTransactions: jest.fn(() => ({
    addPendingTransaction: jest.fn(),
    removePendingTransaction: jest.fn(),
    pendingTransactions: [],
    getPendingTransaction: jest.fn(),
  })),
}));

jest.mock('../../utils', () => ({
  parseSendCalls: jest.fn(() => ({})),
}));

jest.mock('../../utils/SolanaUtils', () => ({
  createSolanaWalletProviderWithConn: jest.fn((request) => ({ request })),
  waitForSolanaTransaction: jest.fn(() =>
    Promise.resolve({ status: 'processed' }),
  ),
}));

const EVM_ADDRESS = '0xcA1269d161647Bd461546a7e7C19A16Df5179446';
const BATCH_ID = '0xabc123';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function makeWalletSendCallsRequest() {
  return {
    method: 'wallet_sendCalls',
    params: [
      {
        id: BATCH_ID,
        chainId: '0x2105',
        from: EVM_ADDRESS,
        atomicRequired: false,
        calls: [
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            data: '0x',
          },
        ],
      },
    ],
  } as never;
}

function makeProviderValue(evmProviderRequest: jest.Mock) {
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    isReady: true,
    isInitializing: false,
    isConnected: true,
    getConnectionContext: jest.fn(() => ({ domain: 'example.com' })),
    connectionContextRef: { current: { domain: 'example.com' } },
    evmAddress: EVM_ADDRESS,
    evmProvider: {
      request: evmProviderRequest,
      on: jest.fn(),
      removeListener: jest.fn(),
    },
    getWalletClient: jest.fn(),
    miniAppEvmAddress: EVM_ADDRESS,
    solanaAddress: 'solana-address',
    solanaProvider: {
      request: jest.fn(),
      signMessage: jest.fn(),
      signTransaction: jest.fn(),
      signAndSendTransaction: jest.fn(),
    },
    applyLimitedFunctionality: false,
    swapAggregation: false,
    handlePayForProWithIAP: jest.fn(),
  } as unknown as React.ComponentProps<typeof EmbeddedWalletProvider>['value'];
}

function getEvmPreviewRequest(
  wallet: EmbeddedWalletContextType,
): EvmPreviewRequest<'wallet_sendCalls'> {
  const { previewRequest } = wallet;
  if (!previewRequest || previewRequest.protocol !== 'evm') {
    throw new Error('Expected EVM preview request');
  }

  return previewRequest.evmPreviewRequest as EvmPreviewRequest<'wallet_sendCalls'>;
}

describe('EmbeddedWalletProvider wallet_sendCalls', () => {
  it('rejects and cleans up an in-flight approval before the batch id settles', async () => {
    let wallet: EmbeddedWalletContextType | undefined;
    const getTransactionCount = deferred<string>();
    const evmProviderRequest = jest.fn((request) => {
      if (request.method === 'eth_getTransactionCount') {
        return getTransactionCount.promise;
      }
      if (request.method === 'eth_sendTransaction') {
        return Promise.resolve('0xtxhash');
      }
      if (request.method === 'eth_getTransactionReceipt') {
        return Promise.resolve({
          logs: [],
          status: '0x1',
          blockHash: '0x1',
          blockNumber: '0x1',
          gasUsed: '0x1',
          transactionHash: '0xtxhash',
        });
      }
      return Promise.resolve('0x2105');
    });

    function CaptureWallet() {
      wallet = useEmbeddedWallet();
      return null;
    }

    render(
      <EmbeddedWalletProvider value={makeProviderValue(evmProviderRequest)}>
        <CaptureWallet />
      </EmbeddedWalletProvider>,
    );

    const firstRequest = wallet!.evmMiniAppProvider.request(
      makeWalletSendCallsRequest(),
    );

    await waitFor(() => expect(wallet?.previewRequest).toBeDefined());

    await act(async () => {
      const approvePromise = getEvmPreviewRequest(wallet!).approve();
      wallet!.clearPreviewRequests();
      await expect(firstRequest).rejects.toThrow();
      getTransactionCount.resolve('0x1');
      await approvePromise.catch(() => undefined);
    });

    await waitFor(() => expect(wallet?.previewRequest).toBeUndefined());

    const secondRequest = wallet!.evmMiniAppProvider.request(
      makeWalletSendCallsRequest(),
    );

    await waitFor(() => expect(wallet?.previewRequest).toBeDefined());

    await act(async () => {
      await getEvmPreviewRequest(wallet!).approve();
    });

    await expect(secondRequest).resolves.toEqual({
      id: BATCH_ID,
      capabilities: {},
    });
  });
});
