import React, { FC, memo, ReactElement, useCallback, useRef } from 'react';
import {
  Animated as RNAnimated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../contexts';

const duration = 200;
const yVelThreshold = 20;
const topBarHeight = 48;

type TopBarProps = {
  isEmbeddedInCollapsibleTabView: boolean;
  leftIcon: ReactElement | null;
  rightIcon: ReactElement | null;
  translateY: RNAnimated.Value;
  title: ReactElement;
  backgroundColor: 'default' | 'secondary' | 'tertiary';
};

const TopBar: FC<TopBarProps> = memo(
  ({
    isEmbeddedInCollapsibleTabView,
    leftIcon: leftIconOverride,
    rightIcon,
    translateY,
    title,
    backgroundColor,
  }) => {
    const t = useTheme();

    const insets = useSafeAreaInsets();

    const backgroundColorStyle = React.useMemo(() => {
      switch (backgroundColor) {
        case 'tertiary':
          return { backgroundColor: t.colors.background.tertiary };
        case 'secondary':
          return { backgroundColor: t.colors.background.secondary };
        case 'default':
        default:
          return { backgroundColor: t.colors.background.default };
      }
    }, [
      backgroundColor,
      t.colors.background.default,
      t.colors.background.secondary,
      t.colors.background.tertiary,
    ]);

    const rightIconOffset = 16;

    return (
      <RNAnimated.View
        style={[
          backgroundColorStyle,
          ...(isEmbeddedInCollapsibleTabView
            ? []
            : [
                t.absolute,
                t.left0,
                t.right0,
                {
                  transform: [{ translateY }],
                  top: -insets.top,
                  zIndex: 1000,
                },
              ]),
        ]}
      >
        <RNAnimated.View
          style={[
            t.flexRow,
            t.justifyCenter,
            t.itemsCenter,
            t.mX4,
            {
              marginTop: insets.top,
              height: topBarHeight,
            },
          ]}
        >
          <View style={[t.absolute, t.left0, t.hFull, t.justifyCenter]}>
            {leftIconOverride}
          </View>
          <View style={[t.flex]}>{title}</View>
        </RNAnimated.View>
        <View
          style={[
            t.absolute,
            t.right0,
            t.top0,
            t.justifyCenter,
            {
              marginTop: insets.top,
              height: topBarHeight,
              paddingRight: rightIconOffset,
            },
          ]}
        >
          {rightIcon}
        </View>
      </RNAnimated.View>
    );
  },
);

TopBar.displayName = 'TopBar';

type UseTopBarOptions = {
  isEmbeddedInCollapsibleTabView?: boolean;
  leftIcon?: ReactElement | null;
  rightIcon?: ReactElement | null;
  backgroundColor?: 'default' | 'secondary' | 'tertiary';
  title: ReactElement;
};

const useTopBar = ({
  isEmbeddedInCollapsibleTabView = false,
  leftIcon = null,
  rightIcon = null,
  backgroundColor = 'default',
  title,
}: UseTopBarOptions) => {
  const lastYRef = useRef(0);
  const isExpandedRef = useRef(true);
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const hasSeenFirstScreenEventRef = useRef(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasSeenFirstScreenEventRef.current) {
        hasSeenFirstScreenEventRef.current = true;
        return;
      }

      const expand = () => {
        if (!isExpandedRef.current) {
          isExpandedRef.current = true;

          RNAnimated.timing(translateY, {
            duration,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      };

      const collapse = () => {
        if (isExpandedRef.current) {
          isExpandedRef.current = false;

          RNAnimated.timing(translateY, {
            duration,
            toValue: -topBarHeight - insets.top,
            useNativeDriver: true,
          }).start();
        }
      };

      const currentY =
        e.nativeEvent.contentOffset.y + e.nativeEvent.contentInset.top;

      if (currentY < topBarHeight) {
        expand();
      } else {
        const yVel = currentY - lastYRef.current;

        if (yVel > yVelThreshold) {
          collapse();
        } else if (yVel < -yVelThreshold) {
          expand();
        }
      }

      lastYRef.current = currentY;
    },
    [translateY, insets.top],
  );

  return {
    topBar: (
      <TopBar
        isEmbeddedInCollapsibleTabView={isEmbeddedInCollapsibleTabView}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        title={title}
        translateY={translateY}
        backgroundColor={backgroundColor}
      />
    ),
    scrollProps: {
      onScroll,
    },
    translateY,
  };
};

export { topBarHeight, useTopBar, UseTopBarOptions };
