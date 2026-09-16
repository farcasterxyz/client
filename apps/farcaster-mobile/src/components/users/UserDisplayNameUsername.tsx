import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import { convertHexToRGBA } from 'farcaster-expo';
import React, { FC, useMemo } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';

import { Text } from '~/components/Text';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

import {
  UserDisplayNameStyle,
  UserDisplayNameWithBadges,
} from './UserDisplayNameWithBadges';

interface UserDisplayNameUsernameProps {
  user: ApiUser;
  isFollowingViewer?: boolean;
  isFollowedByViewer?: boolean;
  headerSizing?: boolean;
  directCastsHeaderSizing?: boolean;
  hideFollowsYou?: boolean;
  showFollowing?: boolean;
  style: UserDisplayNameStyle;
  customStyle?: StyleProp<TextStyle>;
  onUserPressCallback?: () => void;
  hideProBadge?: boolean;
  showUpsell?: boolean;
}

const UserDisplayNameUsername: FC<UserDisplayNameUsernameProps> = ({
  user,
  headerSizing,
  directCastsHeaderSizing = false,
  hideFollowsYou = false,
  showFollowing = false,
  hideProBadge = false,
  showUpsell = false,
  isFollowingViewer,
  isFollowedByViewer,
  style,
  customStyle,
  onUserPressCallback = undefined,
}) => {
  const t = useTheme();

  const currentUser = useCurrentUser_UNSAFE();

  const usernameStyles = headerSizing
    ? [t.texts.secondary, t.textBase, t.mB1]
    : directCastsHeaderSizing
      ? [t.texts.tertiary, t.textSm]
      : [t.texts.secondary, t.textBase];

  // When not shown as header we need to align the display and username lines
  // vertically in the middle of the avatar
  const displayNameViewStyles = headerSizing
    ? []
    : [t.flexRow, t.itemsCenter, { height: defaultThumbnailDiameter }];

  const fid = user.fid;
  const username = user.username;

  // This is for smaller screens we will push the "follows you" label
  // to next line instead. (goksu)
  const handleLongUsername = username && username.length > 10 && !headerSizing;

  const usernameToDisplay = resolveUsername({
    username,
    fid,
  });

  // Determine whether and what pill to show about following/followed status
  const [followPill, showFollowPillOnNewLine] = useMemo(() => {
    const showFollowsYouPill =
      !hideFollowsYou && isFollowingViewer && fid !== currentUser.fid;

    const showFollowingPill =
      showFollowing && isFollowedByViewer && fid !== currentUser.fid;

    // Show pill on a new line line if we are in a list and the username is too long
    const showFollowsYouOnNewLine = !headerSizing && handleLongUsername;

    let followPillText;
    if (showFollowsYouPill && showFollowingPill) {
      followPillText = 'Following each other';
    } else if (showFollowingPill) {
      followPillText = 'Following';
    } else if (showFollowsYouPill) {
      followPillText = 'Follows you';
    }

    const followsYouComp = followPillText && (
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.border,
          {
            borderColor: t.dark
              ? convertHexToRGBA(t.colors.white, 0.2)
              : t.colors.iron,
          },
          t.rounded,
          t.w22,
          t.h5,
          showFollowsYouOnNewLine
            ? [t.mL0, t.mB1, { marginTop: 2 }]
            : [t.mL2, t.mB0, { marginTop: 0 }],
          { backgroundColor: convertHexToRGBA(t.colors.white, 0.1) },
        ]}
      >
        <Text style={[t.texts.primary, t.textXs, t.textCenter]}>
          {followPillText}
        </Text>
      </View>
    );

    return [followsYouComp, showFollowsYouOnNewLine];
  }, [
    hideFollowsYou,
    isFollowingViewer,
    fid,
    currentUser.fid,
    showFollowing,
    isFollowedByViewer,
    headerSizing,
    handleLongUsername,
    t,
  ]);

  const usernameComp = usernameToDisplay && (
    <Text style={usernameStyles} numberOfLines={1}>
      {usernameToDisplay}
    </Text>
  );

  return (
    <View style={[t.flexCol, t.flexShrink]}>
      <View style={displayNameViewStyles}>
        <View style={[t.flexShrink]}>
          <UserDisplayNameWithBadges
            user={user}
            disabled={false}
            style={style}
            customStyle={customStyle}
            onUserPressCallback={onUserPressCallback}
            hideProBadge={hideProBadge}
            showUpsell={showUpsell}
          />
          {followPill && !showFollowPillOnNewLine ? (
            <View style={[t.flexRow, t.itemsCenter, t.mB1]}>
              {usernameComp}
              {followPill}
            </View>
          ) : (
            usernameComp
          )}
        </View>
      </View>
      {showFollowPillOnNewLine && followPill}
    </View>
  );
};

UserDisplayNameUsername.displayName = 'DisplayNameUsername';

export { UserDisplayNameUsername };
