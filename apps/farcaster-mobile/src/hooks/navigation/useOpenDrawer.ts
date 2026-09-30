import { useOpenDrawerOnlyNavigationMethods } from '~/contexts/OpenDrawerOnlyNavigationMethodsProvider';

export const useOpenDrawer = () =>
  useOpenDrawerOnlyNavigationMethods().openDrawer;
