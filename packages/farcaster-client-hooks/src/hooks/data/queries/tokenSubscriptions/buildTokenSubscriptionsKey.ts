import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokenSubscriptionsKey = () =>
  compactQueryKey(['tokenSubscriptions']);

export { buildTokenSubscriptionsKey };
