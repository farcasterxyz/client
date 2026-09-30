import { Hex, isHex } from 'viem';

export const assertHex = (value: unknown): Hex => {
  if (!isHex(value)) {
    throw new Error(`Expected hex string: ${value}`);
  }

  return value;
};
