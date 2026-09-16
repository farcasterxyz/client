import { PreloadLazyComponentError, sleep } from 'farcaster-client-hooks';

import { Composer, LoginQRCode } from '~/lazy/components';
import {
  ChannelPage,
  ChannelsPage,
  FollowingPage,
  HomeFeedPage,
  NotificationsPage,
  ProfileCastsAndRepliesWithUsernamePage,
  ProfileCastsWithUsernamePage,
  ProfileLikesWithUsernamePage,
  SettingsConnectedAddressesPage,
  SettingsNotificationsPage,
  UsersForYouPage,
} from '~/lazy/pages';
import { trackError } from '~/utils/errorUtils';

const initialDelay = 750;

// Lazy pages/components to preload. These will be loaded serially, so order matters.
// Beginning of the list is highest priority.
const lazyComponents = [
  HomeFeedPage,
  FollowingPage,
  NotificationsPage,
  ChannelsPage,
  ChannelPage,
  UsersForYouPage,
  ProfileCastsWithUsernamePage,
  ProfileCastsAndRepliesWithUsernamePage,
  ProfileLikesWithUsernamePage,
  LoginQRCode,
  Composer,
  SettingsNotificationsPage,
  SettingsConnectedAddressesPage,
];

const initPreloadLazyComponents = async () => {
  await sleep(initialDelay);

  for (const { preload } of lazyComponents) {
    try {
      await preload();
    } catch (error) {
      trackError(new PreloadLazyComponentError({ error }));
    }
  }
};

export { initPreloadLazyComponents };
