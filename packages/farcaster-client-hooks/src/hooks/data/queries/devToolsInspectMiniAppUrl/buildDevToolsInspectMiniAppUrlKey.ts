import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsInspectMiniAppUrlKey = ({ url }: { url: string }) =>
  compactQueryKey(['devToolsInspectMiniAppUrl', url]);

export { buildDevToolsInspectMiniAppUrlKey };
