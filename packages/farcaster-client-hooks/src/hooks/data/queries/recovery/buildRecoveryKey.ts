import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildRecoveryKey = ({
  id,
  address,
  deadline,
}: {
  id?: string;
  address?: string;
  deadline?: number;
} = {}) =>
  compactQueryKey(['recovery', id, address, deadline?.toString()]) as string[];
