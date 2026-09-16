import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildUserAuthAddressKey = () =>
  compactQueryKey(['userAuthAddress']) as string[];
