import { QueryKey } from '@tanstack/react-query';

export type SuggestedUsersToFollowKeyParams = {
  interests?: string[];
};

const buildSuggestedUsersToFollowKey = (
  params: SuggestedUsersToFollowKeyParams,
): QueryKey => {
  const { interests } = params;
  return ['suggestedUsersToFollow', { interests }];
};

export { buildSuggestedUsersToFollowKey };
