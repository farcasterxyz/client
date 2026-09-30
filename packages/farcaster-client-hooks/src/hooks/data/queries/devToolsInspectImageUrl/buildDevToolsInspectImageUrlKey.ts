import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsInspectImageUrlKey = ({ url }: { url: string }) =>
  compactQueryKey(['devToolsInspectImageUrl', url]);

export { buildDevToolsInspectImageUrlKey };
