import { defineChain, zeroAddress } from 'viem';
import {
  abstract,
  arbitrum,
  base,
  baseSepolia,
  bsc,
  celo,
  Chain as ViemChain,
  degen,
  gnosis,
  mainnet,
  monad,
  monadTestnet,
  optimism,
  polygon,
  unichain,
  zora,
} from 'viem/chains';

import { ApiChain, ApiTokenLinkFeatures } from '../types';

export const EIP7528_NATIVE_ASSET_ADDRESS =
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const SUPERCHAIN_WRAPPED_NATIVE_ASSET_ADDRESS =
  '0x4200000000000000000000000000000000000006';
export const SOLANA_NATIVE_ASSET_ADDRESS = '11111111111111111111111111111111';
export const WRAPPED_SOLANA_ASSET_ADDRESS =
  'So11111111111111111111111111111111111111112';
export const SOLANA_USDC_ADDRESS =
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const WRAPPED_HYPE_ASSET_ADDRESS =
  '0x5555555555555555555555555555555555555555';
export const WRAPPED_XDAI_ASSET_ADDRESS =
  '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d';
export const WRAPPED_BNB_ASSET_ADDRESS =
  '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

export const hyperevm = defineChain({
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

export const robinhood = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
  testnet: false,
});

// Zerion network type indicating whether to use production or testnet endpoints
export type ZerionNetwork = 'production' | 'testnet';
export const TESTNET_DEFAULT_GAS_ESTIMATION = 1_000_000;

// Relay uses 792703809 for Solana
// We put this here to simplify conditionals in other services
export const RELAY_SOLANA_CHAIN_ID = 792703809;

// Chain type categories
export type ChainType = 'mainnet' | 'testnet';

// Features supported by each chain
export type ChainFeatures = {
  enabled: boolean;
  opStack?: boolean;
  beta?: boolean;
  simulateV1?: boolean;
  evmLogParsing?: boolean;
};

// External service identifiers and integrations
export type ChainIntegrations = {
  zerionId?: string;
  dexScreenerId?: string;
  blockaidId?: string;
  coingeckoId?: string;
  duneId?: string;
  openseaId?: string;
  transactionExplorerUrl?: string;
  backendTransactions?: boolean;
  relaySupport?: boolean;
  zeroEx?: {
    permit2?: boolean;
    gasless?: boolean;
  };
};

// Chain class definition
export class Chain {
  public readonly viemChain?: ViemChain;

  // Features and external integrations
  public readonly features: ChainFeatures;
  public readonly integrations: ChainIntegrations;

  public readonly nativeAssetAddress: string;
  public readonly wrappedNativeAssetAddress: string;
  public readonly usdcAddress: string | undefined;

  public isEthRpcProxyEnabled(): boolean {
    return (
      this.features.enabled &&
      this.namespace === 'eip155' &&
      this.viemChain !== undefined
    );
  }

  public isZeroExSupported(): boolean {
    return this.integrations.zeroEx?.permit2 === true;
  }

  public getEnsuredViemChain(): ViemChain {
    if (!this.viemChain) {
      throw new Error(`Chain ${this.id} has no viemChain`);
    }
    return this.viemChain;
  }

  public getProtocol(): number {
    switch (this.namespace) {
      case 'eip155':
        return 0;
      case 'solana':
        return 1;
      default:
        throw new Error(`Unsupported chain namespace: ${this.namespace}`);
    }
  }

  public getEnsuredChainId(): number {
    if (this.id === 'solana') {
      return RELAY_SOLANA_CHAIN_ID;
    }
    return this.getEnsuredViemChain().id;
  }

  public canTrade(): boolean {
    return this.isZeroExSupported() || this.integrations.relaySupport === true;
  }

  get chainId(): number | undefined {
    if (this.id === 'solana') {
      return RELAY_SOLANA_CHAIN_ID;
    }

    return this.viemChain?.id;
  }

  getFeatures(): ApiTokenLinkFeatures {
    return {
      canTrade: this.canTrade(),
      isTestnet: this.type === 'testnet',
    };
  }

