import { ApiTokenLink } from 'farcaster-client-data';

export function getTokenEmbedUrl(token: ApiTokenLink) {
  return `https://farcaster.xyz/~/c/${token.chain}:${token.ca}`;
}
