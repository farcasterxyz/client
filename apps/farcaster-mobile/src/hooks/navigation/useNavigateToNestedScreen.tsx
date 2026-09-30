import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const useNavigateToNestedScreen = () =>
  useNavigationMethods().navigateToNestedScreen;
