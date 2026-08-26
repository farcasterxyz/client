import { WalletType, WalletTypeWithoutCoinbase } from 'farcaster-expo';

function isWalletType(value: unknown): value is WalletType {
  return value === 'rainbow' || value === 'warpcast' || value === 'coinbase';
}

type WalletInstallability = {
  warpcast: boolean;
  rainbow: boolean;
  coinbase: boolean;
};

export function normalizePreferredWallet(
  raw: string | undefined,
  opts: {
    installability: WalletInstallability;
  },
): WalletTypeWithoutCoinbase | undefined {
  const defaultWallet = opts.installability.warpcast ? 'warpcast' : undefined;
  if (raw === undefined) {
    return defaultWallet;
  }

  if (!isWalletType(raw)) {
    return defaultWallet;
  }

  const canInstallSelectedWallet = opts.installability[raw];
  if (canInstallSelectedWallet) {
    return raw as WalletTypeWithoutCoinbase;
  }
  return defaultWallet;
}