  constructor(
    public readonly id: ApiChain,
    public readonly type: ChainType,
    public readonly namespace: 'eip155' | 'solana',
    options: {
      nativeAssetAddress: string;
      wrappedNativeAssetAddress: string;
      usdcAddress?: string;
      viemChain?: ViemChain;
      features?: Partial<ChainFeatures>;
      integrations?: ChainIntegrations;
    },
  ) {
    // Validate required fields
    if (namespace === 'eip155' && !options.viemChain) {
      throw new Error(`EIP155 chain must have a viemChain`);
    }

    // Validate 0x integrations
    if (
      options.integrations?.zeroEx?.gasless === true &&
      options.integrations?.zeroEx?.permit2 !== true
    ) {
      throw new Error(
        `Chain ${id} most likely would have both gasless and permit2 enabled. If this is intentional, please update this error`,
      );
    }

    // Initialize properties
    this.namespace = namespace;
    this.viemChain = options.viemChain;
    this.features = {
      enabled: false, // Default to disabled
      ...options.features,
    };
    this.integrations = options.integrations || {};
    this.nativeAssetAddress = options.nativeAssetAddress;
    this.wrappedNativeAssetAddress = options.wrappedNativeAssetAddress;
    this.usdcAddress = options.usdcAddress;
  }
}

