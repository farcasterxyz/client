export const explorerAddressUrl = (address: string) =>
  `https://solana.fm/address/${address}`;

export const truncateAddress = (address: string) =>
  address.slice(0, 6) + '...' + address.slice(-6);
