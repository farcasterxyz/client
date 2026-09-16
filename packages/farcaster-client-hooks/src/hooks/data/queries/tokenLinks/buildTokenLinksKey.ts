import { ApiChain, ApiFid } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokenLinksKey = ({
  ticker,
  chain,
  intent,
  contextFid,
}: {
  ticker?: string;
  chain?: ApiChain;
  intent?: 'typeahead' | 'submit';
  contextFid?: ApiFid;
}) => compactQueryKey(['tokenLinks', ticker, chain, intent, contextFid]);

export { buildTokenLinksKey };
