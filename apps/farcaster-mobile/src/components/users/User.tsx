import { Octicons } from '@expo/vector-icons';
import { ApiUser } from 'farcaster-client-data';
import { useGloballyCachedUser } from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text } from '~/components/Text';
import { FollowAnalyticsData } from '~/components/users/types';
import { UserDisplayNameStyle } from '~/components/users/UserDisplayNameWithBadges';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserHeight } from '~/contexts/UserHeightProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useLinkifyText } from '~/hooks/useLinkifyText';

import { FollowButton } from './FollowButton';
import { UserDisplayNameUsername } from './UserDisplayNameUsername';

export type UserProps = {
  user: ApiUser;
  hideBio: boolean;
  hideFollowsYou?: boolean;
  showFollowing?: boolean;
  userActionOverride?: React.ReactElement | null;
  withNoWrapperStyles?: boolean;
  withNoBorderBottomStyle?: boolean;
  onUserPressOverride?: () => void;
  onUserPressCallback?: () => void;
  slimFollowButton?: boolean;
  displayNameStyle?: UserDisplayNameStyle;
  showSocialProof?: boolean;
  followButtonTextForFollowers?: string;
  analyticsData?: FollowAnalyticsData;
};

const User: FC<UserProps> = memo(
  ({
    user: userFallback,
    hideBio,
    hideFollowsYou = false,
    showFollowing = false,
    withNoWrapperStyles = false,
    withNoBorderBottomStyle = false,
    userActionOverride,
    onUserPressOverride,
    onUserPressCallback,
    displayNameStyle = 'base',
    showSocialProof = false,
    analyticsData,
  }) => {
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();
    const { getUserHeight, setUserHeight } = useUserHeight();

    const user = useGloballyCachedUser({ fallback: userFallback });

    const { fid, pfp } = user;

    const { linkifiedText: bioText } = useLinkifyText({
      text: (user.profile?.bio.text ?? '').replace(/\n/g, ' '),
      mentions: user.profile?.bio.mentions,
      channelMentions: user.profile.bio.channelMentions,
    });
    const hasBioText = !!user.profile?.bio.text;
    const hasAndShowsBio = !hideBio && hasBioText;
    const isFollowingViewer = !!user.viewerContext?.followedBy;
    const isFollowedByViewer = !!user.viewerContext?.following;

    const socialProofText = useMemo(() => {
      if (
        user.viewerContext?.followersYouKnow &&
        user.viewerContext.followersYouKnow.users.length > 0
      ) {
        // pick top follower at random from list
        const topFollower =
          user.viewerContext.followersYouKnow.users[
            Math.floor(
              Math.random() * user.viewerContext.followersYouKnow.users.length,
            )
          ];
        const topFollowerUsername = `@${topFollower.username}`;
        const othersCount = user.viewerContext.followersYouKnow.totalCount - 1;
        const othersText =
          othersCount > 0
            ? ` and ${othersCount} other${othersCount > 1 ? 's' : ''} follow`
            : ' follows';
        return `${topFollowerUsername}${othersText}`;
      } else if (user.viewerContext?.followedBy) {
        return 'Follows you';
      }
      return null;
    }, [user]);

    const userAction = useMemo(() => {
      if (userActionOverride !== undefined) {
        return userActionOverride;
      }

      return (
        <FollowButton
          targetUser={user}
          size="xs"
          presentation="list"
          extraFollowAnalyticsData={analyticsData}
        />
      );
    }, [analyticsData, user, userActionOverride]);

    return (
      <Pressable
        style={{
          minHeight: getUserHeight({
            fid,
            hasAndShowsBio,
            hideFollowsYou,
            isFollowingViewer,
            withNoWrapperStyles,
            showSocialProof,
          }),
        }}
        onLayout={(e) => {
          setUserHeight(
            {
              fid,
              hasAndShowsBio,
              hideFollowsYou,
              isFollowingViewer,
              withNoWrapperStyles,
              showSocialProof,
            },
            e.nativeEvent.layout.height,
          );
        }}
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
        <View
          style={[
            !withNoWrapperStyles && [t.pX4, t.pY3],
            !withNoBorderBottomStyle && [t.borderDefault, t.borderBHairline],
          ]}
        >
          <View style={[t.flexRow, t.itemsStart, t.justifyBetween]}>
            <Avatar pfpUrl={pfp?.url} />
            <View style={[t.flexGrow, t.flexShrink, t.flexCol, t.mL2]}>
              <View
                style={[
                  t.flexRow,
                  t.itemsStart,
                  t.justifyBetween,
                  t.flexGrow,
                  { minHeight: defaultThumbnailDiameter },
                ]}
              >
                <UserDisplayNameUsername
                  user={user}
                  hideFollowsYou={hideFollowsYou}
                  isFollowingViewer={isFollowingViewer}
                  showFollowing={showFollowing}
                  isFollowedByViewer={isFollowedByViewer}
                  onUserPressCallback={onUserPressCallback}
                  style={displayNameStyle ?? 'base'}
                />
                {userAction && <View style={[t.mT2, t.mL2]}>{userAction}</View>}
              </View>
              {hasAndShowsBio && (
                <View style={[t.flexRow, t.flexGrow]}>
                  <Text style={[t.texts.primary, t.textBase, t.flex1]}>
                    {bioText}
                  </Text>
                </View>
              )}
              {showSocialProof && (
                <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                  {socialProofText && (
                    <Octicons
                      name="person-fill"
                      size={16}
                      style={[t.texts.tertiary, t.pT1, t.pR1]}
                    />
                  )}
                  <Text
                    style={[
                      t.texts.tertiary,
                      socialProofText ? t.textBase : t.textSm,
                      t.flex1,
                    ]}
                  >
                    {socialProofText
                      ? socialProofText
                      : hasBioText
                        ? (user.profile?.bio.text ?? '').replace(/\n/g, ' ')
                        : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

User.displayName = 'User';

export { User };
