import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const useGoBack = () => useNavigationMethods().goBack;
