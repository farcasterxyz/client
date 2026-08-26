import React from 'react';
import { NativeScrollEvent, ScrollViewProps } from 'react-native';

import { ScrollViewWithBackGesture } from '~/components/ScrollViewWithBackGesture';
import { useVideoFeedViewablility } from '~/contexts/VideoFeedViewablilityProvider';

// Pixel gap between embeds inside the horizontal carousel. Exported so
// cast renderers can pass `carouselItemWidth + CAROUSEL_GAP` as the
// `visibleItemInterval` (visible-index stride) and use the same value as
// the `gap` style on the wrapping row.
export const CAROUSEL_GAP = 8;

type AttachmentsCarouselProps = {
  hash: string;
  children: React.ReactNode;
  onVisibleIndexChange?: (index: number) => void;
  isFocusedCast?: boolean;
  visibleItemInterval?: number;
} & ScrollViewProps;

type AttachmentsCarouselContextValue = {
  isInCarousel: boolean;
  isCarouselVisible: boolean;
  visibleIndex: number;
};

const AttachmentsCarouselContext =
  React.createContext<AttachmentsCarouselContextValue>({
    isInCarousel: false,
    isCarouselVisible: false,
    visibleIndex: 0,
  });

export const useAttachmentsCarouselVisibility = () => {
  return React.useContext(AttachmentsCarouselContext);
};

const AttachmentsCarousel = React.memo(
  ({
    hash,
    children,
    onVisibleIndexChange,
    isFocusedCast = false,
    visibleItemInterval,
    ...props
  }: AttachmentsCarouselProps) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isCarouselVisible, setIsCarouselVisible] = React.useState(false);
    const childrenCount = React.Children.count(children);
    const hasInitialized = React.useRef(false);
    const previousHashRef = React.useRef(hash);

    // Reset per-cast state synchronously when this cell is recycled to a
    // different cast. Done during render (not in useEffect) so children
    // reading `useAttachmentsCarouselVisibility()` don't see the previous
    // cast's `visibleIndex`/`isCarouselVisible` for one frame.
    if (previousHashRef.current !== hash) {
      previousHashRef.current = hash;
      setCurrentIndex(0);
      setIsCarouselVisible(false);
      hasInitialized.current = false;
    }

    // Fix for the case in which the children are within a Fragment
    const actualChildCount = React.useMemo(() => {
      const childrenArray = React.Children.toArray(children);
      let videoCount = 0;

      childrenArray.forEach((child) => {
        if (React.isValidElement(child)) {
          if (
            child.type === React.Fragment &&
            (child.props as { children: React.ReactNode })?.children
          ) {
            const fragmentChildren = React.Children.toArray(
              (child.props as { children: React.ReactNode }).children,
            );
            videoCount += fragmentChildren.length;
          } else {
            videoCount += 1;
          }
        }
      });

      return videoCount > 0 ? videoCount : childrenCount;
    }, [children, childrenCount]);

    const play = React.useCallback(() => {
      setIsCarouselVisible(true);
    }, []);

    const pause = React.useCallback(() => {
      setIsCarouselVisible(false);
    }, []);

    // Track carousel visibility in the vertical feed
    useVideoFeedViewablility({
      hash,
      play,
      pause,
    });

    // For focused casts, trigger visibility immediately
    React.useEffect(() => {
      if (isFocusedCast && !hasInitialized.current) {
        hasInitialized.current = true;
        // Small delay to ensure everything is mounted
        setTimeout(() => {
          play();
        }, 100);
      }
    }, [isFocusedCast, play]);

    // Use the embed stride (`visibleItemInterval`), not the viewport width,
    // when mapping `contentOffset.x` → index. Each embed is narrower than
    // the viewport (peek-of-next on the side), so dividing by viewport
    // width rounds the last index down and silently breaks autoplay for
    // the final embed.
    const handleScroll = React.useCallback(
      (event: NativeScrollEvent) => {
        const { contentOffset, layoutMeasurement } = event;
        const stride =
          visibleItemInterval && visibleItemInterval > 0
            ? visibleItemInterval
            : layoutMeasurement.width;

        if (stride > 0) {
          const newIndex = Math.round(contentOffset.x / stride);

          if (
            newIndex !== currentIndex &&
            newIndex >= 0 &&
            newIndex < actualChildCount
          ) {
            setCurrentIndex(newIndex);
            onVisibleIndexChange?.(newIndex);
          }
        }
      },
      [
        currentIndex,
        actualChildCount,
        onVisibleIndexChange,
        visibleItemInterval,
      ],
    );

    const contextValue = React.useMemo(
      () => ({
        isInCarousel: true,
        isCarouselVisible,
        visibleIndex: currentIndex,
      }),
      [isCarouselVisible, currentIndex],
    );

    return (
      <AttachmentsCarouselContext.Provider value={contextValue}>
        <ScrollViewWithBackGesture
          {...props}
          horizontal
          resetScrollKey={hash}
          onScroll={handleScroll}
          onMomentumEnd={handleScroll}
        >
          {children}
        </ScrollViewWithBackGesture>
      </AttachmentsCarouselContext.Provider>
    );
  },
);

AttachmentsCarousel.displayName = 'AttachmentsCarousel';

export { AttachmentsCarousel };
