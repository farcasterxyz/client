import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildOnchainActionKey = ({
  onchainActionId,
}: {
  onchainActionId: string;
}) => compactQueryKey(['onchainAction', onchainActionId]);

export { buildOnchainActionKey };
