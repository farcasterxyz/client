import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTraderSubscriptionsKey = () =>
  compactQueryKey(['traderSubscriptions']);

export { buildTraderSubscriptionsKey };
