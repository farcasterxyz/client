import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastCollectible,
  ApiCastCollectibleAuctionBid,
  ApiCastCollectibleMinted,
  ApiCastCollectibleUnavailable,
  CastHashPrefix,
} from 'farcaster-client-data';
import {
  formatBidValue,
  getNotionLinkTarget,
  useGetGloballyCachedCast,
  useNonSuspenseThread,
  useSetUserPreferences,
  useUnwatchCastCollectible,
  useUserCast,
  useUserPreferences,
  useWatchCastCollectible,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  BottomSheetContentContainer,
  ButtonV2,
  HoldToTransactButton,
  Text2,
  useIsAdmin,
} from 'farcaster-expo';
import {
  Bell,
  Bug,
  Check,
  GalleryVerticalEnd,
  HandHeart,
  Info,
  Timer,
} from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import {
  BidError,
  CollectibleCastArtifact,
  CollectibleCastBids,
  CollectibleTimer,
  LocalBid,
  useCollectCast,
  UseCollectCastResult,
  useCollectibleCastBid,
} from '~/components/CollectibleCast';
import { useDismissibleSheet } from '~/components/DismissibleSheet';
import { BellCheckFillIcon } from '~/components/icons';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { ForceThemeProvider, useTheme } from '~/contexts/ThemeProvider';
import { useReplace } from '~/hooks/navigation/useReplace';
import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';
import { trackError } from '~/utils/ErrorUtils';

import { CollectibleCastEditBidBottomSheet } from './CollectibleCastEditBidBottomSheet';
import { Sparkle } from './Sparkle';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const ARTIFACT_SIZE = 300;

const ANIMATION_CONFIG = {
  SLOW: {
    duration: 1000,
    easing: Easing.out(Easing.cubic),
  },
  FAST: {
    duration: 600,
    easing: Easing.out(Easing.cubic),
  },
  NORMAL: {
    duration: 400,
    easing: Easing.out(Easing.cubic),
  },
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function CollectibleCastByCastHash({
  castHash,
  username,
  scrollOffset,
  slideProgress,
}: {
  castHash: string;
  username?: string;
  scrollOffset?: SharedValue<number>;
  slideProgress?: SharedValue<number>;
}) {
  const getGloballyCachedCast = useGetGloballyCachedCast();

  const cast = useMemo(
    () => getGloballyCachedCast({ hash: castHash, recast: false }),
    [castHash, getGloballyCachedCast],
  );

  if (cast) {
    return (
      <CollectibleCast
        cast={cast}
        scrollOffset={scrollOffset}
        slideProgress={slideProgress}
      />
    );
  }

  if (username) {
    return (
      <CollectibleCastByUsername
        username={username}
        castHash={castHash}
        scrollOffset={scrollOffset}
      />
    );
  }

  return (
    <CollectibleCastByHash castHash={castHash} scrollOffset={scrollOffset} />
  );
}

function CollectibleCastByUsername({
  username,
  castHash,
  scrollOffset,
}: {
  username: string;
  castHash: string;
  scrollOffset?: SharedValue<number>;
}) {
  const { data } = useUserCast({
    username,
    hashPrefix: castHash.slice(0, 10) as CastHashPrefix,
  });

  if (!data) {
    return null;
  }

  return (
    <CollectibleCast cast={data.result.cast} scrollOffset={scrollOffset} />
  );
}

function CollectibleCastByHash({
  castHash,
  scrollOffset,
}: {
  castHash: string;
  scrollOffset?: SharedValue<number>;
}) {
  const { data } = useNonSuspenseThread({
    castHash,
  });

  if (!data) {
    return null;
  }

  const cast = data.pages[0].result.casts.find((c) => c.hash === castHash);

  if (!cast) {
    return null;
  }

  return <CollectibleCast cast={cast} scrollOffset={scrollOffset} />;
}

function CollectibleCast({
  cast,
  scrollOffset,
  slideProgress,
}: {
  cast: ApiCast;
  scrollOffset?: SharedValue<number>;
  slideProgress?: SharedValue<number>;
}) {
  const { trackEvent } = useAnalytics();

  // Fetch collectible data
  const result = useCollectCast({
    cast,
  });

  const { refetchCollectible, collectible: fetchedCollectible } = result;

  const collectible = useMemo(() => {
    return fetchedCollectible ?? cast.collectible;
  }, [fetchedCollectible, cast.collectible]);

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewCollectCast, {
        castHash: cast.hash,
        castFid: cast.author.fid,
        castUsername: cast.author.username,
      });

      refetchCollectible();
    }, [
      trackEvent,
      cast.hash,
      cast.author.fid,
      cast.author.username,
      refetchCollectible,
    ]),
  );

  if (!cast || !collectible) {
    return null;
  }

  return (
    <CollectibleCastContainer
      cast={cast}
      collectible={collectible}
      scrollOffset={scrollOffset}
      context={result}
      slideProgress={slideProgress}
    />
  );
}

