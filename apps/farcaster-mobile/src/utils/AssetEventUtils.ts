import { ApiAssetEvent } from 'farcaster-client-data';

const extractAssetEventKey = (assetEvent: ApiAssetEvent) => assetEvent.id;

export { extractAssetEventKey };
