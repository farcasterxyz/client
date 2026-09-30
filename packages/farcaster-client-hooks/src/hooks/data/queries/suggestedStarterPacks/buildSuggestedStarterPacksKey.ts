import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildSuggestedStarterPacksKey = () =>
  compactQueryKey(['suggestedStarterPacks']);

export { buildSuggestedStarterPacksKey };
