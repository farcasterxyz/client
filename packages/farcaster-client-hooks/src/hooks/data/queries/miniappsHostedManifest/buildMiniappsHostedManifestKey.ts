import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildMiniappsHostedManifestKey = (id: string) =>
  compactQueryKey(['miniappsHostedManifest', id]);

export { buildMiniappsHostedManifestKey };
