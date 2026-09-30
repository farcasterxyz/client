import { ApiUser } from 'farcaster-client-data';

import { useCurrentUser } from './useCurrentUser';

const useUserLevel = (user: ApiUser | undefined) => {
  if (!user) {
    return undefined;
  }
  return user.profile.accountLevel;
};

const useCurrentUserLevel = () => {
  const user = useCurrentUser();
  return useUserLevel(user);
};

export { useCurrentUserLevel, useUserLevel };