export const CHAINS: Record<ApiChain, Chain> = {
  // Mainnets
  ethereum: new Chain('ethereum', 'mainnet', 'eip155', {
    viemChain: mainnet,
    features: {
      enabled: true,
      simulateV1: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'ethereum',
      dexScreenerId: 'ethereum',
      blockaidId: 'ethereum',
      coingeckoId: 'eth',
      duneId: 'ethereum',
      openseaId: 'ethereum',
      transactionExplorerUrl: 'https://etherscan.io/tx/',
      relaySupport: true,
      zeroEx: {
        permit2: true,
        gasless: true,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  }),

  base: new Chain('base', 'mainnet', 'eip155', {
    viemChain: base,
    features: {
      enabled: true,
      opStack: true,
      simulateV1: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'base',
      dexScreenerId: 'base',

      blockaidId: 'base',
      coingeckoId: 'base',
      duneId: 'base',
      openseaId: 'base',
      transactionExplorerUrl: 'https://basescan.org/tx/',
      backendTransactions: true,
      relaySupport: true,
      zeroEx: {
        permit2: true,
        gasless: true,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: SUPERCHAIN_WRAPPED_NATIVE_ASSET_ADDRESS,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  }),

  optimism: new Chain('optimism', 'mainnet', 'eip155', {
    viemChain: optimism,
    features: {
      enabled: true,
      opStack: true,
      simulateV1: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'optimism',
      dexScreenerId: 'optimism',
      blockaidId: 'optimism',
      coingeckoId: 'optimism',
      duneId: 'optimism',
      openseaId: 'optimism',
      transactionExplorerUrl: 'https://optimistic.etherscan.io/tx/',
      backendTransactions: true,
      relaySupport: true,
      zeroEx: {
        permit2: true,
        gasless: true,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: SUPERCHAIN_WRAPPED_NATIVE_ASSET_ADDRESS,
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  }),

  arbitrum: new Chain('arbitrum', 'mainnet', 'eip155', {
    viemChain: arbitrum,
    features: {
      enabled: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'arbitrum',
      dexScreenerId: 'arbitrum',
      blockaidId: 'arbitrum',
      coingeckoId: 'arbitrum',
      duneId: 'arbitrum',
      openseaId: 'arbitrum',
      transactionExplorerUrl: 'https://arbiscan.io/tx/',
      relaySupport: true,
      zeroEx: {
        permit2: true,
        gasless: true,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  }),

  polygon: new Chain('polygon', 'mainnet', 'eip155', {
    viemChain: polygon,
    features: {
      enabled: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'polygon',
      dexScreenerId: 'polygon',
      blockaidId: 'polygon',
      coingeckoId: 'polygon_pos',
      duneId: 'polygon',
      openseaId: 'polygon',
      transactionExplorerUrl: 'https://polygonscan.com/tx/',
      relaySupport: true,
      zeroEx: {
        permit2: true,
        gasless: true,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  }),

  degen: new Chain('degen', 'mainnet', 'eip155', {
    viemChain: degen,
    features: {
      enabled: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'degen',
      dexScreenerId: 'degenchain',
      blockaidId: 'degen',
      coingeckoId: 'degenchain',
      duneId: 'degen',
      transactionExplorerUrl: 'https://explorer.degen.tips/tx/',
      relaySupport: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x0c3544B0b78a0eeA3Bb4ca3774b72055a66e4ee5',
  }),

  gnosis: new Chain('gnosis', 'mainnet', 'eip155', {
    viemChain: gnosis,
    features: {
      enabled: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'xdai',
      dexScreenerId: 'gnosischain',
      coingeckoId: 'xdai',
      duneId: 'gnosis',
      transactionExplorerUrl: 'https://gnosisscan.io/tx/',
      blockaidId: 'gnosis',
      relaySupport: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    usdcAddress: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
  }),

  solana: new Chain('solana', 'mainnet', 'solana', {
    features: {
      enabled: true,
      evmLogParsing: false,
    },
    integrations: {
      dexScreenerId: 'solana',
      blockaidId: 'solana',
      coingeckoId: 'solana',
      duneId: 'solana',
      openseaId: 'solana',
      transactionExplorerUrl: 'https://solscan.io/tx/',
      relaySupport: true,
    },
    nativeAssetAddress: SOLANA_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: WRAPPED_SOLANA_ASSET_ADDRESS,
    usdcAddress: SOLANA_USDC_ADDRESS,
  }),

  abstract: new Chain('abstract', 'mainnet', 'eip155', {
    viemChain: abstract,
    features: {
      enabled: false,
      evmLogParsing: false,
    },
    integrations: {
      zerionId: 'abstract',
      dexScreenerId: 'abstract',
      coingeckoId: 'abstract',
      duneId: 'abstract',
      relaySupport: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x3439153eb7af838ad19d56e1571fbd09333c2809',
  }),

  monad: new Chain('monad', 'mainnet', 'eip155', {
    viemChain: monad,
    features: {
      enabled: true,
      beta: true,
      evmLogParsing: false,
    },
    integrations: {
      duneId: 'monad',
      transactionExplorerUrl: 'https://monadexplorer.com/tx/',
      zeroEx: {
        permit2: true,
        gasless: false,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x3bd359c1119da7da1d913d1c4d2b7c461115433a',
    usdcAddress: '0x754704bc059f8c67012fed69bc8a327a5aafb603',
  }),

  zora: new Chain('zora', 'mainnet', 'eip155', {
    viemChain: zora,
    features: {
      enabled: true,
      opStack: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'zora',
      dexScreenerId: 'zora',
      blockaidId: 'zora',
      coingeckoId: 'zora-network',
      duneId: 'zora',
      openseaId: 'zora',
      transactionExplorerUrl: 'https://explorer.zora.energy/tx/',
      backendTransactions: true,
      relaySupport: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: SUPERCHAIN_WRAPPED_NATIVE_ASSET_ADDRESS,
  }),

  unichain: new Chain('unichain', 'mainnet', 'eip155', {
    viemChain: unichain,
    features: {
      enabled: true,
      opStack: true,
      evmLogParsing: true,
    },
    integrations: {
      zerionId: 'unichain',
      blockaidId: 'unichain',
      dexScreenerId: 'unichain',
      coingeckoId: 'unichain',
      duneId: 'unichain',
      openseaId: 'unichain',
      transactionExplorerUrl: 'https://unichain.blockscout.com/tx/',
      relaySupport: true,
      zeroEx: {
        permit2: true,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: SUPERCHAIN_WRAPPED_NATIVE_ASSET_ADDRESS,
    usdcAddress: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
  }),

  celo: new Chain('celo', 'mainnet', 'eip155', {
    viemChain: celo,
    features: {
      enabled: true,
      opStack: true,
      evmLogParsing: false,
      simulateV1: true,
    },
    integrations: {
      backendTransactions: true,
      zerionId: 'celo',
      dexScreenerId: 'celo',
      coingeckoId: 'celo',
      duneId: 'celo',
      openseaId: 'celo',
      transactionExplorerUrl: 'https://celoscan.io/tx/',
      relaySupport: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    usdcAddress: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  }),

  hyperevm: new Chain('hyperevm', 'mainnet', 'eip155', {
    viemChain: hyperevm,
    features: {
      enabled: true,
      beta: true,
      opStack: false,
      evmLogParsing: false,
    },
    integrations: {
      backendTransactions: false,
      coingeckoId: 'hyperevm',
      duneId: 'hyper_evm',
      transactionExplorerUrl: 'https://www.hyperscan.com/tx/',
      relaySupport: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: WRAPPED_HYPE_ASSET_ADDRESS,
  }),

  bsc: new Chain('bsc', 'mainnet', 'eip155', {
    viemChain: bsc,
    features: {
      enabled: true,
      beta: true,
      opStack: false,
      evmLogParsing: false,
    },
    integrations: {
      backendTransactions: false,
      blockaidId: 'bsc',
      coingeckoId: 'bsc',
      duneId: 'bnb',
      transactionExplorerUrl: 'https://bscscan.com/tx/',
      relaySupport: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: WRAPPED_BNB_ASSET_ADDRESS,
    usdcAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  }),

  robinhood: new Chain('robinhood', 'mainnet', 'eip155', {
    viemChain: robinhood,
    features: {
      enabled: true,
      beta: true,
      opStack: false,
      evmLogParsing: false,
    },
    integrations: {
      backendTransactions: false,
      coingeckoId: 'robinhood',
      transactionExplorerUrl: 'https://robinhoodchain.blockscout.com/tx/',
      relaySupport: true,
      zeroEx: {
        permit2: true,
      },
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x0bd7d308f8e1639fab988df18a8011f41eacad73',
  }),

  // Testnets
  'monad-testnet': new Chain('monad-testnet', 'testnet', 'eip155', {
    viemChain: monadTestnet,
    features: {
      enabled: true,
      evmLogParsing: false,
    },
    integrations: {
      zerionId: 'monad-test-v2',
      coingeckoId: 'monad-testnet',
      duneId: 'monad_testnet',
      transactionExplorerUrl: 'https://testnet.monadexplorer.com/tx/',
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  }),

  'base-sepolia': new Chain('base-sepolia', 'testnet', 'eip155', {
    viemChain: baseSepolia,
    features: {
      opStack: true,
      enabled: true,
      evmLogParsing: true,
    },
    integrations: {
      duneId: 'base_sepolia',
      transactionExplorerUrl: 'https://sepolia.basescan.org/tx/',
      backendTransactions: true,
    },
    nativeAssetAddress: EIP7528_NATIVE_ASSET_ADDRESS,
    wrappedNativeAssetAddress: SUPERCHAIN_WRAPPED_NATIVE_ASSET_ADDRESS,
  }),
};

// Lookup helpers
const CHAINS_BY_CHAIN_ID: Record<string, Chain & { id: ApiChain }> =
  Object.fromEntries(
    Object.entries(CHAINS)
      .filter(([_, chain]) => chain.namespace === 'eip155')
      .map(([_, chain]) => [chain.getEnsuredChainId(), chain]),
  );

const CHAINS_BY_PROD_ZERION_ID: Record<string, Chain & { id: ApiChain }> =
  Object.fromEntries(
    Object.entries(CHAINS)
      .filter(
        ([_, chain]) => chain.type === 'mainnet' && chain.integrations.zerionId,
      )
      .map(([_, chain]) => [chain.integrations.zerionId, chain]),
  );

const CHAINS_BY_TESTNET_ZERION_ID: Record<string, Chain & { id: ApiChain }> =
  Object.fromEntries(
    Object.entries(CHAINS)
      .filter(
        ([_, chain]) => chain.type === 'testnet' && chain.integrations.zerionId,
      )
      .map(([_, chain]) => [chain.integrations.zerionId, chain]),
  );

const CHAINS_BY_DEXSCREENER_ID: Record<string, Chain & { id: ApiChain }> =
  Object.fromEntries(
    Object.entries(CHAINS)
      .filter(([_, chain]) => chain.integrations.dexScreenerId)
      .map(([_, chain]) => [chain.integrations.dexScreenerId, chain]),
  );

const CHAINS_BY_COINGECKO_ID: Record<string, Chain & { id: ApiChain }> =
  Object.fromEntries(
    Object.entries(CHAINS)
      .filter(([_, chain]) => chain.integrations.coingeckoId)
      .map(([_, chain]) => [chain.integrations.coingeckoId, chain]),
  );

const CHAINS_BY_DUNE_ID: Record<string, Chain & { id: ApiChain }> =
  Object.fromEntries(
    Object.entries(CHAINS)
      .filter(([_, chain]) => chain.integrations.duneId)
      .map(([_, chain]) => [chain.integrations.duneId, chain]),
  );

export function getChain(chain: ApiChain): Chain {
  return CHAINS[chain];
}

export function getChainByChainId(chainId: number): Chain | null {
  if (chainId === RELAY_SOLANA_CHAIN_ID) {
    return CHAINS['solana'];
  }

  return CHAINS_BY_CHAIN_ID[chainId] ?? null;
}

export function getChainByZerionId(zerionId: string, network: ZerionNetwork) {
  switch (network) {
    case 'production':
      return CHAINS_BY_PROD_ZERION_ID[zerionId] ?? null;
    case 'testnet':
      return CHAINS_BY_TESTNET_ZERION_ID[zerionId] ?? null;
    default:
      throw new Error(`Unknown Zerion network: ${network}`);
  }
}

export function getChainByDexScreenerId(dexScreenerId: string) {
  return CHAINS_BY_DEXSCREENER_ID[dexScreenerId] ?? null;
}

export function getChainByCoingeckoId(coingeckoId: string) {
  return CHAINS_BY_COINGECKO_ID[coingeckoId] ?? null;
}

export function getChainByDuneId(duneId: string) {
  return CHAINS_BY_DUNE_ID[duneId] ?? null;
}

// Helper functions that maintain backward compatibility using the new structure
export const SUPPORTED_WALLET_CHAINS = Object.entries(CHAINS)
  .filter(([_, chain]) => chain.features.enabled)
  .map(([_, chain]) => chain);

export const SUPPORTED_WALLET_CHAIN_IDS = SUPPORTED_WALLET_CHAINS.filter(
  (c) => c.viemChain,
).map((c) => c.viemChain!.id);

export const SUPPORTED_OP_STACK_CHAIN_IDS = SUPPORTED_WALLET_CHAINS.filter(
  (c) => c.features.opStack,
).map((c) => c.viemChain!.id);

export const SUPPORTED_TRANSACTION_CHAIN_IDS = SUPPORTED_WALLET_CHAINS.filter(
  (c) => c.integrations.backendTransactions,
).map((c) => c.viemChain!.id);

export function isWrappedNativeAsset(address: string): boolean;
export function isWrappedNativeAsset(address: string, chain: Chain): boolean;
export function isWrappedNativeAsset(address: string, chain?: Chain): boolean {
  if (chain) {
    return (
      chain.wrappedNativeAssetAddress.toLowerCase() === address.toLowerCase()
    );
  }
  return SUPPORTED_WALLET_CHAINS.some(
    (c) => c.wrappedNativeAssetAddress.toLowerCase() === address.toLowerCase(),
  );
}

export function isUsdc(address?: string): boolean;
export function isUsdc(address: string | undefined, chain: Chain): boolean;
export function isUsdc(address?: string, chain?: Chain): boolean {
  if (!address) return false;
  if (chain) {
    return (
      !!chain.usdcAddress &&
      chain.usdcAddress.toLowerCase() === address.toLowerCase()
    );
  }
  return SUPPORTED_WALLET_CHAINS.some(
    (c) => c.usdcAddress?.toLowerCase() === address.toLowerCase(),
  );
}

export function getUsdcAddress(chain: ApiChain): string | undefined {
  return getChain(chain).usdcAddress;
}

export function getWrappedNativeAssetAddress(
  chain: ApiChain,
): string | undefined {
  return getChain(chain).wrappedNativeAssetAddress;
}

const ZORA_CA = '0x1111111111166b7fe7bd91427724b487980afc69';
export function isZora(ca: string): boolean {
  return ca.toLowerCase() === ZORA_CA;
}

export function getNativeAssetAddress(chain: ApiChain): string {
  return getChain(chain).nativeAssetAddress;
}

const ZERO_ADDRESS_LOWER = zeroAddress.toLowerCase();
const EIP7528_NATIVE_ADDRESS_LOWER = EIP7528_NATIVE_ASSET_ADDRESS.toLowerCase();
const SOLANA_NATIVE_ADDRESS_LOWER = SOLANA_NATIVE_ASSET_ADDRESS.toLowerCase();

export function isNativeAsset(ca?: string): boolean {
  const caLower = ca?.toLowerCase();
  return (
    !ca ||
    caLower === ZERO_ADDRESS_LOWER ||
    caLower === EIP7528_NATIVE_ADDRESS_LOWER ||
    caLower === SOLANA_NATIVE_ADDRESS_LOWER ||
    caLower === 'native'
  );
}
