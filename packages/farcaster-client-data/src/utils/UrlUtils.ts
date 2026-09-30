import { ApiChain } from '../types';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  getChainByChainId,
  isNativeAsset,
  SOLANA_NATIVE_ASSET_ADDRESS,
} from './ChainUtils';
import { apiChainToChainIdOrThrow } from './EthereumUtils';

export const domainFromUrl = (url: string) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url.split('/')[0];
  }
  const parsedUrl = new URL(url);
  return parsedUrl.hostname;
};

export const toHttpsUrl = (url: string): string => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  if (!url.match(/^https?:\/\//)) {
    return `https://${url}`;
  }
  return url;
};

export const isLocalhostUrl = (validateUrl: string) => {
  try {
    const url = new URL(validateUrl);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('127.') // Handle all 127.0.0.0/8 addresses
    );
  } catch (error) {
    return false;
  }
};

export const isPrivateIpUrl = (validateUrl: string) => {
  try {
    const url = new URL(validateUrl);
    if (url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;

    // Handle 10.0.0.0/8
    if (hostname.startsWith('10.')) {
      return true;
    }

    // Handle 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
    if (hostname.startsWith('172.')) {
      const parts = hostname.split('.');
      if (parts.length === 4) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return true;
        }
      }
    }

    // Handle 192.168.0.0/16
    if (hostname.startsWith('192.168.')) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

export const isLocalhostUrlOrPrivateIpUrl = (validateUrl: string) => {
  try {
    return isLocalhostUrl(validateUrl) || isPrivateIpUrl(validateUrl);
  } catch (error) {
    return false;
  }
};

export const isPublicUrl = (validateUrl: string) => {
  try {
    if (isLocalhostUrl(validateUrl) || isPrivateIpUrl(validateUrl)) {
      return false;
    }
    const url = new URL(validateUrl);
    return url.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

export const isExactDomain = (domain: string, exactDomain: string) => {
  if (!domain || !exactDomain) return false;

  return domain.toLowerCase() === exactDomain.toLowerCase();
};

export const isDomainOrSubdomain = (domain: string, parentDomain: string) => {
  if (!domain || !parentDomain) return false;

  domain = domain.toLowerCase();
  parentDomain = parentDomain.toLowerCase();

  if (domain === parentDomain) {
    return true;
  }

  return domain.endsWith('.' + parentDomain);
};

export type Caip19Data = {
  protocol: string;
  chainNamespace: string;
  chainReference: string;
  assetNamespace: string;
  assetReference: string;
};

export const parseCaip19Url = (
  urlString: string,
  validate = true,
): Caip19Data | null => {
  try {
    if (urlString.startsWith('http')) {
      throw new Error('invalid protocol');
    }

    if (!urlString.startsWith('chain://')) {
      urlString = `chain://${urlString}`;
    }

    const [, chainPart, assetPart] =
      urlString.match(/^chain:\/\/([^/]+)\/(.+)$/) || [];
    if (!chainPart || !assetPart) return null;

    const [chainNamespace, chainReference] = chainPart.split(':');
    if (!chainNamespace || !chainReference) return null;

    const isNative = assetPart === 'native';

    let assetNamespace = '';
    let assetReference = '';

    if (isNative) {
      assetNamespace = 'native';
      assetReference = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    } else {
      [assetNamespace, assetReference] = assetPart.split(':');
      if (!assetNamespace || !assetReference) return null;

      if (
        validate &&
        assetNamespace === 'erc20' &&
        !/^0x[a-fA-F0-9]{40}$/.test(assetReference)
      ) {
        return null;
      }
    }

    if (
      validate &&
      chainNamespace === 'eip155' &&
      !/^\d+$/.test(chainReference)
    ) {
      return null;
    }

    return {
      protocol: 'chain://',
      chainNamespace,
      chainReference,
      assetNamespace,
      assetReference,
    };
  } catch (error) {
    return null;
  }
};

export function parseCAIP19Token(
  uri: string,
): { chain: ApiChain; ca: string } | null {
  if (uri.startsWith('eip155:')) {
    if (uri.includes('native')) {
      const match = uri.match(/^eip155:(\d+)\/native$/);
      if (!match) return null;

      const chainId = parseInt(match[1], 10);
      const chain = getChainByChainId(chainId);
      if (!chain) return null;

      return {
        chain: chain.id,
        ca: EIP7528_NATIVE_ASSET_ADDRESS.toLowerCase(),
      };
    }

    if (uri.includes('/erc20:')) {
      const match = uri.match(/^eip155:(\d+)\/erc20:(0x[a-fA-F0-9]{40})$/);
      if (!match) return null;

      const chainId = parseInt(match[1], 10);
      const address = match[2].toLowerCase();

      const chain = getChainByChainId(chainId);
      if (!chain) return null;

      return { chain: chain.id, ca: address };
    }
  }

  if (uri.startsWith('solana:')) {
    if (uri.includes('native')) {
      return { chain: 'solana', ca: SOLANA_NATIVE_ASSET_ADDRESS };
    }
    const tokenMatch = uri.match(
      /^solana:[a-zA-Z0-9]+\/(token|address):([a-zA-Z0-9]{32,44})$/,
    );
    if (tokenMatch) {
      const ca = tokenMatch[2];
      return { chain: 'solana', ca };
    }
  }

  return null;
}

/**
 * Constructs a CAIP-19 URI for tokens
 * EVM format: eip155:{chainId}/erc20:{contractAddress}
 * Solana format: solana:101/address:{tokenAddress} (Phantom format)
 */
export const buildCaip19TokenUri = (chain: ApiChain, ca: string): string => {
  if (chain === 'solana') {
    // Use Phantom's format with mainnet-beta cluster ID (101)
    return `solana:101/address:${ca}`;
  }

  // EVM chains
  const chainId = apiChainToChainIdOrThrow(chain);
  const tokenAddress = isNativeAsset(ca)
    ? EIP7528_NATIVE_ASSET_ADDRESS.toLowerCase()
    : ca.toLowerCase();

  return `eip155:${chainId}/erc20:${tokenAddress}`;
};

export function isTunnelDomain(domain: string): boolean {
  const tunnelDomainPatterns = [
    /\.ngrok\.pizza$/i, // This is surprisingly one of the domains used by ngrok
    /\.ngrok\.pro$/i,
    /\.ngrok\.io$/i,
    /\.ngrok\.app$/i,
    /\.ngrok\.dev$/i,
    /\.replit\.dev$/i,
    /\.tunn\.dev$/i,
    /\.tunnelmodle\.net$/i,
    /\.ngrok-free\.app$/i,
    /\.trycloudflare\.com$/i,
    /\.cloudflaretunnel\.com$/i,
    /\.cf\.dev$/i,
    /\.localtunnel\.me$/i,
    /\.loca\.lt$/i,
    /\.tunnel\.to$/i,
    /\.serveo\.net$/i,
    /\.sslip\.io$/i,
    /\.beget\.pro$/i,
  ];

  return tunnelDomainPatterns.some((pattern) => pattern.test(domain));
}

export function isAllowedSnapTargetUrl(
  href: string,
  { allowLocalhost = true }: { allowLocalhost?: boolean } = {},
): boolean {
  try {
    const u = new URL(href);
    if (u.protocol === 'https:') {
      return true;
    }

    if (!allowLocalhost) {
      return false;
    }

    const h = u.hostname.toLowerCase();
    return (
      u.protocol === 'http:' &&
      (h === 'localhost' || h === '127.0.0.1' || h === '::1')
    );
  } catch {
    return false;
  }
}

export function isAllowedProtocol(url: string): boolean {
  return (
    url.startsWith('https://') ||
    url.startsWith('farcaster://') ||
    url.startsWith('chain://')
  );
}
