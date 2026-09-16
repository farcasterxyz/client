import { compactQueryKey } from '../../../../utils/QueryUtils';

// v2 forces a one-shot cache invalidation for clients that warmed under the
// legacy 1h staleTime and are still serving the pre-fix sortOrder ASC array
// out of react-query. Bumping the key orphans every existing ['walletLinks']
// entry so the next mount triggers a fresh /v2/wallet-links request against
// the DESC-ordered backend (NEYN-11997).
const buildWalletLinksKey = () => compactQueryKey(['walletLinks', 'v2']);

export { buildWalletLinksKey };
