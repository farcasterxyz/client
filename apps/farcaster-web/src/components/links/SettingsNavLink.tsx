import cn from 'classnames';
import { memo, MouseEventHandler, ReactNode, useMemo } from 'react';
import { useMatch } from 'react-router-dom';

import { Link } from '~/components/links/Link';
import { SettingsNavLinkArrow } from '~/components/links/SettingsNavLinkArrow';
import { routes } from '~/constants/routes';
import { useIsCurrentRoute } from '~/hooks/navigation/useIsCurrentRoute';
import { RouteName, Routes } from '~/types';

const SettingsNavLink = <Name extends RouteName>({
  children,
  className,
  onClick,
  params,
  searchParams,
  title,
  to,
  icon,
  disabled,
}: {
  children?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  params: Routes[Name]['params'];
  searchParams: Routes[Name]['search'];
  title: string;
  to: Name;
  icon?: React.ReactNode;
  disabled?: boolean;
}) => {
  const route = routes[to];
  const isCurrentRoute = useIsCurrentRoute({ path: route.path });
  const matchesPath = useMatch(route.path + '/');

  const navLinkIcon = useMemo(() => {
    if (typeof icon !== 'undefined') {
      return icon;
    }
    return <SettingsNavLinkArrow />;
  }, [icon]);

  return (
    <Link
      to={to}
      params={params}
      searchParams={searchParams}
      title={title}
      onClick={(e) => {
        if (disabled) {
          return;
        }
        if (onClick) {
          onClick(e);
          return;
        }

        if (isCurrentRoute) {
          window.location.reload();
        }
      }}
      className={cn(
        matchesPath && 'bg-overlay-faint',
        'flex flex-row items-center justify-between border-b px-4 py-4 text-sm border-default text-default md:text-base',
        disabled ? 'cursor-default' : 'hover:bg-overlay-faint',
        className,
      )}
    >
      {children}
      {navLinkIcon}
    </Link>
  );
};

SettingsNavLink.displayName = 'SettingsNavLink';

const MemoizedSettingsNavLink = memo(SettingsNavLink);

export { MemoizedSettingsNavLink as SettingsNavLink };
