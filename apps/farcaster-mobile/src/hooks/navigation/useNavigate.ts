import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';

export const useNavigate = () => useNavigationMethods().navigate;
