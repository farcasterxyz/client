import { useUserAppContext } from '~/contexts/UserAppContextProvider';

const useIsAdmin = () => {
  return useUserAppContext().isAdmin;
};

export { useIsAdmin };
