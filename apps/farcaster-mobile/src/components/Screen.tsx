import { DdRum } from '@datadog/mobile-react-native';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useHeaderHeight } from '@react-navigation/elements';
import {
  useFocusEffect,
  useIsFocused,
  useRoute,
} from '@react-navigation/native';
import React, {
  FC,
  memo,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { InteractionManager, KeyboardAvoidingView } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { AnalyticsProvider } from '~/contexts/AnalyticsProvider';
import { useFocusedScreen } from '~/contexts/FocusedScreenProvider';
import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { OpenDrawerOnlyNavigationMethodsProvider } from '~/contexts/OpenDrawerOnlyNavigationMethodsProvider';
import { ScreenBasedPromptProvider } from '~/contexts/ScreenBasedPromptProvider';
import { ScreenProvider } from '~/contexts/ScreenProvider';
import { useSplash } from '~/contexts/SplashProvider';
import { ForceThemeProvider, useTheme } from '~/contexts/ThemeProvider';
import { useManageDrawerSwipeEnabled } from '~/hooks/navigation/useManageDrawerSwipeEnabled';
import { usePath } from '~/hooks/navigation/usePath';
import { FullParamList } from '~/types';

import { RetryableErrorBoundary } from './RetryableErrorBoundary';

type ScreenProps = {
  avoidKeyboard: boolean;
  children: ReactNode;
  initialRenderDelay: number;
  insetTop: boolean;
  insetBottom: boolean;
  keyboardVerticalOffset?: number;
  name: keyof FullParamList;
  customLoadingIndicator?: ReactNode;
  customSplashHandlerDefined?: boolean;
  transparentBackground?: boolean;
};

const Screen: FC<ScreenProps> = memo(
  ({
    avoidKeyboard,
    children,
    initialRenderDelay,
    insetTop,
    insetBottom,
    keyboardVerticalOffset,
    name,
    customLoadingIndicator,
    customSplashHandlerDefined = false,
    transparentBackground = false,
  }) => {
    const t = useTheme();
    const headerHeight = useHeaderHeight();
    const isFocused = useIsFocused();
    const { setFocusedScreen } = useFocusedScreen();
    const { onAppInitialized } = useSplash();
    const [isReadyForInitialRender, setIsReadyForInitialRender] = useState(
      initialRenderDelay === 0,
    );

    const { dismissAll } = useBottomSheetModal();

    // Close all bottom sheet modals on a screen navigation event
    useFocusEffect(
      useCallback(() => {
        return () => dismissAll();
      }, [dismissAll]),
    );

    const path = usePath();
    const { params } = useRoute();

    const insets = useSafeAreaInsets();

    const { trackNavigationEvent } = useNavigationHistory();

    useManageDrawerSwipeEnabled();
    useEffect(() => {
      if (isFocused) {
        setFocusedScreen({ name, params });
      }
    }, [name, isFocused, path, params, setFocusedScreen]);

    useEffect(() => {
      let timeout: ReturnType<typeof setTimeout>;

      if (initialRenderDelay > 0) {
        timeout = setTimeout(() => {
          setIsReadyForInitialRender(true);
        }, initialRenderDelay);

        return () => clearTimeout(timeout);
      }
    }, [initialRenderDelay]);

    useEffect(() => {
      if (!customSplashHandlerDefined) {
        onAppInitialized();
      }
    }, [customSplashHandlerDefined, onAppInitialized]);

    useFocusEffect(
      useCallback(() => {
        trackNavigationEvent({ type: 'screenFocused', name });
      }, [name, trackNavigationEvent]),
    );

    if (!isFocused && !isReadyForInitialRender) {
      return null;
    }

    return (
      <Animated.View
        style={[
          t.flexGrow,
          t.flex1,
          transparentBackground ? t.bgTransparent : t.bgDefault,
          !transparentBackground && t.hFull,
          insetTop // https://reactnavigation.org/docs/handling-safe-area/#use-the-hook-for-more-control
            ? { paddingTop: insets.top }
            : { paddingLeft: insets.left, paddingRight: insets.right },
          insetBottom ? { paddingBottom: insets.bottom } : {},
        ]}
      >
        <Suspense
          fallback={
            customLoadingIndicator ? (
              customLoadingIndicator
            ) : (
              <FullScreenLoadingIndicator debugName={`Screen#${name}`} />
            )
          }
        >
          <RetryableErrorBoundary>
            {avoidKeyboard ? (
              <KeyboardAvoidingView
                // https://dev.to/chakrihacker/how-to-fix-keyboardavoidingview-in-react-native-5f3b
                behavior="padding"
                contentContainerStyle={{
                  flex: 1,
                }}
                keyboardVerticalOffset={
                  keyboardVerticalOffset === undefined
                    ? headerHeight
                    : keyboardVerticalOffset
                }
              >
                {children}
              </KeyboardAvoidingView>
            ) : (
              children
            )}
          </RetryableErrorBoundary>
        </Suspense>
      </Animated.View>
    );
  },
);

type BuildScreenOptions = {
  avoidKeyboard?: boolean;
  keyboardVerticalOffset?: number;
  name: keyof FullParamList;
  insetTop?: boolean;
  insetBottom?: boolean;
  insetTabBarBgColor?: boolean;
  initialRenderDelay?: number;
  customLoadingIndicator?: ReactNode;
  customSplashHandlerDefined?: boolean;
  themeV2?: boolean;
  transparentBackground?: boolean;
};

const buildScreen = <T extends Record<string, unknown>>(
  {
    avoidKeyboard = false,
    keyboardVerticalOffset,
    name,
    insetTop = false,
    insetBottom = false,
    insetTabBarBgColor = false,
    initialRenderDelay = 0,
    customLoadingIndicator,
    customSplashHandlerDefined = false,
    themeV2 = false,
    transparentBackground = false,
  }: BuildScreenOptions,
  Content: FC<T>,
) =>
  memo((props: T) => {
    const screenProps = React.useMemo(
      () => ({
        name,
        insetTop,
        insetBottom,
        insetTabBarBgColor,
        avoidKeyboard,
        keyboardVerticalOffset,
        initialRenderDelay,
        customLoadingIndicator,
        customSplashHandlerDefined,
        themeV2,
        transparentBackground,
      }),
      [],
    );

    useEffect(() => {
      InteractionManager.runAfterInteractions(() => {
        DdRum.addViewLoadingTime(true);
      });
    }, []);

    return (
      <ForceThemeProvider>
        <AnalyticsProvider>
          <OpenDrawerOnlyNavigationMethodsProvider>
            <ScreenBasedPromptProvider>
              <ScreenProvider {...screenProps}>
                <Screen {...screenProps}>
                  <Content {...props} />
                </Screen>
              </ScreenProvider>
            </ScreenBasedPromptProvider>
          </OpenDrawerOnlyNavigationMethodsProvider>
        </AnalyticsProvider>
      </ForceThemeProvider>
    );
  });

export { buildScreen };
