import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsGetMiniAppManifestKey = ({ id }: { id: string }) =>
  compactQueryKey(['devToolsGetMiniAppManifest', id]);

export { buildDevToolsGetMiniAppManifestKey };
