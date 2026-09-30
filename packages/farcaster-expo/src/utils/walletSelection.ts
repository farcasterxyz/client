type LinkedWalletAccount = {
  type?: string;
  address?: string | null;
  chainType?: string;
  walletClientType?: string;
  walletIndex?: number | null;
};

/**
 * Builds an address→HD-index map from Privy `user.linkedAccounts`.
 *
 * The connected-wallet objects returned by `useWallets()` do NOT reliably carry
 * `walletIndex` — on web it is `undefined` for recovered embedded wallets, so a
 * naive lowest-index pick degrades to array order. The HD index is reliably
 * present on the `linkedAccounts` HD wallet accounts (`HDWalletWithMetadata`),
 * so resolve it from there and feed it into `pickRootEmbeddedWallet`.
 */
export function buildEmbeddedWalletIndexByAddress(
  linkedAccounts: readonly LinkedWalletAccount[] | undefined,
  chainType: 'ethereum' | 'solana',
): Map<string, number> {
  const indexByAddress = new Map<string, number>();
  for (const account of linkedAccounts ?? []) {
    if (
      account.type === 'wallet' &&
      account.walletClientType === 'privy' &&
      account.chainType === chainType &&
      account.address &&
      typeof account.walletIndex === 'number'
    ) {
      indexByAddress.set(account.address.toLowerCase(), account.walletIndex);
    }
  }
  return indexByAddress;
}

/**
 * Picks the root embedded wallet (lowest HD wallet index, i.e. the n0 entropy).
 * Some accounts carry extra n+1-index wallets from the abandoned secondary-wallet
 * experiment, and the SDK's array order is not guaranteed — never fall back to
 * wallets[0].
 *
 * Pass `indexByAddress` (from `buildEmbeddedWalletIndexByAddress`) to resolve the
 * HD index from Privy's `linkedAccounts`, which is authoritative; the wallet
 * object's own `walletIndex` is used only as a fallback when no mapping exists.
 */
export function pickRootEmbeddedWallet<
  T extends { address: string; walletIndex?: number | null },
>(
  wallets: readonly T[] | undefined,
  indexByAddress?: ReadonlyMap<string, number>,
): T | undefined {
  if (!wallets || wallets.length === 0) {
    return undefined;
  }
  const indexOf = (wallet: T): number =>
    indexByAddress?.get(wallet.address.toLowerCase()) ??
    wallet.walletIndex ??
    0;
  return wallets.reduce((root, wallet) =>
    indexOf(wallet) < indexOf(root) ? wallet : root,
  );
}
