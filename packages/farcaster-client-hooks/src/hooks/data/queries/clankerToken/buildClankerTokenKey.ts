import { compactQueryKey } from '../../../../utils/QueryUtils';
import { ApiGetClankerTokenQueryParams } from './types';

const buildClankerTokenKey = ({ ca }: ApiGetClankerTokenQueryParams) =>
  compactQueryKey(['clankerToken', ca]);

export { buildClankerTokenKey };
