/**
 * Why do we need this and not using `@farcaster/js` directly?
 * - Our original plan was to swap all usages and references to how signer messages
 * being added to be directly referenced from `@farcaster/js` package.
 *  - Unfortunately, because the package itself relies on some Node runtime staples like
 *  TLS, BigInt etc., we ran into issues when using the functionalities. Specifically,
 *  React Native and its Hermes engine does not have these packages build. Desktop client
 *  was able to use the packages however, considering we may move to a non-Node env with web
 *  client soon, we won't load `@farcaster/js` for one client either.
 *  - We have moved most of the heavy functionality of composing the signer add message to the server
 *  and clients are only responsible for signing now.
 *  - Functionality below is the smallest set of functionality we could eject from `@farcaster/js`
 *  and have a functioning flow.
 */

import type { Hex, LocalAccount } from 'viem';

const EIP_712_FARCASTER_DOMAIN = {
  name: 'Farcaster Verify Ethereum Address',
  version: '2.0.0',
  // fixed salt to minimize collisions
  salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
} as const;

const EIP_712_FARCASTER_MESSAGE_DATA = [
  {
    name: 'hash',
    type: 'bytes',
  },
] as const;

const signMessageHash = async (
  hash: Hex,
  account: LocalAccount,
): Promise<string> => {
  const hexSignature = await account.signTypedData({
    domain: EIP_712_FARCASTER_DOMAIN,
    types: { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
    primaryType: 'MessageData',
    message: { hash },
  });
  return hexSignature;
};

const EIP_712_USERNAME_DOMAIN = {
  name: 'Farcaster name verification',
  version: '1',
  chainId: 1,
  verifyingContract: '0xe3be01d99baa8db9905b33a3ca391238234b79d1', // name registry contract, will be the farcaster ENS CCIP contract later
} as const;

const EIP_712_USERNAME_PROOF = [
  { name: 'name', type: 'string' },
  { name: 'timestamp', type: 'uint256' },
  { name: 'owner', type: 'address' },
] as const;

export const signUsernameProof = async (
  message: {
    name: string;
    timestamp: bigint;
    owner: Hex;
  },
  account: LocalAccount,
): Promise<string> => {
  const hexSignature = await account.signTypedData({
    domain: EIP_712_USERNAME_DOMAIN,
    types: { UserNameProof: EIP_712_USERNAME_PROOF },
    primaryType: 'UserNameProof',
    message,
  });
  return hexSignature;
};

const getFarcasterTimestamp = (timestamp: number) => {
  return Math.floor(timestamp / 1000);
};

export { getFarcasterTimestamp, signMessageHash };
