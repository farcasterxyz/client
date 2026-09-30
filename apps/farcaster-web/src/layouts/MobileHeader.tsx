import { GearIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useUnseen } from 'farcaster-client-hooks';
import {
  Archive,
  BellIcon,
  ChevronDown,
  Grid3X3Icon,
  HomeIcon,
  Megaphone,
  SearchIcon,
  Send,
  UserPlusIcon,
  XIcon,
} from 'lucide-react';
import { FC, memo, ReactNode, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { ComposeCastButton } from '~/components/forms/buttons/ComposeCastButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { NavLinkBadge } from '~/components/links/NavLinkBadge';
import { Search } from '~/components/search/Search';
import { routes } from '~/constants/routes';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastComposerSession } from '~/contexts/CastComposerSessionProvider';
import { useStandaloneMode } from '~/contexts/StandaloneModeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useCurrentUserProfileCastsLinkProps } from '~/hooks/navigation/useCurrentUserProfileCastsLinkProps';
import {
  arePathFamiliesRelated,
  arePathsRelated,
  hydratePath,
} from '~/utils/navUtils';

const selectedNavBackgroundClasses =
  'bg-surface-secondary font-semibold text-default';

const useMobileNavState = () => {
  const location = useLocation();
  const { notificationsCount, inboxCount, channelFeedsUnseenStatus } =
    useUnseen();
  const updatesUnseenCount = channelFeedsUnseenStatus?.['fc-updates']
    ?.hasNewItems
    ? 1
    : 0;

  const hrefs = useMemo(
    () => ({
      home: hydratePath({
        path: routes.homeFeed.path,
        params: {},
        searchParams: undefined,
      }),
      notifications: hydratePath({
        path: routes.notifications.path,
        params: {},
        searchParams: undefined,
      }),
      directCasts: hydratePath({
        path: routes.directCastsInbox.path,
        params: {},
        searchParams: undefined,
      }),
      referrals: hydratePath({
        path: routes.referrals.path,
        params: {},
        searchParams: undefined,
      }),
      saved: hydratePath({
        path: routes.saved.path,
        params: {},
        searchParams: undefined,
      }),
      apps: hydratePath({
        path: routes.discover.path,
        params: {},
        searchParams: undefined,
      }),
      developers: hydratePath({
        path: routes.developers.path,
        params: {},
        searchParams: undefined,
      }),
      settings: hydratePath({
        path: routes.settings.path,
        params: {},
        searchParams: undefined,
      }),
      updates: hydratePath({
        path: routes.channel.path,
        params: { channelKey: 'fc-updates' },
        searchParams: undefined,
      }),
      profile: hydratePath({
        path: routes.profileCastsWithUsername.path,
        params: {},
        searchParams: undefined,
      }),
    }),
    [],
  );

  const active = useMemo(() => {
    const { pathname } = location;
    const updatesHref = hrefs.updates;
    return {
      home: arePathFamiliesRelated({ path: pathname, family: 'home' }),
      notifications: arePathFamiliesRelated({
        path: pathname,
        family: 'notifications',
      }),
      directCasts: arePathFamiliesRelated({
        path: pathname,
        family: 'directCasts',
      }),
      saved: arePathFamiliesRelated({ path: pathname, family: 'saved' }),
      apps: arePathFamiliesRelated({ path: pathname, family: 'apps' }),
      settings: arePathFamiliesRelated({ path: pathname, family: 'settings' }),
      developers: arePathsRelated(pathname, hrefs.developers),
      referrals: arePathsRelated(pathname, hrefs.referrals),
      profile: arePathsRelated(pathname, hrefs.profile),
      updates:
        pathname === updatesHref || pathname.startsWith(updatesHref + '/'),
    };
  }, [location, hrefs]);

  const currentPageTitle = useMemo(() => {
    if (active.home) {
      return 'Home';
    }
    if (active.notifications) {
      return 'Notifications';
    }
    if (active.directCasts) {
      return 'Direct Casts';
    }
    if (active.saved) {
      return 'Saved';
    }
    if (active.apps) {
      return 'Apps';
    }
    if (active.settings) {
      return 'Settings';
    }
    if (active.developers) {
      return 'Developers';
    }
    if (active.referrals) {
      return 'Referrals';
    }
    if (active.updates) {
      return 'Updates';
    }
    return null;
  }, [active]);

  return {
    hrefs,
    active,
    currentPageTitle,
    notificationsCount,
    inboxCount,
    updatesUnseenCount,
  };
};

