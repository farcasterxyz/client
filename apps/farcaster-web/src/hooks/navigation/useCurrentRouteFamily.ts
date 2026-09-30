import { RouteFamily } from '~/constants/routes';
import { useCurrentRoute } from '~/hooks/navigation/useCurrentRoute';

const useCurrentRouteFamily = (): RouteFamily => {
  const currentRoute = useCurrentRoute();

  return currentRoute?.routeDefinition.family || 'default';
};

export { useCurrentRouteFamily };
