import { ApiChannel } from 'farcaster-client-data';

import { useUserAppContext } from '~/contexts/UserAppContextProvider';

export const useChannelModOrOwner = (channelKey: string) => {
  const appContext = useUserAppContext();

  if (appContext.adminForChannelKeys.has(channelKey)) {
    return 'owner' as const;
  }

  if (appContext.modOfChannelKeys.has(channelKey)) {
    return 'moderator' as const;
  }

  return undefined;
};

export const useUserChannelRole = (channel: ApiChannel) => {
  const appContext = useUserAppContext();

  if (appContext.adminForChannelKeys.has(channel.key)) {
    return 'owner' as const;
  }

  if (appContext.modOfChannelKeys.has(channel.key)) {
    return 'moderator' as const;
  }

  if (channel.viewerContext.isMember) {
    return 'member' as const;
  }

  return null;
};
