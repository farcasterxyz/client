import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildStorageUtilizationKey = () =>
  compactQueryKey(['storageUtilization']);

export { buildStorageUtilizationKey };
