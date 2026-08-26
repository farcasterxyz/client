import { useMemo } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';

import { routesArray } from '~/constants/routes';
import { Route } from '~/types';

const useIsCurrentRoute = ({ path }: Pick<Route, 'path'>) => {
  const location = useLocation();

  return useMemo(() => {
    const matches = matchRoutes(routesArray, location);

    return (matches || []).some((match) => match.route.path === path);
  }, [location, path]);
};

export { useIsCurrentRoute };
