import { useCallback } from 'react';
import {
  NavigateOptions as ReactRouterNavigateOptions,
  // eslint-disable-next-line no-restricted-imports
  useNavigate as useNavigateReactRouter,
} from 'react-router-dom';

import { routes } from '~/constants/routes';
import { useNavigateInNewTab } from '~/hooks/navigation/useNavigateInNewTab';
import { RouteName, Routes } from '~/types';
import { hydratePath } from '~/utils/navUtils';

type NavigateOptions = ReactRouterNavigateOptions & {
  openInNewTab?: boolean;
};

export type NavigateProps<Name extends RouteName> = {
  options?: NavigateOptions;
  params: Routes[Name]['params'];
  searchParams?: Routes[Name]['search'];
  to: Name;
};

const useNavigate = () => {
  const navigate = useNavigateReactRouter();
  const navigateInNewTab = useNavigateInNewTab();

  return useCallback(
    <Name extends RouteName>({
      options,
      params,
      searchParams,
      to,
    }: NavigateProps<Name>) => {
      const route = routes[to];
      const href = hydratePath({ path: route.path, params, searchParams });

      if (options && options.openInNewTab) {
        navigateInNewTab({ href });
      } else {
        navigate(href, options);
      }
    },
    [navigate, navigateInNewTab],
  );
};

export { useNavigate };
