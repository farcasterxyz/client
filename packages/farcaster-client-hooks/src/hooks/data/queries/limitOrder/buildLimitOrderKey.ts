import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildLimitOrderKey = ({ orderId }: { orderId: string }) =>
  compactQueryKey(['limitOrder', orderId]);

export { buildLimitOrderKey };
