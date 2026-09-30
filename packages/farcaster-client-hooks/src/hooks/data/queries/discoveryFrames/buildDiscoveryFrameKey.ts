import { ApiGetDiscoveryFrameQueryParams } from 'farcaster-client-data';

const buildDiscoveryFrameKey = ({ slug }: ApiGetDiscoveryFrameQueryParams) => [
  'discoveryFrames',
  slug,
];

export { buildDiscoveryFrameKey };
