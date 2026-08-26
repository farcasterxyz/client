import type { NavigationState, Route } from '@react-navigation/native';

import type { TabViewNavigationState } from '~/contexts/TabViewNavigationStateProvider';

const getPath = (
  state: NavigationState | undefined,
  tabViewNavigationState: TabViewNavigationState,
) => {
  const routeNames = (state?.routes ?? []).map(({ name }) => name);
  // Sub-navigation tab view state will only hold state for root routes.
  // Only append if we are on one of the screens with a tab view navigation state. (goksu)
  if (routeNames.length !== 0 && tabViewNavigationState[routeNames[0]]) {
    routeNames.push(tabViewNavigationState[routeNames[0]]);
  }
  return routeNames.join('/');
};

// Same as in react-navigation which is not exported
type NavigationRoute = Route<string> & {
  state?: NavigationState;
};

function getActiveStackRoute(
  state: NavigationState,
): NavigationRoute | undefined {
  const route = state?.routes?.[state.index] as NavigationRoute;
  if (route) {
    return getActiveStackRouteFromRoute(route);
  }
}

function getActiveStackRouteFromRoute(
  route: NavigationRoute,
  lastStackNavigationRoute?: NavigationRoute,
): NavigationRoute | undefined {
  if (
    !route.state?.routes ||
    route.state.routes.length === 0 ||
    route.state.index >= route.state.routes.length
  ) {
    return lastStackNavigationRoute;
  }

  const childActiveRoute = route.state.routes[
    route.state.index
  ] as NavigationRoute;
  return getActiveStackRouteFromRoute(
    childActiveRoute,
    route.state.type === 'stack' ? route : lastStackNavigationRoute,
  );
}

/**
 * Returns the stack navigator key whose top route matches `routeName`, if any.
 * Walks the full navigation tree so modals on sibling branches (e.g. root stack)
 * are found even when a tab stack is the focused branch.
 */
function findStackKeyWithTopRoute(
  state: NavigationState | undefined,
  routeName: string,
): string | undefined {
  if (!state) {
    return undefined;
  }

  if (state.type === 'stack' && state.routes.length > 0) {
    const topRoute = state.routes[state.routes.length - 1];
    if (topRoute.name === routeName) {
      return state.key;
    }
  }

  for (const route of state.routes) {
    const nestedKey = findStackKeyWithTopRoute(
      (route as NavigationRoute).state,
      routeName,
    );
    if (nestedKey) {
      return nestedKey;
    }
  }

  return undefined;
}

export { findStackKeyWithTopRoute, getActiveStackRoute, getPath };
