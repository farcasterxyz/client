import { ApiUser } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

type UserCardsProps = {
  users: ApiUser[];
  condensed?: boolean;
  size?: 'xs' | 'sm' | 'profile';
};

export const UserCards: React.FC<UserCardsProps> = ({
  users,
  condensed = false,
  size = 'xs',
}) => {
  const t = useTheme();

  if (condensed) {
    const avatarSize = size === 'profile' ? 32 : size === 'xs' ? 16 : 20;

    return (
      <View style={[t.flex, t.flexRow]}>
        {users.map(({ pfp, username }, index) => (
          <View
            key={username}
            style={{
              marginLeft: index > 0 ? -6 : 0,
              borderColor: t.colors.bgDefault,
            }}
          >
            <Avatar pfpUrl={pfp?.url} diameter={avatarSize} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        t.selfStart,
        { width: (users.length - 1) * 36 * 0.8 + 36 + sizes.s3 },
      ]}
    >
      <View style={[t.relative, { height: 36 }]}>
        {users.map(({ pfp, username }, index) => (
          <View
            key={`${username}|${pfp?.url}`}
            style={[t.absolute, { left: index * 36 * 0.8 }]}
          >
            <Avatar pfpUrl={pfp?.url} diameter={36} />
          </View>
        ))}
      </View>
    </View>
  );
};

UserCards.displayName = 'UserCards';
