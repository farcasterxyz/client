import { ApiDevToolsDebugDomainManifestQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDebugDomainManifestKey = ({
  domain,
}: ApiDevToolsDebugDomainManifestQueryParams) =>
  compactQueryKey(['debugDomainManifest', domain]);

export { buildDebugDomainManifestKey };
