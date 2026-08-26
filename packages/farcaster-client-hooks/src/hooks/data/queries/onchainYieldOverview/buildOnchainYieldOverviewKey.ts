import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildOnchainYieldOverviewKey = ({ address }: { address: string }) =>
  compactQueryKey(['onchainYieldOverview', address]) as string[];

export { buildOnchainYieldOverviewKey };
