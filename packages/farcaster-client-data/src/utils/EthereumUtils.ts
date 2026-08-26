import { defineChain, extractChain, Hex, parseGwei } from 'viem';
import {
  abstract,
  arbitrum,
  arbitrumSepolia,
  basePreconf,
  baseSepoliaPreconf,
  bsc,
  celo,
  type Chain,
  degen,
  gnosis,
  mainnet,
  monad,
  monadTestnet,
  optimism,
  optimismSepolia,
  polygon,
  sepolia,
  unichain,
  zora,
} from 'viem/chains';

import { ApiChain } from '../types';
import { RELAY_SOLANA_CHAIN_ID, robinhood } from './ChainUtils';

const base = defineChain({
  ...basePreconf,
  fees: {
    baseFeeMultiplier: 1.5,
    defaultPriorityFee: parseGwei('0.0015'),
  },
});

const hypervem = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HyperEVM',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: {
      name: 'HyperScan',
      url: 'https://www.hyperscan.com/',
      apiUrl: 'https://api.hyperscan.com/api',
    },
  },
  testnet: false,
});

export const ETHER_DECIMALS = 18;

export const GASLESS_CHAINS: ApiChain[] = [
  'ethereum',
  'base',
  'optimism',
  'arbitrum',
  'polygon',
  'bsc',
  'monad',
];

export const explorerAddressUrl = (address: string) =>
  `https://etherscan.io/address/${address}`;

export const formatEthAddress = (address: string) => {
  if (address.startsWith('0x')) {
    address = address.slice(2);
  }
  // We insert a zero-width space between the 0x and the first character to prevent
  // fonts from using contextual alternates when displaying the address.
  // Inter, for example, will render the x differently when the next character is a
  // digit instead of a letter.
  return '0x\u200B' + address.substring(0, 4) + '…' + address.slice(-4);
};

export interface TransactionExplorerByHash {
  type: 'tx';
  chainId: string | number;
  hash: string;
}

export interface TransactionExplorerByAddress {
  type: 'address';
  chainId: string | number;
  address: string;
}
export type TransactionExplorerParams =
  | TransactionExplorerByAddress
  | TransactionExplorerByHash;

export const getTransactionExplorerUrl = (
  params: TransactionExplorerParams,
): string | null => {
  const chainId =
    typeof params.chainId === 'number'
      ? params.chainId.toString()
      : params.chainId;

  let baseUrl: string;

  switch (chainId) {
    case '7777777': // Zora
      baseUrl = 'https://explorer.zora.energy';
      break;
    case '666666666': // Degen
      baseUrl = 'https://explorer.degen.tips';
      break;
    case '8453': // Base Mainnet
      baseUrl = 'https://basescan.org';
      break;
    case '84532': // Base Sepolia
      baseUrl = 'https://sepolia.basescan.org';
      break;
    case '42161': // Arbitrum One
      baseUrl = 'https://arbiscan.io';
      break;
    case '421614': // Arbitrum Sepolia
      baseUrl = 'https://sepolia.arbiscan.io';
      break;
    case '137': // Polygon Mainnet
      baseUrl = 'https://polygonscan.com';
      break;
    case '130': // Unichain
      baseUrl = 'https://unichain.blockscout.com';
      break;
    case '100': // Gnosis
      baseUrl = 'https://gnosisscan.io';
      break;
    case '10': // Optimism Mainnet
      baseUrl = 'https://optimistic.etherscan.io';
      break;
    case '11155420': // Optimism Sepolia
      baseUrl = 'https://sepolia-optimism.etherscan.io';
      break;
    case '11155111': // Ethereum Sepolia
      baseUrl = 'https://sepolia.etherscan.io';
      break;
    case monadTestnet.id.toString(): // Monad Testnet
      baseUrl = 'https://testnet.monadexplorer.com';
      break;
    case monad.id.toString(): // Monad
      baseUrl = 'https://monadexplorer.com';
      break;
    case RELAY_SOLANA_CHAIN_ID.toString(): // Solana
      baseUrl = 'https://solscan.io';
      break;
    case celo.id.toString(): // Celo
      baseUrl = 'https://celoscan.io';
      break;
    case hypervem.id.toString(): // Hyperevm
      baseUrl = 'https://hyperscan.com';
      break;
    case bsc.id.toString(): // BSC
      baseUrl = 'https://bscscan.com';
      break;
    case robinhood.id.toString(): // Robinhood
      baseUrl = 'https://robinhoodchain.blockscout.com';
      break;
    case '1': // Ethereum Mainnet
    default: // Default to Etherscan for Ethereum Mainnet or unknown chain IDs
      baseUrl = 'https://etherscan.io';
      break;
  }

  if (params.type === 'tx' && params.hash) {
    return `${baseUrl}/tx/${params.hash}`;
  } else if (params.type === 'address' && params.address) {
    return `${baseUrl}/address/${params.address}`;
  }
  return null;
};

