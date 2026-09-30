import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildSearchMiniAppsForAutocompleteKey = ({
  query,
}: {
  query: string;
}) => compactQueryKey(['searchMiniAppsForAutocomplete', query]);
