import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const usePush = () => useNavigationMethods().push;
