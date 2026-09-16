import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';
import React, { useEffect } from 'react';
import {
  GestureResponderEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { usePagerSwipeController } from '~/components/HomeFeedPagers/Pagers';
import { PressableTokenFIP2Card } from '~/components/PressableTokenFIP2Card';
import { useTheme } from '~/contexts/ThemeProvider';

import {
  AttachmentsCarousel,
  CAROUSEL_GAP,
} from './CastAttachments/AttachmentsCarousel';
import { PressableTargetToNavigateToCast } from './CastContainer';

type CastAttachmentsSectionVariant = 'feed' | 'focused' | 'chat';

type CastAttachmentsSectionProps = {
  cast: ApiCast;
  variant: CastAttachmentsSectionVariant;
  castText?: string;
  castAttachment: React.ReactNode;
  preCarouselAttachments: React.ReactNode;
  nonCarouselAttachments: React.ReactNode;
  needsCarousel: boolean;
  carouselMaxHeight: number | undefined;
  carouselItemWidth: number | undefined;
  hasAttachments: boolean;
  hasPreCarouselAttachments: boolean;
  hasNonCarouselAttachments: boolean;
  avatarDiameter?: number;
  isAppsDialog?: boolean;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  isFocusedCast?: boolean;
};

const CastAttachmentsSection = React.memo(function CastAttachmentsSection({
  cast,
  variant,
  castText = cast.text,
  castAttachment,
  preCarouselAttachments,
  nonCarouselAttachments,
  needsCarousel,
  carouselMaxHeight,
  carouselItemWidth,
  hasAttachments,
  hasPreCarouselAttachments,
  hasNonCarouselAttachments,
  avatarDiameter,
  isAppsDialog = false,
  castOpenIncludeReason,
  isFocusedCast = false,
}: CastAttachmentsSectionProps) {
  const t = useTheme();
  const { hash } = cast;

  const { setScrollEnabled: setSwipeEnabled } = usePagerSwipeController();
  const swipeBlockerProps = usePagerSwipeBlockerProps({ setSwipeEnabled });
  const swipeBlockerPropsToUse =
    variant === 'feed' && needsCarousel && Platform.OS === 'android'
      ? swipeBlockerProps
      : undefined;

  if (variant === 'chat') {
    return (
      <>
        {hasPreCarouselAttachments && (
          <View style={styles.chatEmbedWrap}>{preCarouselAttachments}</View>
        )}
        {hasAttachments &&
          (needsCarousel ? (
            <AttachmentsCarousel
              hash={hash}
              key={hash}
              isFocusedCast={false}
              {...(carouselItemWidth !== undefined
                ? { visibleItemInterval: carouselItemWidth + CAROUSEL_GAP }
                : {})}
              style={[
                styles.chatCarouselWrap,
                carouselMaxHeight !== undefined
                  ? {
                      maxHeight: carouselMaxHeight,
                      overflow: 'hidden' as const,
                    }
                  : undefined,
              ]}
              contentContainerStyle={styles.chatCarouselContent}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews={false}
            >
              {castAttachment}
            </AttachmentsCarousel>
          ) : (
            <View
              style={[
                styles.chatCarouselWrap,
                carouselMaxHeight !== undefined
                  ? {
                      maxHeight: carouselMaxHeight,
                      overflow: 'hidden' as const,
                    }
                  : undefined,
              ]}
            >
              {castAttachment}
            </View>
          ))}
        {hasNonCarouselAttachments && (
          <View style={styles.chatEmbedWrap}>{nonCarouselAttachments}</View>
        )}
        {typeof cast.token !== 'undefined' && (
          <View style={styles.chatEmbedWrap}>
            <PressableTokenFIP2Card
              token={cast.token}
              tx={cast.embeds?.transactions?.[0]}
            />
          </View>
        )}
      </>
    );
  }

  if (variant === 'focused') {
    return (
      <>
        {hasPreCarouselAttachments && (
          <View
            style={[
              t.flex,
              t.wFull,
              t.flexCol,
              t.mT3,
              t.pR3,
              { paddingLeft: 14, gap: 8 },
            ]}
          >
            {preCarouselAttachments}
          </View>
        )}
        {hasAttachments &&
          (needsCarousel ? (
            <AttachmentsCarousel
              hash={hash}
              isFocusedCast={isFocusedCast}
              {...(carouselItemWidth !== undefined
                ? { visibleItemInterval: carouselItemWidth + CAROUSEL_GAP }
                : {})}
              style={[
                t.wFull,
                t.flexRow,
                t.mT3,
                {
                  paddingLeft: 14,
                  ...(carouselMaxHeight !== undefined
                    ? {
                        maxHeight: carouselMaxHeight,
                        overflow: 'hidden' as const,
                      }
                    : {}),
                },
              ]}
              contentContainerStyle={[
                t.pR3,
                {
                  gap: CAROUSEL_GAP,
                  alignItems: 'flex-start',
                },
              ]}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews={false}
            >
              {castAttachment}
            </AttachmentsCarousel>
          ) : (
            <View
              style={[
                t.wFull,
                t.flexCol,
                t.mT3,
                t.pR3,
                {
                  paddingLeft: 14,
                  gap: 8,
                  ...(carouselMaxHeight !== undefined
                    ? {
                        maxHeight: carouselMaxHeight,
                        overflow: 'hidden' as const,
                      }
                    : {}),
                },
              ]}
            >
              {castAttachment}
            </View>
          ))}
        {hasNonCarouselAttachments && (
          <View
            style={[
              t.flex,
              t.wFull,
              t.flexCol,
              t.mT3,
              t.pR3,
              { paddingLeft: 14, gap: 8 },
            ]}
          >
            {nonCarouselAttachments}
          </View>
        )}
        {typeof cast.token !== 'undefined' && (
          <View
            style={[
              t.flex,
              t.wFull,
              t.flexCol,
              t.mT3,
              t.pR3,
              { paddingLeft: 14, gap: 8 },
            ]}
          >
            <PressableTokenFIP2Card
              token={cast.token}
              tx={cast.embeds?.transactions?.[0]}
            />
          </View>
        )}
      </>
    );
  }

  return (
    <>
      {castText.length === 0 && needsCarousel && <View style={[t.h4]} />}
      {hasPreCarouselAttachments && (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.wFull, t.mT3]}>
          <View
            style={[
              t.relative,
              t.hFull,
              {
                width: isAppsDialog
                  ? (avatarDiameter || 0) + 56
                  : (avatarDiameter || 0) + 23.5,
              },
            ]}
          >
            <PressableTargetToNavigateToCast
              castOpenIncludeReason={castOpenIncludeReason}
              hash={hash}
            />
          </View>
          <View style={[t.flexShrink, t.wFull, t.mR3]}>
            {preCarouselAttachments}
          </View>
        </View>
      )}
      {hasAttachments &&
        (needsCarousel ? (
          <AttachmentsCarousel
            hash={hash}
            key={hash}
            {...(carouselItemWidth !== undefined
              ? { visibleItemInterval: carouselItemWidth + CAROUSEL_GAP }
              : {})}
            style={[
              t.wFull,
              t.flexRow,
              t.mT3,
              {
                gap: CAROUSEL_GAP,
                zIndex: 5,
                ...(Platform.OS === 'android' ? { elevation: 6 } : {}),
                ...(carouselMaxHeight !== undefined
                  ? {
                      maxHeight: carouselMaxHeight,
                      overflow: 'hidden' as const,
                    }
                  : {}),
              },
            ]}
            contentContainerStyle={[
              isAppsDialog ? t.pR0 : t.pR3,
              {
                gap: CAROUSEL_GAP,
                alignItems: 'flex-start',
              },
            ]}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={false}
            directionalLockEnabled={true}
            {...swipeBlockerPropsToUse}
          >
            <View
              style={[
                t.relative,
                t.hFull,
                castText.length === 0 && [t.mT4],
                {
                  width: isAppsDialog
                    ? (avatarDiameter || 0) + 52
                    : (avatarDiameter || 0) + 15.5,
                },
              ]}
            >
              <PressableTargetToNavigateToCast
                castOpenIncludeReason={castOpenIncludeReason}
                hash={hash}
              />
            </View>
            {castAttachment}
            <View
              style={[
                t.relative,
                t.hFull,
                t.flexGrow,
                castText.length === 0 && [t.mT4],
                { marginRight: 2 },
              ]}
            >
              <PressableTargetToNavigateToCast
                castOpenIncludeReason={castOpenIncludeReason}
                hash={hash}
              />
            </View>
          </AttachmentsCarousel>
        ) : (
          <View
            style={[
              t.wFull,
              t.flexRow,
              t.mT3,
              {
                gap: CAROUSEL_GAP,
                zIndex: 5,
                ...(Platform.OS === 'android' ? { elevation: 6 } : {}),
                ...(carouselMaxHeight !== undefined
                  ? {
                      maxHeight: carouselMaxHeight,
                      overflow: 'hidden' as const,
                    }
                  : {}),
              },
              isAppsDialog ? t.pR0 : t.pR3,
            ]}
          >
            <View
              style={[
                t.relative,
                t.hFull,
                castText.length === 0 && [t.mT4],
                {
                  width: isAppsDialog
                    ? (avatarDiameter || 0) + 52
                    : (avatarDiameter || 0) + 15.5,
                },
              ]}
            >
              <PressableTargetToNavigateToCast
                castOpenIncludeReason={castOpenIncludeReason}
                hash={hash}
              />
            </View>
            {castAttachment}
            <View
              style={[
                t.relative,
                t.hFull,
                t.flexGrow,
                castText.length === 0 && [t.mT4],
                { marginRight: 2 },
              ]}
            >
              <PressableTargetToNavigateToCast
                castOpenIncludeReason={castOpenIncludeReason}
                hash={hash}
              />
            </View>
          </View>
        ))}
      {hasNonCarouselAttachments && (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.wFull, t.mT3]}>
          <View
            style={[
              t.relative,
              t.hFull,
              {
                width: isAppsDialog
                  ? (avatarDiameter || 0) + 56
                  : (avatarDiameter || 0) + 23.5,
              },
            ]}
          >
            <PressableTargetToNavigateToCast
              castOpenIncludeReason={castOpenIncludeReason}
              hash={hash}
            />
          </View>
          <View style={[t.flexShrink, t.wFull, t.mR3]}>
            {nonCarouselAttachments}
          </View>
        </View>
      )}
      {typeof cast.token !== 'undefined' && (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.wFull, t.mT3]}>
          <View
            style={[
              t.relative,
              t.hFull,
              {
                width: isAppsDialog
                  ? (avatarDiameter || 0) + 52
                  : (avatarDiameter || 0) + 15.5,
              },
            ]}
          >
            <PressableTargetToNavigateToCast
              castOpenIncludeReason={castOpenIncludeReason}
              hash={hash}
            />
          </View>
          <View style={[t.flexShrink, t.wFull, t.mR3]}>
            <PressableTokenFIP2Card
              token={cast.token}
              tx={cast.embeds?.transactions?.[0]}
            />
          </View>
        </View>
      )}
    </>
  );
});

