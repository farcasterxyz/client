import { ApiUserMinimal } from 'farcaster-client-data';

import { useCurrentUser } from './useCurrentUser';

const useUserLevel = (user: ApiUserMinimal | undefined) => {
  if (!user) {
    return undefined;
  }
  if (!user.profile) {
    return undefined;
  }
  return user.profile.accountLevel;
};

const useCurrentUserLevel = () => {
  const currentUser = useCurrentUser();
  return useUserLevel(currentUser);
};

export { useCurrentUserLevel, useUserLevel };
