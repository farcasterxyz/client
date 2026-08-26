import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildStarterPackFeedKey = ({ id }: { id: string }) =>
  compactQueryKey(['starterPackFeed', id]);

export { buildStarterPackFeedKey };
