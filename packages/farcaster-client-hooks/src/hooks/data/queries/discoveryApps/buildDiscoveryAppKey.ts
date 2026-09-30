import { ApiGetDiscoveryAppQueryParams } from 'farcaster-client-data';

const buildDiscoveryAppKey = ({ slug }: ApiGetDiscoveryAppQueryParams) => [
  'discoveryApps',
  slug,
];

export { buildDiscoveryAppKey };
