import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import { Platform } from 'react-native';

enum VisibilityActionType {
  Mute = 'mute',
  Block = 'block',
  Unmute = 'unmute',
}

const getUserVisibilityMenuActions = ({
  targetUserInvisible,
  targetUserBlocked,
}: {
  targetUserInvisible: boolean;
  targetUserBlocked: boolean;
}) => {
  if (targetUserInvisible) {
    return [
      {
        id: VisibilityActionType.Unmute,
        title: targetUserBlocked ? 'Unblock user' : 'Unmute user',
        image: Platform.select({
          ios: 'speaker',
        }),
      },
    ];
  } else {
    return [
      {
        id: VisibilityActionType.Mute,
        title: 'Mute user',
        image: Platform.select({
          ios: 'speaker.slash',
        }),
      },
      {
        id: VisibilityActionType.Block,
        title: 'Block user',
        image: Platform.select({
          ios: 'nosign',
        }),
        attributes: {
          destructive: true,
        },
      },
    ];
  }
};

const getUserMarkInvisibleDisclaimer = ({
  user,
  // separate from user.viewerContext?.blocking because
  // that may not be updated
  blocked,
}: {
  user: ApiUser;
  blocked: boolean;
}) => {
  const usernameWithFallback = resolveUsername({
    username: user.username,
    fid: user.fid,
  });
  return `${usernameWithFallback} is ${blocked ? 'blocked' : 'muted'}`;
};

const getUserMarkVisibleDisclaimer = ({
  user,
  unblock = false,
}: {
  user: ApiUser;
  unblock?: boolean;
}) => {
  const usernameWithFallback = resolveUsername({
    username: user.username,
    fid: user.fid,
  });
  return `${usernameWithFallback} is ${
    unblock
      ? 'unblocked'
      : user.viewerContext?.blocking
        ? 'unblocked'
        : 'unmuted'
  }`;
};

export {
  getUserMarkInvisibleDisclaimer,
  getUserMarkVisibleDisclaimer,
  getUserVisibilityMenuActions,
  VisibilityActionType,
};
