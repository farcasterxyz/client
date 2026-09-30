import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildStarterPackUsersKey = ({ id }: { id: string }) =>
  compactQueryKey(['starterPackUsers', id]);

export { buildStarterPackUsersKey };
