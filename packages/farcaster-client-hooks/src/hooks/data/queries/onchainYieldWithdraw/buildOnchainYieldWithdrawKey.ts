import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildOnchainYieldWithdrawKey = ({
  address,
  amount,
}: {
  address: string;
  amount?: string;
}) => compactQueryKey(['onchainYieldWithdraw', address, amount]) as string[];

export { buildOnchainYieldWithdrawKey };
