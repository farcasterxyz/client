import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildLimitOrdersKey = ({ statuses }: { statuses?: string } = {}) =>
  compactQueryKey(['limitOrders', statuses]);

export { buildLimitOrdersKey };