export const apiChainDisplayName = (chain: ApiChain | string): string => {
  switch (chain) {
    case 'arbitrum':
      return 'Arbitrum';
    case 'arbitrum-sepolia':
      return 'Arbitrum Sepolia';
    case 'base':
      return 'Base';
    case 'base-sepolia':
      return 'Base Sepolia';
    case 'degen':
      return 'Degen';
    case 'gnosis':
      return 'Gnosis';
    case 'optimism':
      return 'Optimism';
    case 'polygon':
      return 'Polygon';
    case 'zora':
      return 'Zora';
    case 'unichain':
      return 'Unichain';
    case 'monad':
      return 'Monad';
    case 'monad-testnet':
      return 'Monad Testnet';
    case 'celo':
      return 'Celo';
    case 'sepolia':
      return 'Sepolia';
    case 'ethereum':
      return 'Ethereum';
    case 'solana':
      return 'Solana';
    case 'hyperevm':
      return 'HyperEVM';
    case 'bsc':
      return 'BSC';
    case 'abstract':
      return 'Abstract';
    case 'robinhood':
      return 'Robinhood';
    default:
      return 'Unknown';
  }
};

export const chainIdToChain = (chainId: string): ApiChain | undefined => {
  switch (chainId) {
    case '7777777':
      return 'zora';
    case '666666666':
      return 'degen';
    case '8453':
      return 'base';
    case '84532':
      return 'base-sepolia';
    case '42161':
      return 'arbitrum';
    case '130':
      return 'unichain';
    case '143':
      return 'monad';
    case '10143':
      return 'monad-testnet';
    case '137':
      return 'polygon';
    case '100':
      return 'gnosis';
    case '10':
      return 'optimism';
    case '42220':
      return 'celo';
    case '1':
      return 'ethereum';
    case RELAY_SOLANA_CHAIN_ID.toString():
      return 'solana';
    case '999':
      return 'hyperevm';
    case '56':
      return 'bsc';
    case '4663':
      return 'robinhood';
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unknown chainId encountered: ${chainId}`);
      return undefined;
  }
};

/**
 * Converts a chain ID to an ApiChain type, throwing an error if the chain ID is unknown.
 * Use this when you are sure the chain ID is valid and want to handle unknown chains as errors.
 * @param chainId The chain ID to convert
 * @returns The corresponding ApiChain
 * @throws Error if the chain ID is unknown
 */
export const chainIdToChainOrThrow = (chainId: string): ApiChain => {
  const chain = chainIdToChain(chainId);
  if (!chain) {
    throw new Error(`Unknown chainId ${chainId}`);
  }
  return chain;
};

export const prettyChainName = (chainId: string): string =>
  apiChainDisplayName(chainIdToChainOrThrow(chainId));

const apiChainViemChainMap = {
  arbitrum: arbitrum,
  abstract: abstract,
  base,
  'base-sepolia': baseSepoliaPreconf,
  degen: degen,
  gnosis: gnosis,
  optimism: optimism,
  polygon: polygon,
  zora: zora,
  unichain: unichain,
  monad: monad,
  'monad-testnet': monadTestnet,
  celo: celo,
  ethereum: mainnet,
  hyperevm: hypervem,
  bsc: bsc,
  robinhood,

  // ugly hack
  solana: mainnet,
} satisfies Record<ApiChain, Chain>;

export type ApiChainViemChainMap = typeof apiChainViemChainMap;

/**
 * Returns the viem chain for the given api chain.
 * Use this when you are sure the client is aware of the chain.
 * @param apiChain The api chain to get the viem chain for.
 * @returns The viem chain for the given api chain.
 */
export const apiChainToViemChainOrThrow = <
  apiChain extends ApiChain = ApiChain,
>(
  apiChain: apiChain,
): ApiChainViemChainMap[apiChain] => {
  const viemChain = apiChainToViemChain(apiChain);
  if (viemChain) {
    return viemChain;
  }

  throw new Error(`No chain setup for ${apiChain}`);
};

/**
 * Returns the viem chain for the given api chain.
 * Use this when there is a chance the client is not aware of the chain (example: API calls, external intents, deep links).
 * @param apiChain The api chain to get the viem chain for.
 * @returns The viem chain for the given api chain.
 */
export const apiChainToViemChain = <apiChain extends ApiChain = ApiChain>(
  apiChain: apiChain,
): ApiChainViemChainMap[apiChain] | undefined => {
  const viemChain = apiChainViemChainMap[apiChain];
  if (!viemChain) {
    // eslint-disable-next-line no-console
    console.warn(`No viem chain setup for API chain: ${apiChain}`);
  }
  return viemChain;
};

export const WALLET_CHAINS = [
  base,
  baseSepoliaPreconf,
  mainnet,
  arbitrum,
  arbitrumSepolia,
  degen,
  gnosis,
  optimism,
  optimismSepolia,
  polygon,
  sepolia,
  zora,
  unichain,
  monad,
  monadTestnet,
  celo,
  hypervem,
  bsc,
  robinhood,
] as const;

export type WalletChains = typeof WALLET_CHAINS;

export const WALLET_CHAIN_IDS = WALLET_CHAINS.map((c) => c.id);
export type WalletChainId = (typeof WALLET_CHAIN_IDS)[number];

export const OP_STACK_CHAINS = [base, optimism, zora, unichain] as const;

export const OP_STACK_CHAIN_IDS = OP_STACK_CHAINS.map((c) => c.id);
export type OpStackChainIds = (typeof OP_STACK_CHAIN_IDS)[number];

export const isOpStack = (chainId: number) => {
  return (OP_STACK_CHAIN_IDS as number[]).includes(chainId);
};

export const extractWalletChain = <chainId extends WalletChains[number]['id']>({
  id,
}: {
  id: chainId;
}) =>
  extractChain<typeof WALLET_CHAINS, chainId>({
    chains: WALLET_CHAINS,
    id,
  });

/**
 * Converts an ApiChain to a chain ID string, throwing an error if the chain is unknown.
 * Use this when you are sure the ApiChain is valid and want to handle unknown chains as errors.
 * @param chain The ApiChain to convert
 * @returns The corresponding chain ID as a string
 * @throws Error if the ApiChain is unknown
 */
export const apiChainToChainIdOrThrow = (chain: ApiChain): string => {
  const chainId = apiChainToChainId(chain);
  if (!chainId) {
    throw new Error(`Unknown chain ${chain}`);
  }
  return chainId;
};

export const apiChainToChainId = (chain: ApiChain): string | undefined => {
  switch (chain) {
    case 'zora':
      return '7777777';
    case 'degen':
      return '666666666';
    case 'base':
      return '8453';
    case 'base-sepolia':
      return '84532';
    case 'arbitrum':
      return '42161';
    case 'polygon':
      return '137';
    case 'gnosis':
      return '100';
    case 'optimism':
      return '10';
    case 'unichain':
      return '130';
    case 'monad':
      return '143';
    case 'monad-testnet':
      return '10143';
    case 'celo':
      return '42220';
    case 'ethereum':
      return '1';
    case 'solana':
      return RELAY_SOLANA_CHAIN_ID.toString();
    case 'hyperevm':
      return '999';
    case 'bsc':
      return '56';
    case 'robinhood':
      return '4663';
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unknown API chain encountered: ${chain}`);
      return undefined;
  }
};

export function buildTenderlySimulationUrl({
  blockNumber,
  to,
  data,
  from,
  chainId,
}: {
  blockNumber?: string;
  to?: Hex;
  data?: Hex;
  from?: Hex;
  chainId?: number;
}): string {
  const url = new URL(
    'https://dashboard.tenderly.co/ORG/project/simulator/new',
  );
  if (blockNumber) url.searchParams.append('block', blockNumber.toString());
  if (from) url.searchParams.append('from', from);
  if (to) url.searchParams.append('contractAddress', to);
  if (data) url.searchParams.append('rawFunctionInput', data);
  if (chainId) url.searchParams.append('network', chainId.toString());

  return url.href;
}

export function getWaitForTransactionReceiptTimeoutForChain(chain: ApiChain) {
  switch (chain) {
    case 'ethereum':
      return 180_000;
    default:
      return 30_000;
  }
}
