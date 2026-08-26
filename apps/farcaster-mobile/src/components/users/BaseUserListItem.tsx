import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { ReactElement, useCallback, useMemo } from 'react';
import { FlexStyle, Pressable, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { FollowersYouKnowContent } from '~/components/headers/FollowersYouKnowContent';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

export type BaseUserListItemProps = {
  user: ApiUser;
  skipSeperator: boolean;
  Badge?: ReactElement | null;
  Action?: ReactElement | null;
  ActionAlign?: 'center' | 'flex-start';
  onPress?: () => void;
};

export function BaseUserListItem({
  user,
  skipSeperator,
  Badge,
  Action,
  ActionAlign,
  onPress,
}: BaseUserListItemProps) {
  const t = useTheme();
  const pushToUserProfile = usePushToUserProfile();

  const viewProfile = useCallback(() => {
    pushToUserProfile({ fid: user.fid });
  }, [pushToUserProfile, user.fid]);

  const FollowersYouKnow = useMemo(() => {
    const followersYouKnow = user.viewerContext?.followersYouKnow;

    if (followersYouKnow) {
      return (
        <View style={[{ paddingTop: 10, paddingBottom: 2 }]}>
          <FollowersYouKnowContent {...followersYouKnow} condensed />
        </View>
      );
    }

    return null;
  }, [user.viewerContext?.followersYouKnow]);

  const actionAlignStyles: FlexStyle = { alignItems: ActionAlign };

  return (
    <Pressable
      onPress={onPress ? onPress : viewProfile}
      style={[
        t.pY2,
        t.flexRow,
        t.wFull,
        t.justifyBetween,
        { gap: 11 },
        ...(skipSeperator ? [] : [t.borderTHairline, t.borderDefault]),
      ]}
    >
      <Avatar pfpUrl={user.pfp?.url} diameter={48} />
      <View style={[t.flex1]}>
        <View
          style={[
            t.flex1,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 12 },
          ]}
        >
          <View style={[t.flex1]}>
            <View
              style={[t.flexShrink, t.flexRow, actionAlignStyles, { gap: 6 }]}
            >
              <Text2 weight="semibold" numberOfLines={1} style={[t.flexShrink]}>
                {user.displayName}
              </Text2>
              <View style={[t.flexNone]}>{Badge}</View>
            </View>
            <Text2 color="secondary" size="sm">
              {resolveUsername(user)}
            </Text2>
          </View>
          <View style={[t.flexNone]}>{Action}</View>
        </View>
        {FollowersYouKnow}
      </View>
    </Pressable>
  );
}
