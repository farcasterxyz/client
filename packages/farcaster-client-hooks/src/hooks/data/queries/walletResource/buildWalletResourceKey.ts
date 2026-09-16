import { ApiWalletResourceName } from 'farcaster-client-data';

const buildWalletResourceKey = ({ name }: { name: ApiWalletResourceName }) => [
  'walletResource',
  name,
];

export { buildWalletResourceKey };