function CollectibleCastContainer({
  cast,
  collectible,
  scrollOffset,
  context,
  slideProgress,
}: {
  cast: ApiCast;
  collectible: ApiCastCollectible;
  scrollOffset?: SharedValue<number>;
  context: UseCollectCastResult;
  slideProgress?: SharedValue<number>;
}) {
  const bottomSheetModalRef = useBottomSheetModalRef();
  const t = useTheme();

  const { localBid, bidHistory, auction } = context;
  const {
    bidAmount,
    submitBid,
    bidError,
    calculateBidError,
    setBidAmount,
    balanceFloat,
  } = useCollectibleCastBid({
    cast,
    chain: collectible.chain,
    auction,
    setLocalBid: context.setLocalBid,
    forceUpdateAuction: context.forceUpdateAuction,
  });

  // Bottom sheet animations
  const bottomSheetPosition = useSharedValue(SCREEN_HEIGHT);

  const onBackdropPress = useCallback(() => {
    DdRum.addAction(RumActionType.CUSTOM, 'backdrop-press', {
      feature: 'collectible-casts',
    });
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={-1}
        opacity={0}
        onPress={onBackdropPress}
      />
    ),
    [onBackdropPress],
  );

  const openBidBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, [bottomSheetModalRef]);

  return (
    <View style={[t.flex1]}>
      <ForceThemeProvider
        colorScheme={collectible.state === 'minted' ? 'dark' : undefined}
      >
        <CollectibleCastMainContent
          cast={cast}
          collectible={collectible}
          localBid={localBid}
          bottomSheetPosition={bottomSheetPosition}
          scrollOffset={scrollOffset}
          bidHistory={bidHistory}
          topBid={bidHistory.length ? bidHistory[0] : undefined}
          slideProgress={slideProgress}
        />
      </ForceThemeProvider>

      {(collectible.state === 'auction-active' ||
        collectible.state === 'auction-pending') && (
        <BidContainer
          cast={cast}
          bottomSheetModalRef={bottomSheetModalRef}
          bottomSheetPosition={bottomSheetPosition}
          forceUpdating={context.forceUpdating}
          renderBackdrop={renderBackdrop}
          openBidBottomSheet={openBidBottomSheet}
          calculateBidError={calculateBidError}
          submitBid={submitBid}
          bidError={bidError}
          bidAmount={bidAmount}
          setBidAmount={setBidAmount}
          localBid={localBid}
          balance={balanceFloat ?? 0}
        />
      )}
      {collectible.state === 'unavailable' && (
        <UnavailableContainer cast={cast} collectible={collectible} />
      )}
    </View>
  );
}

