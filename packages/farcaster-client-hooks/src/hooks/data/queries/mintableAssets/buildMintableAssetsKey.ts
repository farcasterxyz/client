import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildMintableAssetsKey = ({ url }: { url: string }) =>
  compactQueryKey(['mintableAssets', url]);

export { buildMintableAssetsKey };
