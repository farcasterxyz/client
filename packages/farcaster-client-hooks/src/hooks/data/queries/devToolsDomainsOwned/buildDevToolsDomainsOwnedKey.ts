import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsDomainsOwnedKey = ({ fid }: { fid?: number } = {}) =>
  compactQueryKey(['devToolsDomainsOwned', fid]);

export { buildDevToolsDomainsOwnedKey };
