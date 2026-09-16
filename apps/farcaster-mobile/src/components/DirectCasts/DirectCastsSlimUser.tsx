import { ApiUser, ApiUserMinimal } from 'farcaster-client-data';
import { useGloballyCachedUser } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { UserUsername } from '~/components/users/UserUsername';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

export type DirectCastsSlimUserProps = {
  user: ApiUser | ApiUserMinimal;
  userAction?: React.ReactElement | null;
  lastInList: boolean;
  onUserPressOverride?: () => void;
  onUserPressCallback?: () => void;
};

const DirectCastsSlimUser: FC<DirectCastsSlimUserProps> = memo(
  ({
    user: userFallback,
    userAction,
    onUserPressOverride,
    onUserPressCallback,
    lastInList,
  }) => {
    const t = useTheme();

    const pushToUserProfile = usePushToUserProfile();

    const user = useGloballyCachedUser({ fallback: userFallback as ApiUser });

    const { fid, pfp } = user;

    return (
      <Pressable
        style={[t.flex, t.flexRow, t.itemsCenter]}
        onPress={() => {
          if (typeof onUserPressOverride === 'function') {
            onUserPressOverride();
          } else {
            if (typeof onUserPressCallback === 'function') {
              onUserPressCallback();
            } else {
              pushToUserProfile({ fid });
            }
          }
        }}
      >
        <Avatar pfpUrl={pfp?.url} diameter={36} style={[t.pX2]} />
        <View
          style={[
            t.flexGrow,
            t.flexShrink,
            t.flexCol,
            t.mL4,

            !lastInList && [t.borderDefault, t.borderBHairline],
          ]}
        >
          <View
            style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween, t.pY1]}
          >
            <UserUsername
              user={user}
              variant="direct"
              onUserPressCallback={onUserPressCallback}
            />
            {userAction && <View style={[t.m2]}>{userAction}</View>}
          </View>
        </View>
      </Pressable>
    );
  },
);

DirectCastsSlimUser.displayName = 'DirectCastsSlimUser';

export { DirectCastsSlimUser };
