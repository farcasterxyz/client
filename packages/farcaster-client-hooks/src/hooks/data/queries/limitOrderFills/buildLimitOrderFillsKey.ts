import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildLimitOrderFillsKey = ({ orderId }: { orderId: string }) =>
  compactQueryKey(['limitOrderFills', orderId]);

export { buildLimitOrderFillsKey };
