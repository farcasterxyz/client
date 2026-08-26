import { AnalyticsEvent } from 'farcaster-analytics';
import { PressableSimpleListItem, Text2 } from 'farcaster-expo';
import { LucideChevronRight } from 'lucide-react-native';
import React, { FC, memo, ReactNode, useCallback } from 'react';
import { View } from 'react-native';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export type MenuGroup = {
  title: string;
  items: MenuItemProps[];
};

function isGroup(item: MenuGroup | MenuItemProps): item is MenuGroup {
  return 'title' in item;
}

export type MenuItems = Array<MenuGroup | MenuItemProps>;

export const SimpleMenu: FC<{
  items: MenuItems;
  analyticsEvent?: AnalyticsEvent;
}> = memo(({ items, analyticsEvent }) => {
  return (
    <>
      {items.map((itemOrGroup, index) => {
        if (isGroup(itemOrGroup)) {
          return (
            <View
              key={itemOrGroup.title + index}
              style={{ paddingVertical: 12 }}
            >
              <Text2
                color="tertiary"
                weight="semibold"
                style={{ marginBottom: 12 }}
              >
                {itemOrGroup.title}
              </Text2>
              <View>
                {itemOrGroup.items.map((item, index) => {
                  return (
                    <MenuItem
                      key={index}
                      analyticsEvent={analyticsEvent}
                      {...item}
                      isLast={index === itemOrGroup.items.length - 1}
                      isFirst={index === 0}
                    />
                  );
                })}
              </View>
            </View>
          );
        }

        return (
          <MenuItem
            key={index}
            {...itemOrGroup}
            isLast={index === items.length - 1}
            isFirst={index === 0}
          />
        );
      })}
    </>
  );
});

type MenuItemProps = {
  name: string;
  subtitle?: string;
  icon?: ReactNode;
  showArrow?: boolean;
  slimPadding?: boolean;
  isLast?: boolean;
  isFirst?: boolean;
  onPress: () => void;
  isLoading?: boolean;
  iconWidth?: number;
  size?: 'lg' | 'base';
  disabled?: boolean;
  useSeparators?: boolean;
  analyticsEvent?: AnalyticsEvent;
};

const MenuItem: FC<MenuItemProps> = memo(
  ({
    name,
    icon,
    showArrow = true,
    isLast,
    isFirst,
    subtitle,
    onPress,
    slimPadding = false,
    isLoading,
    iconWidth = 24,
    size = 'base',
    disabled,
    analyticsEvent,
  }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();

    const wrappedOnPress = useCallback(() => {
      if (analyticsEvent) {
        trackEvent(analyticsEvent, { name: name });
      }

      onPress();
    }, [analyticsEvent, onPress, trackEvent, name]);

    return (
      <PressableSimpleListItem
        style={[t.flexRow, t.itemsCenter]}
        isStart={isFirst}
        isEnd={isLast}
        onPress={wrappedOnPress}
        color="lightGray"
        disabled={disabled}
      >
        <View
          style={[
            t.flex,
            t.itemsCenter,
            t.justifyCenter,
            t.mR3,
            { width: icon ? iconWidth : 0 },
          ]}
        >
          {icon}
        </View>
        <View style={[t.flexCol, t.flex1]}>
          <Text
            style={[
              disabled ? t.texts.secondary : t.texts.primary,
              size === 'lg' ? t.textLg : t.textBase,
              t.overflowHidden,
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {subtitle && (
            <Text
              style={[
                t.texts.tertiary,
                slimPadding ? { marginTop: 2 } : t.mT2,
                t.textBase,
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {showArrow &&
          (isLoading ? (
            <LoadingIndicator />
          ) : (
            <LucideChevronRight
              size={20}
              style={[
                disabled ? t.texts.tertiary : t.texts.primary,
                t.flexCol,
                t.flex0,
                { marginTop: 2 },
              ]}
            />
          ))}
      </PressableSimpleListItem>
    );
  },
);

MenuItem.displayName = 'MenuItem';

export { MenuItem, type MenuItemProps };
