import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { TabView } from 'react-native-tab-view';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type BuildTabBarProps = {
  containerStyle?: ViewStyle | ViewStyle[];
};

const buildTabBar = ({ containerStyle }: BuildTabBarProps = {}) => {
  // This component is a replacement for react-native-tab-view's TabBar,
  // which would cause the app to crash on iOS if users pressed labels too quickly.
  // https://github.com/merkle-manufactory/mobile/issues/581
  // Note that even though we don't actually care about the NavigationState generic,
  // we need to specify it otherwise `TabView` will complain about the scene's types.

  const TabBar: React.ComponentProps<typeof TabView>['renderTabBar'] = ({
    jumpTo,
    navigationState,
  }) => {
    const t = useTheme();
    const { width } = useWindowDimensions();

    const labelPctWidth = 1 / navigationState.routes.length;

    const computeIndicatorTranslateXToValue = useCallback(
      (targetIndex: number) => width * targetIndex * labelPctWidth,
      [labelPctWidth, width],
    );

    const indicatorTranslateX = useRef(
      new Animated.Value(
        computeIndicatorTranslateXToValue(navigationState.index),
      ),
    ).current;

    const animateIndicatorTranslateX = useCallback(
      (targetIndex: number) => {
        Animated.timing(indicatorTranslateX, {
          toValue: computeIndicatorTranslateXToValue(targetIndex),
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
      [computeIndicatorTranslateXToValue, indicatorTranslateX],
    );

    // We animate the indicator (i.e. the purple underline) any time `navigationState.index` changes
    // to ensure that the ui stays in sync with the navigation state if the index changes by some means
    // other than the user pressing on a label (see below).
    useEffect(() => {
      animateIndicatorTranslateX(navigationState.index);
    }, [animateIndicatorTranslateX, navigationState.index]);

    return (
      <View style={containerStyle}>
        <View style={[t.flexRow]}>
          {navigationState.routes.map(({ key, title }, index) => (
            <Pressable
              key={key}
              style={[t.flexGrow, t.pY2, { width: width * labelPctWidth }]}
              onPress={() => {
                // If we are already at the selected index, nothing to do here.
                // We also want to be cautious to avoid the crashing problem
                // that created the need for this component in the first place.
                if (navigationState.index !== index) {
                  // Because the `useEffect` will be delayed, we want to proactively
                  // start the indicator's animation now.
                  animateIndicatorTranslateX(index);
                  jumpTo(key);
                }
              }}
            >
              <Text
                style={[
                  t.textSm,
                  t.fontSemibold,
                  t.texts.secondary,
                  t.textCenter,
                ]}
              >
                {title}
              </Text>
            </Pressable>
          ))}
        </View>
        <Animated.View
          style={[
            t.borderB2,
            t.borderTabViewActive,
            {
              transform: [{ translateX: indicatorTranslateX }],
              width: `${100 * labelPctWidth}%`,
            },
          ]}
        />
      </View>
    );
  };

  return TabBar;
};

export { buildTabBar };
