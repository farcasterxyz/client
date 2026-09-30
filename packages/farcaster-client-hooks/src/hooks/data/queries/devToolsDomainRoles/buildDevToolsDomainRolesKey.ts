import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsDomainRolesKey = ({ domain }: { domain: string }) =>
  compactQueryKey(['devToolsDomainRoles', domain]);

export { buildDevToolsDomainRolesKey };