function usePagerSwipeBlockerProps({
  setSwipeEnabled,
}: {
  setSwipeEnabled: ({ enabled }: { enabled: boolean }) => void;
}) {
  const watchdog = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (watchdog.current) {
        clearTimeout(watchdog.current);
      }
    };
  }, []);

  if (typeof setSwipeEnabled !== 'function') {
    return;
  }

  const disablePager = () => {
    setSwipeEnabled({ enabled: false });
    watchdog.current = setTimeout(
      () => setSwipeEnabled({ enabled: true }),
      350,
    );
  };

  const enablePager = () => {
    setSwipeEnabled({ enabled: true });
    if (watchdog.current) {
      clearTimeout(watchdog.current);
    }
  };

  return {
    onTouchStart: (_e: GestureResponderEvent) => disablePager(),
    onScrollEndDrag: enablePager,
    onMomentumScrollEnd: enablePager,
    onResponderTerminate: enablePager,
  };
}

const styles = StyleSheet.create({
  chatEmbedWrap: {
    marginTop: 8,
  },
  chatCarouselWrap: {
    marginTop: 8,
    flexDirection: 'row',
    gap: CAROUSEL_GAP,
    width: '100%',
  },
  chatCarouselContent: {
    gap: CAROUSEL_GAP,
    alignItems: 'flex-start',
  },
});

export { CastAttachmentsSection };
export type { CastAttachmentsSectionVariant };
