import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildContractAddressKey = ({ ca }: { ca: string }) =>
  compactQueryKey(['contractAddress', ca]);

export { buildContractAddressKey };
