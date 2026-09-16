import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const useReplace = () => useNavigationMethods().replace;