type DropdownItemProps = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  isActive: boolean;
  onClose: () => void;
  isExternal?: false;
};

type DropdownExternalItemProps = {
  href: string;
  label: string;
  icon: ReactNode;
  trailingIcon?: ReactNode;
  onClose: () => void;
  isExternal: true;
};

const DropdownItem: FC<DropdownItemProps> = ({
  href,
  label,
  icon,
  badge,
  isActive,
  onClose,
}) => {
  return (
    <RouterLink
      to={href}
      onClick={onClose}
      className={classNames(
        'flex w-full items-center gap-3 rounded-lg px-4 py-3',
        isActive
          ? selectedNavBackgroundClasses
          : 'text-default hover:bg-overlay-faint active:bg-overlay-faint',
      )}
    >
      <span className="flex shrink-0">{icon}</span>
      <span className="grow text-sm">{label}</span>
      {badge !== null && badge !== undefined && badge > 0 && (
        <NavLinkBadge count={badge} subtle={false} />
      )}
    </RouterLink>
  );
};

DropdownItem.displayName = 'DropdownItem';

const DropdownExternalItem: FC<DropdownExternalItemProps> = ({
  href,
  label,
  icon,
  trailingIcon,
  onClose,
}) => {
  return (
    <ExternalLink
      href={href}
      title={label}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-default hover:bg-overlay-faint active:bg-overlay-faint"
      onClick={onClose}
    >
      <span className="flex shrink-0">{icon}</span>
      <span className="grow text-sm">{label}</span>
      {trailingIcon && (
        <span className="flex shrink-0 text-muted">{trailingIcon}</span>
      )}
    </ExternalLink>
  );
};

DropdownExternalItem.displayName = 'DropdownExternalItem';

type MobileNavDropdownProps = {
  onClose: () => void;
  hrefs: ReturnType<typeof useMobileNavState>['hrefs'];
  active: ReturnType<typeof useMobileNavState>['active'];
  notificationsCount: number;
  inboxCount: number;
  updatesUnseenCount: number;
  profileHref: string;
};

const MobileNavDropdown: FC<MobileNavDropdownProps> = memo(
  ({
    onClose,
    hrefs,
    active,
    notificationsCount,
    inboxCount,
    profileHref,
    updatesUnseenCount,
  }) => {
    const { developerModeEnabled } = useUserAppContext();
    const currentUser = useCurrentUser();

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute left-0 right-0 top-full z-50 mx-3 overflow-hidden rounded-b-xl border border-t-0 shadow-xl bg-app border-default">
          <div className="px-2 py-2">
            <DropdownItem
              href={hrefs.home}
              label="Home"
              icon={<HomeIcon size={16} />}
              isActive={active.home}
              onClose={onClose}
            />
            <DropdownItem
              href={hrefs.notifications}
              label="Notifications"
              icon={<BellIcon size={16} />}
              badge={notificationsCount}
              isActive={active.notifications}
              onClose={onClose}
            />
            <DropdownItem
              href={hrefs.directCasts}
              label="Direct Casts"
              icon={<Send size={16} />}
              badge={inboxCount}
              isActive={active.directCasts}
              onClose={onClose}
            />
            <DropdownItem
              href={hrefs.referrals}
              label="Referrals"
              icon={<UserPlusIcon size={16} />}
              isActive={active.referrals}
              onClose={onClose}
            />
            <DropdownItem
              href={hrefs.saved}
              label="Saved"
              icon={<Archive size={16} />}
              isActive={active.saved}
              onClose={onClose}
            />
            <DropdownItem
              href={hrefs.apps}
              label="Apps"
              icon={<Grid3X3Icon size={16} />}
              isActive={active.apps}
              onClose={onClose}
            />
            <DropdownItem
              href={hrefs.settings}
              label="Settings"
              icon={<GearIcon />}
              isActive={active.settings}
              onClose={onClose}
            />
            {developerModeEnabled && (
              <DropdownItem
                href={hrefs.developers}
                label="Developers"
                icon={<GearIcon />}
                isActive={false}
                onClose={onClose}
              />
            )}
            <DropdownItem
              href={hrefs.updates}
              label="Updates"
              icon={<Megaphone size={16} />}
              badge={updatesUnseenCount}
              isActive={active.updates}
              onClose={onClose}
            />
            <RouterLink
              to={profileHref}
              title="Profile"
              className={classNames(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3',

                'text-default hover:bg-overlay-faint active:bg-overlay-faint',
              )}
            >
              <span className="flex shrink-0">
                <AvatarImage
                  imgUrl={currentUser.pfp?.url}
                  imgAlt={currentUser.displayName || currentUser.username || ''}
                  size="sm1"
                  className="hover:bg-transparent"
                />
              </span>
              <span className="grow text-sm">Profile</span>
            </RouterLink>
          </div>
        </div>
      </>
    );
  },
);

