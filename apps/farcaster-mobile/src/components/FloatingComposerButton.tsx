import { usePrefetchUserFollowingChannels } from 'farcaster-client-hooks';
import { AnimatedPressable } from 'farcaster-expo';
import React from 'react';
import { Platform, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import {
  PressableGradient,
  useFabIconColor,
} from '~/components/FloatingSearch/PressableGradient';
import { useBottomTab } from '~/contexts/BottomTabProvider';
import { useCastQueue } from '~/contexts/CastQueueProvider';
import {
  useHasBackgroundedComposer,
  useOpenComposer,
  useResumeComposer,
} from '~/contexts/CreateCastComposerProvider';
import { useFocusedScreen } from '~/contexts/FocusedScreenProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHomeScreenSelectedFeed } from '~/screens/Feed/HomeScreenScrollHandlers';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';

/**
 * FloatingComposerButton - Floating action button for composing a new cast.
 * Can be used on any screen (e.g. Home, Pulse Feed).
 */
type FloatingComposerButtonProps = {
  backgroundedOnly?: boolean;
};

export const FloatingComposerButton: React.FC<FloatingComposerButtonProps> =
  React.memo(({ backgroundedOnly = false }) => {
    const t = useTheme();
    const iconColor = useFabIconColor();
    const openComposer = useOpenComposer();
    const resumeComposer = useResumeComposer();
    const hasBackgroundedComposer = useHasBackgroundedComposer();
    const { bottomTabBarHeight } = useBottomTab();
    const { focusedScreen } = useFocusedScreen();
    const { hasActivelyQueuedTopLevelCasts } = useCastQueue();
    const prefetchUserFollowingChannels = usePrefetchUserFollowingChannels();
    // Always call hooks unconditionally
    const homeScreenSelectedFeed = useHomeScreenSelectedFeed();
    const feedKey: string | undefined = homeScreenSelectedFeed?.feedKey;

    const runCreateCastPrefetches = React.useCallback(() => {
      Promise.all([
        prefetchUserFollowingChannels({
          forComposer: true,
          shouldSkipIfRecentlyPrefetched: true,
        }),
      ]);
    }, [prefetchUserFollowingChannels]);

    if (backgroundedOnly && !hasBackgroundedComposer) {
      return null;
    }

    if (!backgroundedOnly && hasBackgroundedComposer) {
      return null;
    }

    const isViewingSnapActionDestination =
      focusedScreen?.name === 'Token' || focusedScreen?.name === 'TokenCA';

    if (backgroundedOnly && isViewingSnapActionDestination) {
      return null;
    }

    if (hasActivelyQueuedTopLevelCasts && !hasBackgroundedComposer) {
      return null;
    }

    return (
      <View
        style={[
          t.absolute,
          t.right0,
          t.mR4,
          t.mB10,
          { bottom: backgroundedOnly ? bottomTabBarHeight : 0 },
        ]}
      >
        <AnimatedPressable
          // NEYN-11640: selector for the Maestro `publish-cast` E2E flow.
          // The button is icon-only (SVG pencil); accessibilityLabel is
          // dynamic ('Cast' vs 'Resume cast'), so a stable testID is the
          // reliable anchor across both states.
          testID="floating-composer-button"
          accessibilityLabel={hasBackgroundedComposer ? 'Resume cast' : 'Cast'}
          style={[
            t.itemsCenter,
            t.justifyCenter,
            { borderRadius: 100, width: 56, height: 56 },
            Platform.OS === 'android'
              ? {
                  overflow: 'hidden',
                }
              : undefined,
          ]}
          disableAnimation={Platform.OS === 'android'}
          onPressIn={
            hasBackgroundedComposer ? undefined : runCreateCastPrefetches
          }
          onPress={() => {
            if (hasBackgroundedComposer) {
              resumeComposer();
              return;
            }

            const intent =
              feedKey !== 'home' && feedKey !== 'following'
                ? createCastParamsWithIntent({
                    channelKey: feedKey,
                  }).intent
                : undefined;
            openComposer({ intent });
          }}
        >
          <PressableGradient />
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M21.1739 6.81238C21.7026 6.2838 21.9997 5.56685 21.9998 4.81923C21.9999 4.07162 21.703 3.35459 21.1744 2.82588C20.6459 2.29717 19.9289 2.00009 19.1813 2C18.4337 1.99991 17.7166 2.2968 17.1879 2.82538L3.84193 16.1744C3.60975 16.4059 3.43805 16.6909 3.34193 17.0044L2.02093 21.3564C1.99509 21.4429 1.99314 21.5347 2.01529 21.6222C2.03743 21.7097 2.08285 21.7896 2.14673 21.8534C2.21061 21.9172 2.29055 21.9624 2.37809 21.9845C2.46563 22.0065 2.55749 22.0044 2.64393 21.9784L6.99693 20.6584C7.3101 20.5631 7.59511 20.3925 7.82693 20.1614L21.1739 6.81238Z"
              stroke={iconColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
            <Path
              d="M15 5L19 9"
              stroke={iconColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </Svg>
        </AnimatedPressable>
      </View>
    );
  });
