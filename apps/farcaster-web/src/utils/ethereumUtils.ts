import { getTransactionExplorerUrl as getClientTransactionExplorerUrl } from 'farcaster-client-data';

export const truncateAddress = (address: string, numChars: number = 6) =>
  address.slice(0, numChars) + '...' + address.slice(-numChars);

export const explorerAddressUrl = (address: string) =>
  `https://etherscan.io/address/${address}`;

export const getTransactionExplorerUrl = ({
  chainId,
  hash,
}: {
  chainId: string;
  hash: string;
}) => {
  return (
    getClientTransactionExplorerUrl({ type: 'tx', chainId, hash }) ??
    `https://etherscan.io/tx/${hash}`
  );
};
