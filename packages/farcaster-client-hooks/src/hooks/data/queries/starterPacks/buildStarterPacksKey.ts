import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildStarterPacksKey = ({ fid }: { fid: number }) =>
  compactQueryKey(['starterPacks', fid]);

export { buildStarterPacksKey };
