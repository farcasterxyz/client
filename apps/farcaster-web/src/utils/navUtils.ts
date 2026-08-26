import { matchRoutes } from 'react-router-dom';

import { appPathPrefixSymbol } from '~/constants/routePrefixes';
import { RouteFamily, routes } from '~/constants/routes';

const encodeSearchParams = (searchParams: Record<string, unknown>) => {
  const p = new URLSearchParams();

  Object.keys(searchParams).forEach((key) => {
    if (
      typeof searchParams[key] !== 'undefined' &&
      searchParams[key] !== null
    ) {
      if (Array.isArray(searchParams[key])) {
        (searchParams[key] as unknown[]).forEach((value) => {
          p.append(`${key}[]`, String(value));
        });
      } else {
        p.set(key, String(searchParams[key]));
      }
    }
  });

  return p.toString();
};

const hydratePath = ({
  path,
  params,
  searchParams,
}: {
  path: string;
  params: Record<string, unknown> | undefined;
  searchParams: Record<string, unknown> | undefined;
}) => {
  const hydratedPath = params
    ? Object.keys(params).reduce((memo, key) => {
        return memo.replace(`:${key}`, (params[key] || '') as string);
      }, path)
    : path;

  return searchParams
    ? `${hydratedPath}?${encodeSearchParams(searchParams)}`
    : hydratedPath;
};

const pathToSegments = (path: string) =>
  path
    .split('/')
    .filter((segment) => segment && segment !== appPathPrefixSymbol);

const arePathsRelated = (path1: string, path2: string) => {
  // If the paths are equal, we have our answer
  if (path1 === path2) {
    return true;
  }

  const path1Segments = pathToSegments(path1);
  const path2Segments = pathToSegments(path2);

  // If either of the paths is the root, we don't consider it related to any paths that aren't also the root
  if (path1Segments.length === 0 || path2Segments.length === 0) {
    return false;
  }

  // If the first segment of the paths – excluding app prefix symbol (e.g. `~`) – are the same, we'll consider the paths related.
  return path1Segments[0] === path2Segments[0];
};

const arePathsStronglyRelated = (path1: string, path2: string) => {
  const path1Segments = pathToSegments(path1);
  const path2Segments = pathToSegments(path2);

  return (
    path1Segments[0] === path2Segments[0] &&
    path1Segments[1] === path2Segments[1]
  );
};

const arePathFamiliesRelated = ({
  path,
  family,
}: {
  path: string;
  family: RouteFamily;
}) => {
  // Default route family indicates that there can be no relation
  // with other paths.
  if (family === 'default' || family === 'channel') {
    return false;
  }

  const matches = matchRoutes(Object.values(routes), path);

  if (matches === null || matches.length === 0) {
    return false;
  }

  const { route } = matches[0];

  return route.family === family;
};

const findPreloadableComponentsForRoute = (path: string) => {
  const matches = matchRoutes(Object.values(routes), path);

  return matches
    ? matches
        .map((match) => match.route.Component)
        .map((Component) => Component)
    : [];
};

export {
  arePathFamiliesRelated,
  arePathsRelated,
  arePathsStronglyRelated,
  findPreloadableComponentsForRoute,
  hydratePath,
};
