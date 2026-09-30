import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const usePop = () => useNavigationMethods().pop;