// Main content component - displays the collectible cast UI
function CollectibleCastMainContent({
  cast,
  collectible,
  localBid,
  bottomSheetPosition,
  scrollOffset: parentScrollOffset,
  bidHistory,
  topBid,
  slideProgress,
}: {
  cast: ApiCast;
  collectible: ApiCastCollectible;
  localBid: LocalBid | undefined;
  bottomSheetPosition: SharedValue<number>;
  scrollOffset?: SharedValue<number>;
  bidHistory: ApiCastCollectibleAuctionBid[];
  topBid: ApiCastCollectibleAuctionBid | undefined;
  slideProgress?: SharedValue<number>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { panGestureRef } = useDismissibleSheet();

  const isAuctionPending = collectible.state === 'auction-pending';
  const isAuctionPendingActive =
    isAuctionPending && localBid?.state === 'pending';
  const isAuctionActive =
    collectible.state === 'auction-active' ||
    collectible.state === 'auction-ended' ||
    localBid?.state === 'succeeded';
  const isMinted = collectible.state === 'minted';

  const showAuctionInfo =
    bidHistory.length > 0 && (isAuctionPending || isAuctionActive);
  const showBids = bidHistory.length > 0;
  const centerArtifact = bidHistory.length === 0;

  const artifactTopPosition = useSharedValue(0);

  useEffect(() => {
    // Start centered, animate to top when auction is no longer pending
    artifactTopPosition.value = withTiming(
      centerArtifact ? 0 : 1,
      ANIMATION_CONFIG.NORMAL,
    );
  }, [centerArtifact, artifactTopPosition]);

  const bottomSheetHeight = useDerivedValue(() => {
    return SCREEN_HEIGHT - bottomSheetPosition.value;
  });

  const bottomSheetBackdropStyle = useAnimatedStyle(() => {
    const height = bottomSheetHeight.value;
    const progress = height / SCREEN_HEIGHT;

    // Simple opacity curve
    const opacity = interpolate(
      progress,
      [0, 0.5, 1],
      [0, 0.25, 0.5],
      Extrapolation.CLAMP,
    );

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity,
      backgroundColor: 'black',
      pointerEvents: 'none',
    };
  });

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, ANIMATION_CONFIG.SLOW);
  }, [opacity]);

  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // Track scroll offset for gesture handling
  const localScrollOffset = useSharedValue(0);
  const scrollOffset = parentScrollOffset || localScrollOffset;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // Calculate artifact position
  const footerHeight = 96; // Footer height
  const handleHeight = 4; // Handle actual height
  const scrollViewTopPadding = insets.top + 15; // From contentContainerStyle

  // Total space used by UI elements
  const topOffset = insets.top + handleHeight + scrollViewTopPadding;
  const bottomOffset = footerHeight + insets.bottom;

  // Available height is screen minus all the chrome
  const availableHeight = SCREEN_HEIGHT - topOffset - bottomOffset;

  const artifactContainerAnimatedStyle = useAnimatedStyle(() => {
    // When centered: position artifact in the middle of available space
    // When at top: position 40px from top (relative to scroll content area)
    const centerPosition = (availableHeight - ARTIFACT_SIZE) / 2;
    const topPosition = 40;

    const paddingTop = interpolate(
      artifactTopPosition.value,
      [0, 1],
      [centerPosition, topPosition],
      Extrapolation.CLAMP,
    );

    return {
      paddingTop,
      paddingBottom: 20,
    };
  });

  // Shared opacity for synchronized animations between AuctionInfo and bids section
  const pendingBidOpacity = useSharedValue(isAuctionPendingActive ? 0.4 : 0);
  const isShimmering = useSharedValue(false);

  const shouldShimmerPendingBid = showBids && isAuctionPendingActive;

  const startPendingBidShimmer = useCallback(() => {
    isShimmering.value = true;
    pendingBidOpacity.value = withSequence(
      withTiming(0.4, { duration: 300 }),
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 900,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.4, {
            duration: 900,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1, // repeat infinitely
        false, // don't reverse
      ),
    );
  }, [isShimmering, pendingBidOpacity]);

  const stopPendingBidShimmer = useCallback(() => {
    cancelAnimation(pendingBidOpacity);
    isShimmering.value = false;
    pendingBidOpacity.value = 0.4;
  }, [isShimmering, pendingBidOpacity]);

  useAnimationPauseOnBackground({
    enabled: shouldShimmerPendingBid,
    startAnimation: startPendingBidShimmer,
    stopAnimation: stopPendingBidShimmer,
  });

  useEffect(() => {
    if (showBids) {
      if (isAuctionActive || isMinted) {
        cancelAnimation(pendingBidOpacity);

        if (isShimmering.value) {
          // Was shimmering, let it finish naturally at 1
          isShimmering.value = false;
          // Ensure we're at 1 or animating to 1
          if (pendingBidOpacity.value < 1) {
            pendingBidOpacity.value = withTiming(1, {
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
            });
          }
        } else {
          // Direct mount or already active
          pendingBidOpacity.value = withTiming(1, ANIMATION_CONFIG.FAST);
        }
      }
    } else {
      cancelAnimation(pendingBidOpacity);
      isShimmering.value = false;
      pendingBidOpacity.value = 0;
    }
  }, [showBids, isAuctionActive, pendingBidOpacity, isShimmering, isMinted]);

  // Cancel the infinite withRepeat shimmer on unmount.
  useEffect(() => {
    return () => {
      cancelAnimation(pendingBidOpacity);
    };
  }, [pendingBidOpacity]);

  // Animated style for bottom section - use shared opacity for synchronized animations
  const bottomSectionAnimatedStyle = useAnimatedStyle(() => {
    // For active auctions, always use pendingBidOpacity for consistent animation
    // For other cases, use the regular fade-in
    return {
      opacity: showBids ? pendingBidOpacity.value : opacity.value,
    };
  });

  const replace = useReplace();
  const isAdmin = useIsAdmin();

  const handleAuctionsPress = useCallback(() => {
    replace('ExploreCollectibleCastsScreen', {});
  }, [replace]);

  const handleInfoPress = useCallback(() => {
    openBrowserAsync(getNotionLinkTarget({ to: 'collectible-casts' }));
  }, []);

  const handleDebugPress = useCallback(() => {
    replace('DebugCollectibleCasts', {});
  }, [replace]);

  return (
    <View style={[t.flex1]}>
      {collectible.state === 'minted' && (
        <View
          style={[
            t.absolute,
            t.top0,
            t.left0,
            t.right0,
            t.bottom0,
            t.bgBlack,
            { opacity: 0.75 },
          ]}
        />
      )}

      <View
        style={[
          t.roundedFull,
          {
            width: 58,
            height: 4,
            backgroundColor: t.colors.text.primary,
            opacity: 0.25,
            marginTop: insets.top,
            marginBottom: 12,
            marginHorizontal: 'auto',
          },
        ]}
      />

      {/* Scrollable content */}
      <AnimatedScrollView
        ref={scrollViewRef}
        style={[t.flex1]}
        contentContainerStyle={[
          t.flexGrow,
          {
            paddingBottom: showBids ? 120 + insets.bottom : insets.bottom + 70,
          },
        ]}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        bounces={false}
        simultaneousHandlers={panGestureRef}
      >
        {/* Artifact section */}
        <Animated.View style={[t.itemsCenter, artifactContainerAnimatedStyle]}>
          <AnimatedArtifact cast={cast} slideProgress={slideProgress} />
        </Animated.View>

        {/* Bottom section with details and bids */}
        <Animated.View style={[t.pX3, { gap: 20 }, bottomSectionAnimatedStyle]}>
          {showAuctionInfo && (
            <AuctionInfo
              topBidValue={topBid?.value}
              auctionEnd={
                collectible.state === 'auction-active' ||
                collectible.state === 'auction-ended'
                  ? collectible.auction.end
                  : undefined
              }
              isActive={isAuctionActive}
              isPendingWithBid={isAuctionPendingActive}
            />
          )}

          {isMinted && <MintedDetails collectible={collectible} />}

          {showBids ? (
            <CollectibleCastBids
              bidHistory={bidHistory}
              isBidPending={localBid?.state === 'pending'}
            />
          ) : (
            <View style={[t.flex1]} />
          )}
        </Animated.View>
        <View style={[t.absolute, t.wFull, t.flexRow, t.justifyBetween, t.pX3]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <AnimatedPressable onPress={handleInfoPress}>
              <View
                style={[t.p2, t.roundedFull, t.itemsCenter, t.justifyCenter]}
              >
                <Info size={20} color={t.colors.text.primary} />
              </View>
            </AnimatedPressable>
            {isAdmin && (
              <AnimatedPressable onPress={handleDebugPress}>
                <View
                  style={[t.p2, t.roundedFull, t.itemsCenter, t.justifyCenter]}
                >
                  <Bug size={20} color={t.colors.text.primary} />
                </View>
              </AnimatedPressable>
            )}
          </View>
          <AnimatedPressable onPress={handleAuctionsPress}>
            <View style={[t.p2, t.roundedFull, t.itemsCenter, t.justifyCenter]}>
              <GalleryVerticalEnd
                size={20}
                color={t.colors.text.primary}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </View>
          </AnimatedPressable>
        </View>
      </AnimatedScrollView>

      <Animated.View style={bottomSheetBackdropStyle} />
    </View>
  );
}

