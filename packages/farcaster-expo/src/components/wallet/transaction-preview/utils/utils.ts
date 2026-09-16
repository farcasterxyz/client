import * as Clipboard from 'expo-clipboard';
import {
  ApiChain,
  apiChainToChainId,
  ApiWalletAssetMetadata,
  chainIdToChain,
} from 'farcaster-client-data';
import { useCallback } from 'react';
import { useToast } from 'react-native-toast-notifications';

/**
 * Gets a display symbol from an asset metadata object
 */
export const getAssetMetadataSymbol = (
  assetMetadata: ApiWalletAssetMetadata,
  quantity = 0,
): string => {
  let symbol = 'ETH';
  switch (assetMetadata.assetType) {
    case 'NATIVE':
      if (assetMetadata.chain === 'degen') {
        symbol = 'DEGEN';
      } else if (assetMetadata.symbol) {
        symbol = assetMetadata.symbol;
      }
      break;
    case 'NFT':
      if (quantity > 1) {
        symbol = 'NFTs';
      } else if (assetMetadata.name) {
        symbol =
          assetMetadata.name.length > 10
            ? assetMetadata.name.slice(0, 10) + '...'
            : assetMetadata.name;
      } else {
        symbol = 'NFT';
      }
      break;
    case 'OTHER':
    case 'TOKEN':
    default:
      symbol = !assetMetadata.symbol
        ? '???'
        : assetMetadata.symbol.length > 10
          ? assetMetadata.symbol.slice(0, 10) + '...'
          : assetMetadata.symbol;
      break;
  }
  return symbol;
};

/**
 * Hook for copying an address to clipboard with toast notification
 */
export const useCopyAddress = () => {
  const toast = useToast();
  return useCallback(
    async (address: string) => {
      await Clipboard.setStringAsync(address);
      toast.show('Copied address to clipboard.', { placement: 'top' });
    },
    [toast],
  );
};

const chainNameMap: Record<ApiChain, string> = {
  ethereum: 'Ethereum',
  zora: 'Zora',
  base: 'Base',
  optimism: 'Optimism',
  unichain: 'Unichain',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  'monad-testnet': 'Monad',
  monad: 'Monad',
  celo: 'Celo',
  solana: 'Solana',
  degen: 'Degen',
  'base-sepolia': 'Base Sepolia',
  gnosis: 'Gnosis',
  abstract: 'Abstract',
  hyperevm: 'HyperEVM',
  bsc: 'BSC',
  robinhood: 'Robinhood',
};

export const getChainNameFromChain = (chain: ApiChain | undefined): string => {
  if (!chain) {
    return 'Unknown Network';
  }
  return chainNameMap[chain] ?? chain;
};

export const getChainFromEvmChainId = (
  chainId: number,
): ApiChain | undefined => {
  return chainIdToChain(chainId.toString());
};

export const getEvmChainId = (chain: ApiChain): number | undefined => {
  const evmChainId = apiChainToChainId(chain);
  if (evmChainId) {
    return Number(evmChainId);
  }
  return undefined;
};
