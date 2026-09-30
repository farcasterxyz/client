import { ApiUser } from 'farcaster-client-data';
import {
  CastClickType,
  useTrackCastClick,
  useUserLinkHelpers,
} from 'farcaster-client-hooks';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleProp, TextStyle, View } from 'react-native';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { FarcasterProBadgeOnProfileUpsell } from '~/components/FarcasterPro/FarcasterProUpsellBubble';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { bodyFontSize, bodyLineHeight } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

export type UserDisplayNameStyle = 'base' | 'header' | 'direct' | 'custom';

type UserDisplayNameWithBadgesProps = {
  user: ApiUser;
  style: UserDisplayNameStyle;
  disabled: boolean;
  onUserPressCallback?: () => void;
  inversedTextColors?: boolean;
  customStyle?: StyleProp<TextStyle>;
  hideProBadge?: boolean;
  showUpsell?: boolean;
};

const UserDisplayNameWithBadges = memo(
  ({
    user,
    style: variant,
    disabled,
    onUserPressCallback = undefined,
    inversedTextColors = false,
    customStyle,
    hideProBadge = false,
    showUpsell = false,
  }: UserDisplayNameWithBadgesProps) => {
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();
    const { shouldLinkToUser } = useUserLinkHelpers();
    const trackCastClick = useTrackCastClick();

    const onPressDisplayName = useCallback(() => {
      if (onUserPressCallback === undefined) {
        if (disabled) {
          return;
        }

        if (shouldLinkToUser({ fid: user.fid })) {
          trackCastClick({ type: CastClickType.Author });

          pushToUserProfile({ fid: user.fid });
        }
      } else {
        onUserPressCallback();
      }
    }, [
      disabled,
      onUserPressCallback,
      pushToUserProfile,
      shouldLinkToUser,
      trackCastClick,
      user.fid,
    ]);

    const isProUser = useUserLevel(user) === 'pro';

    const styleDisplayName = useMemo(() => {
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
            inversedTextColors ? { color: '#ffffff' } : t.texts.primary,
            t.fontBold,
            t.flexShrink,
            { fontSize: bodyFontSize, lineHeight: bodyLineHeight },
          ];
      }
    }, [
      customStyle,
      inversedTextColors,
      t.flexShrink,
      t.fontBold,
      t.fontNormal,
      t.textBase,
      t.texts.primary,
      t.textLg,
      variant,
    ]);

    const stylePressable = useMemo(
      () => [t.flexRow, t.flexShrink, t.itemsCenter, t.mR1, { gap: 2 }],
      [t],
    );

    return useMemo(() => {
      if (disabled) {
        return (
          <View style={stylePressable}>
            <Text numberOfLines={1} style={styleDisplayName}>
              {user.displayName}
            </Text>
            {!hideProBadge && isProUser && <FarcasterProBadge size={18} />}
          </View>
        );
      }

      return (
        <Pressable
          style={stylePressable}
          pointerEvents={disabled ? 'none' : 'auto'}
        >
          <TextWithPress
            numberOfLines={1}
            style={styleDisplayName}
            onPress={onPressDisplayName}
          >
            {user.displayName}
          </TextWithPress>
          {!hideProBadge && isProUser && <FarcasterProBadge size={18} />}
          {showUpsell && <FarcasterProBadgeOnProfileUpsell user={user} />}
        </Pressable>
      );
    }, [
      disabled,
      hideProBadge,
      isProUser,
      onPressDisplayName,
      showUpsell,
      styleDisplayName,
      stylePressable,
      user,
    ]);
  },
);

UserDisplayNameWithBadges.displayName = 'UserDisplayNameWithBadges';

export { UserDisplayNameWithBadges };
