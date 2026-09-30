import React, {
  JSXElementConstructor,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, View, ViewStyle } from 'react-native';
import { TabBarProps } from 'react-native-collapsible-tab-view';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type BuildCollapsibleTabBarProps = {
  containerStyle?: ViewStyle | ViewStyle[];
  tabStyle?: ViewStyle | ViewStyle[];
};

type CollapsibleTabBar = (
  props: TabBarProps<string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => ReactElement<any, JSXElementConstructor<any>> | null;

export const buildCollapsibleTabBar = ({
  containerStyle,
  tabStyle,
}: BuildCollapsibleTabBarProps = {}) => {
  // This component is a replacement for react-native-tab-view's TabBar,
  // which would cause the app to crash on iOS if users pressed labels too quickly.
  // https://github.com/merkle-manufactory/mobile/issues/581
  // Note that even though we don't actually care about the NavigationState generic,
  // we need to specify it otherwise `TabView` will complain about the scene's types.
  const CollapsibleTabBar: CollapsibleTabBar = ({
    index,
    onTabPress,
    tabNames,
  }) => {
    const t = useTheme();

    const [tabWidths, setTabWidths] = useState<number[]>([]);

    const computeIndicatorTranslateXToValue = useCallback(
      (targetIndex: number) => {
        let offset = 0;

        for (let i = 0; i < targetIndex; i++) {
          const tabWidth = tabWidths[i] || 0;
          offset += tabWidth;
        }

        return offset;
      },
      [tabWidths],
    );

    const indicatorOpacity = useRef(new Animated.Value(0)).current;

    const indicatorTranslateX = useRef(
      new Animated.Value(computeIndicatorTranslateXToValue(index.value)),
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

    useEffect(() => {
      Animated.timing(indicatorOpacity, {
        delay: 100,
        duration: 250,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, [indicatorOpacity]);

    // We animate the indicator (i.e. the purple underline) any time `navigationState.index` changes
    // to ensure that the ui stays in sync with the navigation state if the index changes by some means
    // other than the user pressing on a label (see below).
    useEffect(() => {
      animateIndicatorTranslateX(index.value);
    }, [animateIndicatorTranslateX, index.value]);

    return (
      <View style={containerStyle}>
        <View style={[t.flexRow]}>
          {tabNames.map((name, i) => {
            const isCurrentTab = index.value === i;

            return (
              <Pressable
                key={name}
                style={[t.flexGrow, t.pY2, t.justifyCenter, tabStyle]}
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  setTabWidths((prevTabWidths) => {
                    const nextTabWidths = [...prevTabWidths];
                    nextTabWidths[i] = width;
                    return nextTabWidths;
                  });
                }}
                onPress={() => {
                  // If we are already at the selected index, nothing to do here.
                  // We also want to be cautious to avoid the crashing problem
                  // that created the need for this component in the first place.
                  if (!isCurrentTab) {
                    // Because the `useEffect` will be delayed, we want to proactively
                    // start the indicator's animation now.
                    animateIndicatorTranslateX(index.value);
                    onTabPress(name);
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
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Animated.View
          style={[
            t.borderB2,
            t.borderTabViewActive,
            {
              opacity: indicatorOpacity,
              transform: [{ translateX: indicatorTranslateX }],
              width: tabWidths[index.value] || 0,
            },
          ]}
        />
      </View>
    );
  };

  return CollapsibleTabBar;
};
