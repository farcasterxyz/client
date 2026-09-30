import cn from 'classnames';
import {
  memo,
  MouseEventHandler,
  ReactElement,
  ReactNode,
  RefObject,
} from 'react';
// eslint-disable-next-line no-restricted-imports
import { Link as ReactRouterLink } from 'react-router-dom';

import { routes } from '~/constants/routes';
import { useHydratePath } from '~/hooks/navigation/useHydratePath';
import { useIsCurrentRoute } from '~/hooks/navigation/useIsCurrentRoute';
import { RouteName, Routes } from '~/types';
import { findPreloadableComponentsForRoute } from '~/utils/navUtils';

export type LinkProps<Name extends RouteName> = {
  children?: ReactNode | ReactElement[] | string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  onMouseOver?: MouseEventHandler<HTMLAnchorElement>;
  onMouseEnter?: MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: MouseEventHandler<HTMLAnchorElement>;
  params: Routes[Name]['params'];
  searchParams: Routes[Name]['search'];
  stopPropagation?: boolean;
  title: string;
  to: Name;
  linkRef?: RefObject<HTMLAnchorElement>;
  newTab?: boolean;
  rel?: string;
};

const Link = <Name extends RouteName>({
  children,
  className,
  onClick,
  onMouseOver,
  onMouseEnter: onMouseEnterProp,
  onMouseLeave,
  params,
  searchParams,
  stopPropagation = true,
  title,
  to,
  linkRef,
  newTab,
  rel,
}: LinkProps<Name>) => {
  const route = routes[to];
  const isCurrentRoute = useIsCurrentRoute(route);
  const href = useHydratePath({ path: route.path, params, searchParams });

  return (
    <ReactRouterLink
      ref={linkRef}
      to={href}
      className={cn(isCurrentRoute && 'current', className)}
      onMouseOver={onMouseOver}
      onMouseEnter={(e) => {
        if (onMouseEnterProp) {
          onMouseEnterProp(e);
        }

        const preloadableComponents = findPreloadableComponentsForRoute(href);
        preloadableComponents.forEach((component) => {
          if (
            'preload' in component &&
            typeof component.preload === 'function'
          ) {
            component.preload();
          }
        });
      }}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }

        if (stopPropagation) {
          e.stopPropagation();
        }
      }}
      title={title}
      target={newTab ? '_blank' : undefined}
      rel={rel}
    >
      {children}
    </ReactRouterLink>
  );
};

Link.displayName = 'Link';

const MemoizedLink = memo(Link);

export { MemoizedLink as Link };
