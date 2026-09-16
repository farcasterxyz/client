import { ApiGetRemoteSiwfRequestQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildRemoteSiwfRequestKey = ({
  token,
}: ApiGetRemoteSiwfRequestQueryParams) =>
  compactQueryKey(['remoteSiwfRequest', token]) as string[];

export { buildRemoteSiwfRequestKey };
