import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAppsByAuthorKey = ({ fid }: { fid: number }) =>
  compactQueryKey(['appsByAuthor', fid]);

export { buildAppsByAuthorKey };
