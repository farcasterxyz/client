import { useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { routes } from '~/constants/routes';

const useCurrentRoute = () => {
  const location = useLocation();

  return useMemo(() => {
    for (const [routeName, routeDefinition] of Object.entries(routes)) {
      const match = matchPath(
        {
          end: true,
          path: routeDefinition.path,
        },
        location.pathname,
      );
      if (match) {
        return {
          routeName,
          routeDefinition,
          match,
        };
      }
    }
    return undefined;
  }, [location]);
};

export { useCurrentRoute };
