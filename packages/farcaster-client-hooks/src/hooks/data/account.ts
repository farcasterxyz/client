import type { Hex, LocalAccount } from 'viem';
import type { SignReturnType } from 'viem/accounts';

export type Sign = ({ hash }: { hash: Hex }) => Promise<SignReturnType<'hex'>>;

export type LocalAccountWithSign = LocalAccount & {
  // We often construct hashes to sign on our server to keep our clients simple
  // and dynamic. This is a non-standard pattern so the default Viem
  // LocalAccount doesn't support this so we add it ourselves.
  sign: Sign;
};
