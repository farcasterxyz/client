import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildStarterPackKey = ({ id }: { id: string }) =>
  compactQueryKey(['starterPack', id]);

export { buildStarterPackKey };
