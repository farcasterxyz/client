import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsTempAccountAssociationKey = ({
  domain,
}: {
  domain: string;
}) => compactQueryKey(['devToolsTempAccountAssociation', domain]);

export { buildDevToolsTempAccountAssociationKey };
