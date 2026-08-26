import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildSuggestedUsersKey = ({
  limit,
  randomized,
}: {
  limit: number | undefined;
  randomized: boolean | undefined;
}) => compactQueryKey(['suggestedUsers', randomized, limit]);

export { buildSuggestedUsersKey };
