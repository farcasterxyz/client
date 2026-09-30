import { ApiChain } from 'farcaster-client-data';

type MintableWithWarpsAsset = {
  chain: ApiChain;
  tokenId: string;
  contractAddress: string;
  imageUrl: string;
  imageFallbackUrl: string;
  imageAspectRatio: number;
  name: string;
  externalLink: string;
  warpsActionText: string | undefined;
  domain: string;
};

export { type MintableWithWarpsAsset };