function UnavailableContainer({
  cast,
  collectible,
}: {
  cast: ApiCast;
  collectible: ApiCastCollectibleUnavailable;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const isWatching = collectible.viewerContext?.isWatching ?? false;
  const watchCastCollectible = useWatchCastCollectible();
  const unwatchCastCollectible = useUnwatchCastCollectible();

  const handlePress = useCallback(async () => {
    try {
      if (isWatching) {
        await unwatchCastCollectible({ cast });
      } else {
        await watchCastCollectible({ cast });
      }
    } catch (error) {
      trackError(error);
    }
  }, [cast, isWatching, watchCastCollectible, unwatchCastCollectible]);

  return (
    <View
      style={[
        t.absolute,
        t.bottom0,
        t.left0,
        t.right0,
        t.p3,
        {
          paddingBottom: insets.bottom,
          paddingTop: 16,
          gap: 8,
        },
      ]}
    >
      <Text2
        weight="medium"
        align="center"
        color="tertiary"
        size="sm"
        style={[t.mB3]}
      >
        Can’t be collected yet
      </Text2>
      <ButtonV2
        textSize="lg"
        variant={isWatching ? 'secondary' : 'primary'}
        title={isWatching ? 'Subscribed' : 'Notify me when available'}
        Icon={({ color }) =>
          isWatching ? (
            <BellCheckFillIcon color={color} size={19} />
          ) : (
            <Bell
              color={color}
              size={19}
              {...(isWatching ? { fill: color } : undefined)}
            />
          )
        }
        onPress={handlePress}
      />
    </View>
  );
}

function BidContainer({
  bottomSheetModalRef,
  bottomSheetPosition,
  renderBackdrop,
  localBid,
  forceUpdating,
  openBidBottomSheet,
  submitBid,
  bidAmount,
  setBidAmount,
  bidError,
  calculateBidError,
  balance,
}: {
  cast: ApiCast;
  bottomSheetModalRef: ReturnType<typeof useBottomSheetModalRef>;
  bottomSheetPosition: SharedValue<number>;
  renderBackdrop: (props: BottomSheetBackdropProps) => React.ReactElement;
  localBid: LocalBid | undefined;
  bidAmount: string;
  forceUpdating: boolean;
  setBidAmount: (value: string) => void;
  openBidBottomSheet: () => void;
  submitBid: () => Promise<void>;
  balance: number;
  bidError: BidError | null;
  calculateBidError: (amount: string) => BidError | null;
}) {
  const bidIntroSheetModalRef = useBottomSheetModalRef();

  return (
    <>
      <BidFooter
        isBidPending={localBid?.state === 'pending'}
        forceUpdating={forceUpdating}
        editBid={openBidBottomSheet}
        submitBid={submitBid}
        bidError={bidError}
        bidAmount={bidAmount}
        bidIntroSheetModalRef={bidIntroSheetModalRef}
      />

      <BottomSheetModal
        name="collectibleCastBidding"
        ref={bottomSheetModalRef}
        enableDynamicSizing={true}
        animatedPosition={bottomSheetPosition}
        backdropComponent={renderBackdrop}
      >
        <CollectibleCastEditBidBottomSheet
          setBidAmount={setBidAmount}
          calculateBidError={calculateBidError}
          onClose={() => bottomSheetModalRef.current?.dismiss()}
          balance={balance}
        />
      </BottomSheetModal>

      {/* Bid intro sheet modal */}
      <BottomSheetModal
        name="collectibleCastBidIntro"
        ref={bidIntroSheetModalRef}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
      >
        <CollectibleCastBidBottomSheetIntro
          onClose={() => bidIntroSheetModalRef.current?.dismiss()}
        />
      </BottomSheetModal>
    </>
  );
}

function CollectibleCastBidBottomSheetIntro({
  onClose,
}: {
  onClose: () => void;
}) {
  const t = useTheme();
  const setUserPreference = useSetUserPreferences();

  useEffect(() => {
    setUserPreference({
      preferences: {
        showCollectibleCastBidIntro: false,
      },
    });
  }, [setUserPreference]);

  return (
    <BottomSheetContentContainer>
      <View>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text2 size="2xl" weight="semibold">
            How auctions work
          </Text2>
        </View>
        <View style={{ gap: 24, paddingVertical: 24, paddingHorizontal: 16 }}>
          <View style={[t.flexRow, { gap: 12 }]}>
            <HandHeart color={t.colors.text.primary} strokeWidth={1.5} />
            <View style={[t.flex1, { gap: 4 }]}>
              <Text2 weight="semibold">Highest bidder wins</Text2>
              <Text2 color="secondary">
                If multiple people want to collect a cast, it goes to the
                highest bidder. Other bids are refunded and creators earn 90% of
                the proceeds.
              </Text2>
            </View>
          </View>
          <View style={[t.flexRow, { gap: 12 }]}>
            <Timer color={t.colors.text.primary} strokeWidth={1.5} />
            <View style={[t.flex1, { gap: 4 }]}>
              <Text2 weight="semibold">Timed auctions</Text2>
              <Text2 color="secondary">
                New casts auction for 24 hours before going to the highest
                bidder. Historical casts auction last for a week.
              </Text2>
            </View>
          </View>
          <View style={[t.flexRow, { gap: 12 }]}>
            <Sparkle color={t.colors.text.primary} strokeWidth={1.5} />
            <View style={[t.flex1, { gap: 4 }]}>
              <Text2 weight="semibold">Bid notifications</Text2>
              <Text2 color="secondary">
                We’ll notify you if you get outbid on a cast that you tried to
                collect. You can increase your bid at any time.
              </Text2>
            </View>
          </View>
        </View>
        <AnimatedPressable
          onPress={onClose}
          style={{ height: 48, marginTop: 16 }}
        >
          <View
            style={[
              t.flex1,
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.bgActionPrimary,
              {
                borderRadius: 32,
                height: 48,
                gap: 10,
              },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              Continue
            </Text2>
          </View>
        </AnimatedPressable>
      </View>
    </BottomSheetContentContainer>
  );
}

// Helper component for auction info
function AuctionInfo({
  topBidValue,
  auctionEnd,
  isActive,
  isPendingWithBid,
}: {
  topBidValue?: number;
  auctionEnd?: number;
  isActive: boolean;
  isPendingWithBid: boolean;
}) {
  const t = useTheme();

  // Show bid value as 1 when pending, actual value when active
  const displayBidValue = isPendingWithBid && !isActive ? 1 : topBidValue;

  const isOver = auctionEnd && auctionEnd < Date.now();

  return (
    <View
      style={[
        t.flexRow,
        t.justifyBetween,
        t.itemsCenter,
        t.pX3,
        t.wFull,
        { paddingHorizontal: (SCREEN_WIDTH - ARTIFACT_SIZE) / 2 },
      ]}
    >
      <View style={{ gap: 4 }}>
        <Text2 color="secondary" size="sm" weight="medium">
          {isOver ? 'Winning Bid' : 'Current Bid'}
        </Text2>
        <Text2 size="2xl" weight="medium">
          {displayBidValue ? `$${displayBidValue}` : '-'}
        </Text2>
      </View>
      <View style={[t.itemsEnd, { gap: 4 }]}>
        <Text2 color="secondary" size="sm" weight="medium">
          Ends in
        </Text2>
        <View style={[t.itemsEnd, { width: 90 }]}>
          <CollectibleTimer end={auctionEnd} />
        </View>
      </View>
    </View>
  );
}

// Helper component for minted details
function MintedDetails({
  collectible,
}: {
  collectible: ApiCastCollectibleMinted;
}) {
  const t = useTheme();

  return (
    <View style={{ gap: 12 }}>
      <Text2 size="lg" weight="semibold" style={[t.pX1]}>
        Details
      </Text2>
      <View
        style={[
          t.pX4,
          t.pY3,
          t.flexRow,
          t.justifyBetween,
          t.itemsCenter,
          {
            gap: 12,
            backgroundColor: t.dark ? '#FFFFFF10' : '#FFF',
            borderRadius: 16,
          },
        ]}
      >
        <Text2 color="secondary" weight="medium">
          Owned by
        </Text2>
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Avatar pfpUrl={collectible.owner?.user?.pfp?.url} diameter={24} />
          <Text2 weight="semibold">{collectible.owner?.user?.username}</Text2>
        </View>
      </View>
    </View>
  );
}

// Bottom sheet component with bid button
function BidFooter({
  isBidPending,
  forceUpdating,
  editBid,
  submitBid,
  bidError,
  bidAmount,
  bidIntroSheetModalRef,
}: {
  isBidPending: boolean;
  forceUpdating: boolean;
  editBid: () => void;
  submitBid: () => Promise<void>;
  bidError: BidError | null;
  bidAmount: string;
  bidIntroSheetModalRef: ReturnType<typeof useBottomSheetModalRef>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();

  const { data: userPreferences } = useUserPreferences();
  const [state, setState] = useState<'idle' | 'bidding' | 'successful'>('idle');

  useEffect(() => {
    if (isBidPending) {
      setState('bidding');
    } else {
      setState((prev) => (prev === 'bidding' ? 'successful' : 'idle'));
    }
  }, [isBidPending]);

  useEffect(() => {
    if (state === 'successful') {
      setTimeout(() => {
        setState('idle');
      }, 1500);
    }
  }, [state]);

  const onPress = useMemo(() => {
    if (userPreferences?.result.preferences.showCollectibleCastBidIntro) {
      return () => bidIntroSheetModalRef.current?.present();
    }
  }, [userPreferences, bidIntroSheetModalRef]);

  const label = useMemo(() => {
    if (forceUpdating) {
      return 'Refreshing';
    }

    if (bidError) {
      return bidError.message;
    }

    if (state === 'successful') {
      return 'Success';
    }

    if (isBidPending) {
      return 'Bidding';
    }

    return `Hold to bid ${formatBidValue(parseFloat(bidAmount))}`;
  }, [forceUpdating, bidError, state, isBidPending, bidAmount]);

  const isButtonDisabled = useMemo(() => {
    return !!bidError || isBidPending || forceUpdating;
  }, [bidError, isBidPending, forceUpdating]);

  const isInsufficient =
    bidError?.key === 'insufficient_balance' ||
    bidError?.key === 'insufficient_eth_for_gas';

  const MemoizedSparkle = React.useCallback(
    ({ isPressing }: { isPressing: boolean }) => {
      if (isBidPending || isPressing) {
        return (
          <Sparkle
            size={16}
            color="white"
            fill="white"
            isSpinning={isPressing || isBidPending}
          />
        );
      } else if (state === 'successful') {
        return <Check size={16} color="white" />;
      }
      return null;
    },
    [isBidPending, state],
  );

  useEffect(() => {
    if (
      bidError &&
      (bidError.key === 'insufficient_balance' ||
        bidError.key === 'insufficient_eth_for_gas')
    ) {
      trackEvent(AnalyticsEvent.CollectCastBidInputError, {
        bidAmount,
        error: bidError.message,
        errorKey: bidError.key,
      });
    }
  }, [bidAmount, bidError, trackEvent]);

  return (
    <BlurView
      intensity={20}
      tint="systemMaterial"
      style={[
        t.absolute,
        t.bottom0,
        t.left0,
        t.right0,
        t.p3,
        {
          paddingBottom: insets.bottom,
          paddingTop: 16,
          gap: 12,
        },
      ]}
    >
      {onPress ? (
        <AnimatedPressable onPress={onPress} style={{ flex: 1, height: 48 }}>
          <View
            style={[
              t.flex1,
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              {label}
            </Text2>
          </View>
        </AnimatedPressable>
      ) : (
        <HoldToTransactButton
          usdValue={parseFloat(bidAmount)}
          title={label}
          Icon={MemoizedSparkle}
          pressingTitle="Bidding"
          onConfirm={submitBid}
          disabled={isButtonDisabled || state === 'successful'}
        />
      )}
      {!isInsufficient && (
        <AnimatedPressable onPress={editBid} disabled={isButtonDisabled}>
          <Text2
            weight="medium"
            align="center"
            size="sm"
            style={{ opacity: isButtonDisabled ? 0.25 : 0.5 }}
          >
            Change bid amount
          </Text2>
        </AnimatedPressable>
      )}
    </BlurView>
  );
}

function AnimatedArtifact({
  cast,
  slideProgress,
}: {
  cast: ApiCast;
  slideProgress?: SharedValue<number>;
}) {
  const t = useTheme();
  const replace = useReplace();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);
  const scale = useSharedValue(SCREEN_WIDTH / ARTIFACT_SIZE); // Start scaled to screen width

  useEffect(() => {
    setTimeout(() => {
      opacity.set(withTiming(1, ANIMATION_CONFIG.FAST));
      translateY.set(withTiming(0, ANIMATION_CONFIG.FAST));
      scale.set(withTiming(1, ANIMATION_CONFIG.SLOW)); // Animate to normal size
    }, 100);
  }, [translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    };
  });

  const size = useSharedValue(ARTIFACT_SIZE);

  const goToCast = useCallback(() => {
    if (slideProgress && slideProgress.value !== 1) {
      return;
    }

    replace('Cast', {
      castHash: cast.hash,
    });
  }, [cast.hash, replace, slideProgress]);

  return (
    <Animated.View
      style={[
        t.itemsCenter,
        t.justifyCenter,
        {
          height: ARTIFACT_SIZE,
          width: ARTIFACT_SIZE,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <AnimatedPressable onPress={goToCast}>
        <CollectibleCastArtifact cast={cast} size={size} enableParallax />
      </AnimatedPressable>
    </Animated.View>
  );
}
