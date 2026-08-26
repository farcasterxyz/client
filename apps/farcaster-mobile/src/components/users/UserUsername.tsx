import { ApiUser } from 'farcaster-client-data';
import {
  CastClickType,
  resolveUsernameShort,
  useTrackCastClick,
  useUserLinkHelpers,
} from 'farcaster-client-hooks';
import React, { FC, useCallback, useMemo } from 'react';
import { Pressable, StyleProp, TextStyle, View } from 'react-native';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { TextWithPress } from '~/components/TextWithPress';
import { bodyFontSize, bodyLineHeight } from '~/constants/Cast';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

interface UserUsernameProps {
  user: ApiUser;
  variant?: 'header' | 'direct' | 'custom' | 'base';
  disabled?: boolean;
  customStyle?: StyleProp<TextStyle>;
  onUserPressCallback?: () => void;
}

const UserUsername: FC<UserUsernameProps> = ({
  user,
  variant = 'base',
  disabled = false,
  onUserPressCallback = undefined,
  customStyle,
}) => {
  const t = useTheme();

  const pushToUserProfile = usePushToUserProfile();

  const { shouldLinkToUser } = useUserLinkHelpers();
  const trackCastClick = useTrackCastClick();
  const usernameStyles = useMemo(() => {
    switch (variant) {
      case 'header':
        return [t.texts.primary, t.textLg, t.fontBold, t.flexShrink];
      case 'direct':
        return [
          t.texts.primary,
          t.flexShrink,
          t.textBase,
          t.fontNormal,
          [
            {
              fontSize: 16,
              lineHeight: 22,
              letterSpacing: -0.25,
            },
          ],
        ];
      case 'custom':
        return customStyle ?? [];
      case 'base':
      default:
        return [
          t.texts.primary,
          t.fontBold,
          t.flexShrink,
          { fontSize: bodyFontSize, lineHeight: bodyLineHeight },
        ];
    }
  }, [
    customStyle,
    t.flexShrink,
    t.fontBold,
    t.fontNormal,
    t.textBase,
    t.texts.primary,
    t.textLg,
    variant,
  ]);

  const fid = user.fid;
  const username = user.username;

  const usernameToDisplay = resolveUsernameShort({
    username,
    fid,
  });

  const onPressUsername = useCallback(() => {
    if (onUserPressCallback === undefined) {
      if (disabled) {
        return;
      }

      if (shouldLinkToUser({ fid })) {
        trackCastClick({ type: CastClickType.Author });

        pushToUserProfile({ fid });
      }
    } else {
      onUserPressCallback();
    }
  }, [
    disabled,
    fid,
    onUserPressCallback,
    pushToUserProfile,
    shouldLinkToUser,
    trackCastClick,
  ]);

  const isProUser = useUserLevel(user) === 'pro';

  const usernameComp = usernameToDisplay && (
    <Pressable
      style={[t.flexRow, t.itemsCenter]}
      pointerEvents={disabled ? 'auto' : 'none'}
    >
      <TextWithPress
        numberOfLines={1}
        style={usernameStyles}
        onPress={onPressUsername}
      >
        {usernameToDisplay}
      </TextWithPress>
      {isProUser && <FarcasterProBadge size={14} style={[t.mL1]} />}
    </Pressable>
  );

  return (
    <View style={[t.flexCol, t.flexShrink]}>
      <View
        style={[t.flexRow, t.itemsCenter, { height: defaultThumbnailDiameter }]}
      >
        <View style={[t.flexShrink]}>{usernameComp}</View>
      </View>
    </View>
  );
};

UserUsername.displayName = 'DisplayNameUsername';

export { UserUsername };
