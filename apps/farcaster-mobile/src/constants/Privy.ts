// Privy app IDs for the primary (Farcaster wallet) and secondary (private
// wallet) embedded-wallet apps. Both apps authenticate the same Farcaster /
// SIWE user proof; the secondary app exists solely to give private wallets an
// independent entropy root (different seedphrase from the primary Farcaster
// Wallet).

export const PRIMARY_PRIVY_APP_ID = 'REPLACE_ME';
export const PRIMARY_PRIVY_CLIENT_ID =
  'REPLACE_ME';

// Secondary Privy app for independent private-wallet entropy.
// Same Farcaster/SIWE proof authenticates the user into both apps; the
// secondary app's wallet_index 0 wallet is the user's private wallet with a
// seedphrase independent from the primary Farcaster wallet's.
export const SECONDARY_PRIVY_APP_ID = 'REPLACE_ME';
export const SECONDARY_PRIVY_CLIENT_ID =
  'REPLACE_ME';
