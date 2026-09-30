import { Octicons } from '@expo/vector-icons';
import React, { FC, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useDrawerTouchablePress } from '~/components/DrawerContent/drawerPressHandlers';
import { FeedImage } from '~/components/FeedImage';
import { Text } from '~/components/Text';
import { bodyLineHeight } from '~/constants/Cast';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { FeedRoute } from '~/hooks/useFeedRoutes';

export type ExtendedFeedRoute = FeedRoute & {
  onPress: (feedKey?: string) => void;
};

interface DrawerFeedItemProps {
  feed: ExtendedFeedRoute;
  onFavoriteFeed: (feedKey: string) => void;
  onUnfavoriteFeed: (feedKey: string, favoritePosition: number) => void;
}

const DrawerFeedItem: FC<DrawerFeedItemProps> = memo(
  ({ feed, onFavoriteFeed, onUnfavoriteFeed }) => {
    const t = useTheme();
    const imageUrl = 'imageUrl' in feed ? feed.imageUrl : undefined;
    const favoritePressProps = useDrawerTouchablePress(() => {
      if (
        feed.viewerContext?.favoritePosition !== undefined &&
        feed.viewerContext?.favoritePosition > -1
      ) {
        onUnfavoriteFeed(feed.key, feed.viewerContext.favoritePosition);
      } else {
        onFavoriteFeed(feed.key);
      }
    });

    return (
      <DrawerItem
        key={feed.key}
        name={feed.name}
        icon={<FeedImage size={24} imageUrl={imageUrl} />}
        rightComp={
          <View style={[t.mL3]}>
            <TouchableOpacity
              activeOpacity={0.5}
              hitSlop={hitSlop}
              {...favoritePressProps}
            >
              <Octicons
                name={
                  feed.viewerContext?.favoritePosition !== undefined &&
                  feed.viewerContext?.favoritePosition > -1
                    ? 'star-fill'
                    : 'star'
                }
                size={16}
                color={t.colors.text.quaternary}
              />
            </TouchableOpacity>
          </View>
        }
        isActive={false}
        onPress={feed.onPress}
        feedKey={feed.key}
      />
    );
  },
);

DrawerFeedItem.displayName = 'FeedNavItem';

interface DrawerItemProps {
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  rightComp?: React.ReactNode;
  onPress: (feedKey?: string) => void;
  onLongPress?: () => void;
  feedKey?: string;
  disabled?: boolean;
}

const DrawerItem: FC<DrawerItemProps> = memo(
  ({
    name,
    icon,
    isActive: _isActive,
    rightComp,
    onPress,
    onLongPress: _onLongPress,
    feedKey,
    disabled = false,
  }) => {
    const t = useTheme();
    const pressProps = useDrawerTouchablePress(() => onPress(feedKey), {
      hasLongPress: _onLongPress !== undefined,
    });

    return (
      <TouchableOpacity
        activeOpacity={0.5}
        style={[t.rounded, { paddingTop: 10, paddingBottom: 10 }]}
        {...pressProps}
        onLongPress={_onLongPress}
        disabled={disabled}
      >
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <View style={[t.flex, t.itemsCenter, t.justifyCenter, t.w6, t.h6]}>
            {icon}
          </View>
          <Text
            style={[
              t.textBase,
              t.texts.primary,
              t.flexGrow,
              {
                lineHeight: bodyLineHeight,
                fontSize: 15,
              },
            ]}
          >
            {name}
          </Text>
          {rightComp}
        </View>
      </TouchableOpacity>
    );
  },
);

DrawerItem.displayName = 'NavItemContent';

export { DrawerFeedItem, DrawerItem };
