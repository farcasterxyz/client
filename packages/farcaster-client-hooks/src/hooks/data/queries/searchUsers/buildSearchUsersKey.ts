import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildSearchUsersKey = ({
  limit,
  q,
  prioritizeFids,
  includeDirectCastAbility = false,
}: {
  limit: number | undefined;
  q: string | undefined;
  prioritizeFids?: number[];
  includeDirectCastAbility?: boolean;
}) =>
  compactQueryKey([
    'searchUsers',
    q,
    limit,
    prioritizeFids ? prioritizeFids.join(',') : undefined,
    includeDirectCastAbility ? 'includeDirectCastAbility' : undefined,
  ]);
