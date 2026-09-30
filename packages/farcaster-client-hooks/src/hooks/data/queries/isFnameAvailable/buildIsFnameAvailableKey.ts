import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildIsFnameAvailableKey = ({ fname }: { fname: string }) =>
  compactQueryKey(['isFnameAvailable', fname]);

export { buildIsFnameAvailableKey };
