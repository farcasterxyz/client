import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildOnchainYieldDepositKey = ({
  address,
  amount,
}: {
  address: string;
  amount: string;
}) => compactQueryKey(['onchainYieldDeposit', address, amount]) as string[];

export { buildOnchainYieldDepositKey };
