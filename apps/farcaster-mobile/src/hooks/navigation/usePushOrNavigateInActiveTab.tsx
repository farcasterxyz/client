import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const usePushOrNavigateInActiveTab = () =>
  useNavigationMethods().pushOrNavigateInActiveTab;
