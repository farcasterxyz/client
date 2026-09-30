import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildSearchUsersForStarterPacksKey = ({
  search,
}: {
  search: string | undefined;
}) => compactQueryKey(['searchUsersForStarterPacks', search]);

export { buildSearchUsersForStarterPacksKey };
