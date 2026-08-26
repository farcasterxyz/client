import { SignOutIcon } from '@primer/octicons-react';
import { FC, memo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { SettingsNavLink } from '~/components/links/SettingsNavLink';
import { SettingsNavLinkLabel } from '~/components/links/SettingsNavLinkLabel';
import { LogoutModal } from '~/components/modals/LogoutModal';
import { ThemeSettings } from '~/components/settings/ThemeSettings';
import { appSettingsPathPrefix } from '~/constants/routePrefixes';

const SettingsNav: FC = memo(() => {
  const [isLogoutModalVisible, setIsLogoutModalVisible] =
    useState<boolean>(false);
  const [isThemeSettingsVisible, setIsThemeSettingsVisible] =
    useState<boolean>(false);

  const { pathname } = useLocation();
  const isSettingsRoot = pathname === appSettingsPathPrefix;

  const navLinks = (
    <>
      <SettingsNavLink
        to="settingsNotifications"
        params={{}}
        searchParams={{}}
        title="Notification settings"
      >
        <SettingsNavLinkLabel>Notifications</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsImport"
        params={{}}
        searchParams={{}}
        title="Profiles from X"
      >
        <SettingsNavLinkLabel>Profiles from X / Twitter</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsConnectedAddresses"
        params={{}}
        searchParams={{}}
        title="Verified addresses"
      >
        <SettingsNavLinkLabel>Verified addresses</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsPreferredWallet"
        params={{}}
        searchParams={{}}
        title="Preferred wallet"
      >
        <SettingsNavLinkLabel>Preferred wallet</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsDirectCasts"
        params={{}}
        searchParams={{}}
        title="Direct Casts"
      >
        <SettingsNavLinkLabel>Direct Casts</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsStorage"
        params={{}}
        searchParams={{}}
        title="Storage"
      >
        <SettingsNavLinkLabel>Storage</SettingsNavLinkLabel>
      </SettingsNavLink>
      {/* Actions removed */}
      <SettingsNavLink
        to="settingsFrames"
        params={{}}
        searchParams={{}}
        title="Mini Apps"
      >
        <SettingsNavLinkLabel>Mini Apps</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsFeeds"
        params={{}}
        searchParams={{}}
        title="Feeds"
      >
        <SettingsNavLinkLabel>Feeds</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsMutesAndBlocks"
        params={{}}
        searchParams={{}}
        title="Mute and block"
      >
        <SettingsNavLinkLabel>Mute and block</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="settingsDeveloperTools"
        params={{}}
        searchParams={{}}
        title="Developer tools"
      >
        <SettingsNavLinkLabel>Developer tools</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="#"
        params={{}}
        searchParams={{}}
        title="Theme"
        onClick={(e) => {
          e.preventDefault();
          setIsThemeSettingsVisible(true);
        }}
      >
        <SettingsNavLinkLabel>Theme</SettingsNavLinkLabel>
      </SettingsNavLink>
      <SettingsNavLink
        to="#"
        params={{}}
        searchParams={{}}
        title="Log out"
        onClick={(e) => {
          e.preventDefault();
          setIsLogoutModalVisible(true);
        }}
        icon={<SignOutIcon />}
      >
        <SettingsNavLinkLabel>Log out</SettingsNavLinkLabel>
      </SettingsNavLink>
      {isThemeSettingsVisible && (
        <ThemeSettings
          onClose={() => {
            setIsThemeSettingsVisible(false);
          }}
        />
      )}
      {isLogoutModalVisible && (
        <LogoutModal
          onClose={() => {
            setIsLogoutModalVisible(false);
          }}
        />
      )}
    </>
  );

  return (
    <div className={isSettingsRoot ? 'w-full sm:w-auto' : 'sm:w-auto'}>
      {/* Mobile: full-screen nav list only at /~/settings root */}
      {isSettingsRoot && (
        <nav className="flex w-full flex-col sm:hidden">{navLinks}</nav>
      )}
      {/* Desktop: always-visible sidebar */}
      <nav className="hidden min-h-screen w-[212px] shrink-0 flex-col border-r border-default sm:flex lg:w-[393px]">
        {navLinks}
      </nav>
    </div>
  );
});

SettingsNav.displayName = 'SettingsNav';

export { SettingsNav };
