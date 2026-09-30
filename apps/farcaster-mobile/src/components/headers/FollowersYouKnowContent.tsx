import { ApiUser } from 'farcaster-client-data';
import { formatShorthandNumber, resolveUsername } from 'farcaster-client-hooks';
import React from 'react';
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Text, Text2 } from '~/components/Text';
import { UserCards } from '~/components/UserCards';
import { useTheme } from '~/contexts/ThemeProvider';

type FollowersYouKnowContentProps = {
  users: ApiUser[];
  totalCount: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  condensed?: boolean;
  size?: 'xs' | 'sm' | 'profile';
};

const FollowersYouKnowContent: React.FC<FollowersYouKnowContentProps> = ({
  users,
  totalCount,
  onPress,
  style,
  condensed,
  size = 'xs',
}) => {
  const t = useTheme();

  const finalUsers = React.useMemo(() => {
    return users;
  }, [users]);

  const avatars = React.useMemo(() => {
    return <UserCards users={finalUsers} condensed={condensed} size={size} />;
  }, [condensed, finalUsers, size]);

  const textStyles = React.useMemo(() => [t.textSm], [t]);

  const details = React.useMemo(() => {
    if (condensed) {
      return (
        <Text2 color="secondary" size={size === 'profile' ? 'sm' : size}>
          {formatShorthandNumber(totalCount)}{' '}
          {totalCount > 1 ? 'followers' : 'follower'} you know
        </Text2>
      );
    }

    return (
      <View style={[t.flex1]}>
        <Text style={[t.texts.secondary, ...textStyles]}>
          Followed by{' '}
          {finalUsers.map(({ username, fid }, index) => {
            return (
              <Text key={fid} style={[t.texts.secondary, ...textStyles]}>
                {resolveUsername({ username, fid })}
                {finalUsers.length - 1 === index ? '' : ', '}
              </Text>
            );
          })}{' '}
          {totalCount - finalUsers.length !== 0 && (
            <Text style={[t.texts.secondary, ...textStyles]}>
              and{' '}
              <Text style={[t.texts.secondary, ...textStyles]}>
                {totalCount - finalUsers.length}
              </Text>{' '}
              {'others you know'}
            </Text>
          )}
        </Text>
      </View>
    );
  }, [
    condensed,
    size,
    finalUsers,
    t.flex1,
    t.texts.secondary,
    textStyles,
    totalCount,
  ]);

  if (totalCount === 0) {
    return null;
  }

  if (condensed) {
    return (
      <TouchableOpacity
        style={[t.flex, t.flexRow, t.itemsCenter, { height: 20, gap: 8 }]}
        activeOpacity={0.65}
        onPress={onPress}
      >
        {avatars}
        {details}
      </TouchableOpacity>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        style={[t.flex, t.flexRow, t.itemsCenter, style]}
        activeOpacity={0.65}
        onPress={onPress}
      >
        {avatars}
        {details}
      </TouchableOpacity>
    );
  } else {
    return (
      <View style={[t.flex, t.flexRow, t.itemsCenter]}>
        {avatars}
        {details}
      </View>
    );
  }
};

FollowersYouKnowContent.displayName = 'FollowersYouKnowContent';

export { FollowersYouKnowContent };
