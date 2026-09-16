export const explorerAddressUrl = (address: string) =>
  `https://solana.fm/address/${address}`;

export const truncateAddress = (address: string, numChars: number = 6) =>
  address.slice(0, numChars) + '...' + address.slice(-numChars);
