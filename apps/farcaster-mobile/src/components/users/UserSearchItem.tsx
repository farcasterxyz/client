import { ApiUser } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  useGloballyCachedUser,
} from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useRecentlyViewedUsers } from '~/hooks/useRecentlyViewedUser';

import { FollowButton } from './FollowButton';

type UserSearchItemProps = {
  user: ApiUser;
  showBio?: boolean;
};

const UserSearchItem: FC<UserSearchItemProps> = memo(
  ({ user: userFallback, showBio = false }) => {
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();
    const { updateRecentlyViewedUsers } = useRecentlyViewedUsers();

    const user = useGloballyCachedUser({ fallback: userFallback });

    const { fid, pfp } = user;

    const isProUser = useUserLevel(user) === 'pro';

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          pushToUserProfile({ fid });
          updateRecentlyViewedUsers({ fid });
        }}
      >
        <View
          style={[t.p3, t.flexRow, t.itemsCenter, t.justifyBetween, { gap: 8 }]}
        >
          <Avatar pfpUrl={pfp?.url} diameter={40} />
          <View style={[t.flex1, { gap: 4 }]}>
            <View
              style={[t.flexRow, t.justifyBetween, t.itemsStart, { gap: 12 }]}
            >
              <View style={[t.flex1, { gap: 2 }]}>
                <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                  <Text2 weight="medium" numberOfLines={1} ellipsizeMode="tail">
                    {user.username}
                  </Text2>
                  {isProUser && <FarcasterProBadge size={18} />}
                </View>
                <Text2
                  size="sm"
                  color="tertiary"
                  style={[t.flexShrink]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatShorthandNumber(user.followerCount)} followers
                </Text2>
              </View>
              <FollowButton targetUser={user} size="xs" presentation="list" />
            </View>
            {showBio && user.profile.bio && (
              <Text2
                size="sm"
                style={[t.flexShrink]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {user.profile.bio.text}
              </Text2>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

UserSearchItem.displayName = 'UserSearchItem';

export { UserSearchItem };
