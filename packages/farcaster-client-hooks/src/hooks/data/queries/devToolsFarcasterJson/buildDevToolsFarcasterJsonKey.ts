import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsFarcasterJsonKey = ({ domain }: { domain: string }) =>
  compactQueryKey(['devToolsFarcasterJson', domain]);

export { buildDevToolsFarcasterJsonKey };