MobileNavDropdown.displayName = 'MobileNavDropdown';

const MobileHeaderInner: FC = memo(() => {
  const currentUser = useCurrentUser();
  const { trackEvent } = useAnalytics();
  const currentUserProfileCastsLinkProps = useCurrentUserProfileCastsLinkProps({
    title: 'Profile',
  });
  const location = useLocation();
  const { hasBackgroundedSession, openComposer, resumeComposer } =
    useCastComposerSession();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const {
    hrefs,
    active,
    currentPageTitle,
    notificationsCount,
    inboxCount,
    updatesUnseenCount,
  } = useMobileNavState();

  const profileHref = useMemo(() => {
    const { to, params } = currentUserProfileCastsLinkProps;
    return hydratePath({
      path: routes[to].path,
      params: params as Record<string, string | undefined>,
      searchParams: undefined,
    });
  }, [currentUserProfileCastsLinkProps]);

  return (
    <div className="relative">
      <nav className="sticky top-0 z-50 flex w-full flex-row items-center justify-between gap-2 border-b px-3 py-2 bg-app border-default">
        {isSearchOpen ? (
          <>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="flex shrink-0 items-center justify-center rounded-lg p-1.5 hover:bg-overlay-faint active:bg-overlay-faint"
              aria-label="Close search"
            >
              <XIcon size={18} className="text-default" />
            </button>
            <div className="flex-1">
              <Search showClearIcon autoFocus />
            </div>
          </>
        ) : (
          <>
            <RouterLink
              to={profileHref}
              title="Profile"
              className="flex shrink-0 items-center"
            >
              <AvatarImage
                imgUrl={currentUser.pfp?.url}
                imgAlt={currentUser.displayName || currentUser.username || ''}
                size="sm1"
              />
            </RouterLink>

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex flex-1 items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-overlay-faint active:bg-overlay-faint"
            >
              <span className="text-base font-semibold text-default">
                {currentPageTitle ?? 'Menu'}
              </span>
              <ChevronDown
                size={14}
                className={classNames(
                  'text-muted transition-transform duration-150',
                  isMenuOpen && 'rotate-180',
                )}
              />
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex shrink-0 items-center justify-center rounded-lg p-1.5 hover:bg-overlay-faint active:bg-overlay-faint"
              aria-label="Search"
            >
              <SearchIcon size={18} className="text-default" />
            </button>

            {active.apps && !hasBackgroundedSession ? (
              <ComposeCastButton
                size="sm"
                onClick={() =>
                  window.open(
                    'https://neynar.com/studio',
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                Create
              </ComposeCastButton>
            ) : (
              <ComposeCastButton
                size="sm"
                onClick={() => {
                  if (hasBackgroundedSession) {
                    resumeComposer();
                    return;
                  }

                  trackEvent(AnalyticsEvent.AddCastModalShown, undefined);
                  openComposer();
                }}
              >
                {hasBackgroundedSession ? 'Resume' : 'Cast'}
              </ComposeCastButton>
            )}
          </>
        )}
      </nav>

      {!isSearchOpen && isMenuOpen && (
        <MobileNavDropdown
          onClose={() => setIsMenuOpen(false)}
          hrefs={hrefs}
          active={active}
          notificationsCount={notificationsCount}
          inboxCount={inboxCount}
          updatesUnseenCount={updatesUnseenCount}
          profileHref={profileHref}
        />
      )}
    </div>
  );
});

MobileHeaderInner.displayName = 'MobileHeaderInner';

const MobileHeader: FC = memo(() => {
  const { inStandaloneMode } = useStandaloneMode();
  const isSignedIn = useIsSignedIn();

  const isHidden = inStandaloneMode || !isSignedIn;

  if (isHidden) {
    return null;
  }

  return (
    <div className="sm:hidden">
      <MobileHeaderInner />
    </div>
  );
});

MobileHeader.displayName = 'MobileHeader';

export { MobileHeader };
