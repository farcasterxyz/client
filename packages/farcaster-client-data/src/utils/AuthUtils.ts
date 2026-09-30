import canonicalize from 'canonicalize';
import * as Siwe from 'ox/Siwe';
import { hexToBytes, type LocalAccount } from 'viem';

import { CreateAuthTokenRequest } from '../types';
import { isDomainOrSubdomain } from './UrlUtils';

const EIP_191_PREFIX = 'eip191:';
const DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN = 1000 * 24 * 60 * 60 * 1000;

const buildCustodyBearerPayload = (
  {
    expiresIn = DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN,
  }: {
    expiresIn: number;
  } = { expiresIn: DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN },
): CreateAuthTokenRequest => {
  const timestamp = Date.now();

  return {
    method: 'generateToken',
    params: {
      timestamp,
      expiresAt: timestamp + expiresIn,
    },
  };
};

const canonicalizeCustodyBearerPayload = (payload: CreateAuthTokenRequest) => {
  return canonicalize(payload) || '';
};

/**
 * Generates a custody bearer token for a given wallet.
 * @param wallet - Wallet to authorize.
 * @returns The custody bearer token.
 */
const buildCustodyBearerToken = async ({
  payload,
  account,
}: {
  payload: CreateAuthTokenRequest;
  account: LocalAccount;
}) => {
  const canonicalizedPayload = canonicalizeCustodyBearerPayload(payload);
  const signature = await account.signMessage({
    message: canonicalizedPayload,
  });

  const signatureBase64 = Buffer.from(hexToBytes(signature)).toString('base64');
  return EIP_191_PREFIX + signatureBase64;
};

const createSiwfMessage = ({
  domain,
  targetUrl,
  options,
  fid,
  address,
}: {
  domain: string;
  targetUrl: string;
  options: { nonce: string; notBefore?: string; expirationTime?: string };
  fid: number;
  address?: `0x${string}`;
}): Omit<Siwe.Message, 'address'> | Siwe.Message => {
  if (
    isDomainOrSubdomain(domain, 'warpcast.com') ||
    isDomainOrSubdomain(domain, 'farcaster.xyz')
  ) {
    throw new Error('disallowed domain');
  }
  const baseMessage = {
    version: '1',
    statement: 'Farcaster Auth',
    chainId: 10,
    resources: [`farcaster://fid/${fid}`] as string[],
    domain,
    uri: new URL(targetUrl).href,
    nonce: options.nonce,
    notBefore: options.notBefore ? new Date(options.notBefore) : undefined,
    expirationTime: options.expirationTime
      ? new Date(options.expirationTime)
      : undefined,
  } as const;

  return address ? { ...baseMessage, address } : baseMessage;
};

export {
  buildCustodyBearerPayload,
  buildCustodyBearerToken,
  canonicalizeCustodyBearerPayload,
  createSiwfMessage,
  DEFAULT_CUSTODY_BEARER_TOKEN_EXPIRES_IN,
};
