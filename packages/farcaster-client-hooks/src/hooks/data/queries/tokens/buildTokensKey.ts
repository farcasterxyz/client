import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokensKey = ({ ids }: { ids: string[] }) =>
  compactQueryKey(['tokens', ids]);

export { buildTokensKey };
