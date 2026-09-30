import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsMetaTagsKey = ({ url }: { url: string }) =>
  compactQueryKey(['devToolsMetaTags', url]);

export { buildDevToolsMetaTagsKey };
