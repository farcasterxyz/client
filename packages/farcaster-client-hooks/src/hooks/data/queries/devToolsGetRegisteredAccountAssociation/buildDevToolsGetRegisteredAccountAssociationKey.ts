import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsGetRegisteredAccountAssociationKey = ({
  domain,
}: {
  domain: string;
}) => compactQueryKey(['devToolsGetRegisteredAccountAssociation', domain]);

export { buildDevToolsGetRegisteredAccountAssociationKey };
