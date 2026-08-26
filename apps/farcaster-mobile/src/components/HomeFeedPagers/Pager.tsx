import React, { forwardRef, useMemo } from 'react';
import PagerView, {
  PagerViewOnPageScrollEvent,
  PagerViewOnPageSelectedEvent,
  PageScrollStateChangedNativeEvent,
} from 'react-native-pager-view';
import Animated from 'react-native-reanimated';

import { useTheme } from '~/contexts/ThemeProvider';

export type PageSelectedEvent = PagerViewOnPageSelectedEvent;

export interface PagerRef {
  setPage: (index: number, reason: 'swipe' | 'tab-click') => void;
  setPageWithoutAnimation: (
    index: number,
    reason: 'swipe' | 'tab-click',
  ) => void;
  setScrollEnabled: ({ enabled }: { enabled: boolean }) => void;
}

export interface RenderTabBarFnProps {
  selectedPage: number;
  onSelect?: (index: number) => void;
  tabBarAnchor?: React.ReactNode; // Ignored on native.
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => React.ReactNode;

interface Props {
  initialPage?: number;
  renderHeader?: () => React.ReactNode;
  containerComponent?: ({
    children,
  }: {
    children: React.ReactNode;
  }) => React.ReactNode;
  renderTabBar: RenderTabBarFn;
  onPageSelected?: (index: number) => void;
  onPageSelecting?: (index: number, reason: 'swipe' | 'tab-click') => void;
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void;
}
export const Pager = forwardRef<PagerRef, React.PropsWithChildren<Props>>(
  function PagerImpl(
    {
      children,
      initialPage = 0,
      renderHeader,
      containerComponent,
      renderTabBar,
      onPageScrollStateChanged,
      onPageSelected,
      onPageSelecting,
    }: React.PropsWithChildren<Props>,
    ref,
  ) {
    const [selectedPage, setSelectedPage] = React.useState(initialPage);
    const lastOffset = React.useRef(0);
    const lastDirection = React.useRef(0);
    const scrollState = React.useRef('');
    const pagerView = React.useRef<PagerView>(null);

    React.useImperativeHandle(ref, () => ({
      setPage: (index: number, reason: 'swipe' | 'tab-click') => {
        pagerView.current?.setPage(index);
        onPageSelecting?.(index, reason);
      },
      setPageWithoutAnimation: (
        index: number,
        reason: 'swipe' | 'tab-click',
      ) => {
        pagerView.current?.setPageWithoutAnimation(index);
        // Sync the tab bar state immediately so a spurious Android
        // onPageSelected event doesn't render the wrong tab highlight
        // before the native onPageSelected catches up.
        setSelectedPage(index);
        onPageSelecting?.(index, reason);
      },
      setScrollEnabled: ({ enabled }: { enabled: boolean }) => {
        pagerView.current?.setScrollEnabled(enabled);
      },
    }));

    const onPageSelectedInner = React.useCallback(
      (e: PageSelectedEvent) => {
        setSelectedPage(e.nativeEvent.position);
        onPageSelected?.(e.nativeEvent.position);
      },
      [setSelectedPage, onPageSelected],
    );

    const onPageScroll = React.useCallback(
      (e: PagerViewOnPageScrollEvent) => {
        const { position, offset } = e.nativeEvent;
        if (offset === 0) {
          // offset hits 0 in some awkward spots so we ignore it
          return;
        }

        if (scrollState.current === 'settling') {
          if (lastDirection.current === -1 && offset < lastOffset.current) {
            onPageSelecting?.(position, 'swipe');
            setSelectedPage(position);
            lastDirection.current = 0;
          } else if (
            lastDirection.current === 1 &&
            offset > lastOffset.current
          ) {
            onPageSelecting?.(position + 1, 'swipe');
            setSelectedPage(position + 1);
            lastDirection.current = 0;
          }
        } else {
          if (offset < lastOffset.current) {
            lastDirection.current = -1;
          } else if (offset > lastOffset.current) {
            lastDirection.current = 1;
          }
        }
        lastOffset.current = offset;
      },
      [lastOffset, lastDirection, onPageSelecting],
    );

    const handlePageScrollStateChanged = React.useCallback(
      (e: PageScrollStateChangedNativeEvent) => {
        scrollState.current = e.nativeEvent.pageScrollState;
        onPageScrollStateChanged?.(e.nativeEvent.pageScrollState);
      },
      [scrollState, onPageScrollStateChanged],
    );

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index);
        onPageSelecting?.(index, 'tab-click');
      },
      [pagerView, onPageSelecting],
    );

    const t = useTheme();

    const pagerChildren = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    const pagerComponent = useMemo(() => {
      return (
        <PagerView
          ref={pagerView}
          style={[t.flex1, t.hFull]}
          initialPage={initialPage}
          onPageScrollStateChanged={handlePageScrollStateChanged}
          onPageSelected={onPageSelectedInner}
          onPageScroll={onPageScroll}
        >
          {pagerChildren}
        </PagerView>
      );
    }, [
      pagerChildren,
      handlePageScrollStateChanged,
      initialPage,
      onPageScroll,
      onPageSelectedInner,
      pagerView,
      t.flex1,
      t.hFull,
    ]);

    return (
      <Animated.View style={[t.flex1, t.overflowHidden]}>
        {renderHeader?.()}
        {renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
        })}
        {containerComponent?.({ children: pagerComponent }) ?? pagerComponent}
      </Animated.View>
    );
  },
);
