import { useAuthenticatedUser } from '../data/queries/authenticatedUser';

const useFeatureFlag = (flag: string): boolean => {
  const { data } = useAuthenticatedUser();
  return data?.result.enabledFeatureFlags.includes(flag) ?? false;
};

export { useFeatureFlag };
