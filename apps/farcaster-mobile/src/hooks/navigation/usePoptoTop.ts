import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const usePopToTop = () => useNavigationMethods().popToTop;
