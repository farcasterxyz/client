import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { Route } from '~/types';
import {
  arePathFamiliesRelated,
  arePathsRelated,
  arePathsStronglyRelated,
  hydratePath,
} from '~/utils/navUtils';

const useIsRelatedToCurrentRoute = ({
  path,
  params,
  family,
}: Pick<Route, 'path' | 'params' | 'family'>) => {
  const location = useLocation();

  return useMemo(() => {
    if (arePathFamiliesRelated({ path: location.pathname, family })) {
      return true;
    }

    if (family === 'channel') {
      return arePathsStronglyRelated(
        location.pathname,
        hydratePath({ path, params, searchParams: undefined }),
      );
    }

    return arePathsRelated(
      location.pathname,
      hydratePath({ path, params, searchParams: undefined }),
    );
  }, [family, location.pathname, params, path]);
};

export { useIsRelatedToCurrentRoute };
