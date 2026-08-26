import { Octicons } from '@expo/vector-icons';
import {
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast, ApiUser, getCastURL } from 'farcaster-client-data';
import {
  CastClickType,
  useNonSuspendingShareCast,
  useNonSuspenseSearchUsers,
  userKeyExtractor,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import { SkeletonPlaceholder } from 'farcaster-expo';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { FlatList as GestureFlatList } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { CastImageViewer } from '~/components/casts/CastActions/CastImageViewer';
import { ShareActionsBar } from '~/components/casts/CastActions/ShareActionsBar';
import { DirectCastsSlimUser } from '~/components/DirectCasts/DirectCastsSlimUser';
import { ChunkedShareCastTargets } from '~/components/prompts/ChunkedShareCastTargets';
import { SearchInput } from '~/components/SearchInput';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useDirectCastShare } from '~/hooks/useDirectCastShare';

type VideoShareSheetProps = {
  cast: ApiCast;
  onDismiss: () => void;
};

const List = Platform.OS === 'android' ? GestureFlatList : FlatList;
export const NUM_SUGGESTED_TARGETS = 20;
const VISIBLE_SUGGESTED_TARGETS_ROWS = 2.5;
const ROW_HEIGHT = 84;
const FOOTER_HEIGHT = 140;

const VideoShareSheet: FC<VideoShareSheetProps> = ({ cast, onDismiss }) => {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const insetBottom = bottom;
  const [selectedTargets, setSelectedTargets] = React.useState<
    (string | number)[]
  >([]);
  const [searchedTargets, setSearchedTargets] = React.useState<ApiUser[]>([]);

  const [copiedCastURL, setCopiedCastURL] = useState<boolean>(false);
  const [showImageShare, setShowImageShare] = useState(false);
  const [searchFilter, setSearchFilter] = useState<string | undefined>(
    undefined,
  );
  const searchInputRef = useRef<TextInput>(null);
  const animatedFooterTransform = useSharedValue(0);
  const [sheetIsExtended, setSheetIsExtended] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const initialHeight =
    VISIBLE_SUGGESTED_TARGETS_ROWS * ROW_HEIGHT + FOOTER_HEIGHT;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const gridHeight = useSharedValue(initialHeight);
  const isInitialMount = useRef(true);
  const { trackEvent } = useAnalytics();
  const trackCastClick = useTrackCastClick();

  useEffect(() => {
    trackEvent(AnalyticsEvent.VideoFeedShareSheetView);
  }, [trackEvent]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        if (Platform.OS === 'android') {
          animatedFooterTransform.value = withTiming(-e.endCoordinates.height, {
            duration: 250,
          });
        }
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        if (Platform.OS === 'android') {
          animatedFooterTransform.value = withTiming(0, {
            duration: 250,
          });
        }
      },
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [animatedFooterTransform]);

  const { data, isLoading: isLoadingShareCastTargets } =
    useNonSuspendingShareCast({
      castHash: cast.hash,
      context: 'video',
      maxTargets: NUM_SUGGESTED_TARGETS,
    });

  const targets = useMemo(() => {
    const users =
      data?.result.targets
        .map((o) => (o.type === 'user' ? o.content.user : null))
        .filter((o): o is ApiUser => o !== null) || [];
    const uniqueUsers = users.filter(
      (user, index, arr) => arr.findIndex((u) => u.fid === user.fid) === index,
    );
    return uniqueUsers;
  }, [data]);

  const combinedUserTargets: ApiUser[] = React.useMemo(() => {
    const combined = [
      ...searchedTargets,
      ...targets.filter(
        (o) => searchedTargets.map(({ fid }) => fid).indexOf(o.fid) === -1,
      ),
    ];
    return combined;
  }, [searchedTargets, targets]);

  const { data: searchData, fetchNextPage: fetchSearchResultsNextPage } =
    useNonSuspenseSearchUsers({
      q: searchFilter || '',
      excludeSelf: true,
      includeDirectCastAbility: true,
    });

  const searchResults = useMemo(() => {
    const allUsers =
      searchData?.pages.flatMap((page) => page.result.users) || [];
    const uniqueUsers = allUsers.filter(
      (user, index, arr) => arr.findIndex((u) => u.fid === user.fid) === index,
    );
    return uniqueUsers;
  }, [searchData]);

  const isInSearchMode = typeof searchFilter !== 'undefined';

  const castURL = useMemo(() => {
    return getCastURL({
      castUsername: cast.author.username,
      castHash: cast.hash,
    });
  }, [cast.author.username, cast.hash]);

  const onTargetPress = useCallback(
    ({ target }: { target: string | number }) => {
      setSelectedTargets((prev) => {
        if (prev.indexOf(target) !== -1) {
          return prev.filter((o) => o !== target);
        }
        return [...prev, target];
      });
    },
    [],
  );

  const onSearchedUserPress = React.useCallback(
    ({ user }: { user: ApiUser }) => {
      setSearchedTargets((prev) => {
        if (prev.map(({ fid }) => fid).indexOf(user.fid) !== -1) {
          return prev.filter((o) => o.fid !== user.fid);
        }
        return [...prev, user];
      });

      onTargetPress({ target: user.fid });

      setSearchFilter(undefined);
    },
    [onTargetPress],
  );

  const handleOnComplete = useCallback(() => {
    trackEvent(AnalyticsEvent.VideoFeedShareSheetSendDirectCasts);
    trackCastClick({ type: CastClickType.ShareDirectCast, feed: 'video' });
    onDismiss();
  }, [trackEvent, trackCastClick, onDismiss]);

  const { sendToTargets } = useDirectCastShare({
    cast,
    castURL,
    targets: [],
    onComplete: handleOnComplete,
  });

  const onSendPress = useCallback(
    (message: string) => {
      sendToTargets(selectedTargets, message);
    },
    [selectedTargets, sendToTargets],
  );

  const animatedFooterStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: animatedFooterTransform.value }],
    };
  });

  const onCopyCastURL = useCallback(() => {
    setCopiedCastURL(true);
    setTimeout(() => {
      setCopiedCastURL(false);
    }, 3000);
  }, []);

  const handleOnFocus = useCallback(() => {
    // Empty for now - can be implemented if needed
  }, []);

  const handleOnBlur = useCallback(() => {
    // Empty for now - can be implemented if needed
  }, []);

  const renderShareTarget = React.useCallback(
    ({ item, index }: { item: ApiUser; index: number }) => {
      return (
        <ChunkedShareCastTargets
          row={index}
          targets={[{ type: 'user', content: { user: item } }]}
          selectedTargets={selectedTargets}
          onTargetPress={onTargetPress}
        />
      );
    },
    [selectedTargets, onTargetPress],
  );

  const renderSearchResultUser = React.useCallback(
    ({ item: user }: { item: ApiUser }) => {
      const interested = selectedTargets.indexOf(user.fid) !== -1;
      const canDC =
        typeof user.viewerContext?.canSendDirectCasts === 'undefined' ||
        user.viewerContext?.canSendDirectCasts === true;

      return (
        <View
          style={[!canDC && t.opacity50]}
          pointerEvents={!canDC ? 'none' : 'auto'}
        >
          <DirectCastsSlimUser
            user={user}
            onUserPressCallback={() => {
              onSearchedUserPress({ user });
            }}
            lastInList={false}
            userAction={
              <View
                style={[
                  t.roundedFull,
                  interested
                    ? [t.bgWhite, { padding: 1.5 }]
                    : [
                        t.bgTransparent,
                        t.border,
                        t.borderDefault,
                        { padding: 0.5 },
                      ],
                ]}
              >
                <Octicons
                  pointerEvents="none"
                  name={'check-circle-fill'}
                  size={18}
                  style={[
                    { color: t.colors.feed.actionPurple },
                    !interested && t.opacity0,
                  ]}
                />
              </View>
            }
          />
        </View>
      );
    },
    [selectedTargets, t, onSearchedUserPress],
  );

  const hasSelectedTargets = useMemo(
    () => selectedTargets.length > 0,
    [selectedTargets],
  );

  const Header = useMemo(() => {
    return (
      <View style={[t.flexRow, t.itemsCenter, t.justifyStart, t.pX4, t.pB3]}>
        <SearchInput
          ref={searchInputRef}
          onChangeText={(text) => setSearchFilter(text || undefined)}
          placeholder="Search"
          width="100%"
          autoCorrect={false}
          autoCapitalize="none"
          value={searchFilter}
          onBlur={handleOnBlur}
          onFocus={handleOnFocus}
          inBottomSheet={true}
        />
      </View>
    );
  }, [t, searchFilter, handleOnBlur, handleOnFocus]);

  // Create a stable ref for onSendPress to avoid recreating it
  const onSendPressRef = useRef(onSendPress);
  useEffect(() => {
    onSendPressRef.current = onSendPress;
  }, [onSendPress]);

  // Create a stable wrapper that always uses the latest onSendPress
  const stableOnSendPress = useCallback((message: string) => {
    onSendPressRef.current(message);
  }, []);

  const Footer = useCallback(
    ({ animatedFooterPosition }: BottomSheetFooterProps) => {
      if (isInSearchMode) {
        return null;
      }
      return (
        <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
          <Animated.View
            style={[
              t.bgDefault,
              {
                paddingBottom: insetBottom,
              },
              Platform.OS === 'android' ? animatedFooterStyle : {},
            ]}
          >
            {!hasSelectedTargets ? (
              <Animated.View
                style={[
                  t.wFull,
                  t.flex1,
                  t.flexRow,
                  t.itemsCenter,
                  t.justifyBetween,
                  t.pX6,
                  t.pT3,
                  t.borderDefault,
                  t.borderTHairline,
                  { paddingBottom: 10 },
                ]}
              >
                <ShareActionsBar
                  castURL={castURL}
                  copiedCastURL={copiedCastURL}
                  onCopyCastURL={onCopyCastURL}
                  onShowImageShare={() => setShowImageShare(true)}
                  onShareComplete={onDismiss}
                  castAuthorUsername={cast.author.username || ''}
                  feed="video"
                />
              </Animated.View>
            ) : (
              <MessageComposer onSendPress={stableOnSendPress} />
            )}
          </Animated.View>
        </BottomSheetFooter>
      );
    },
    [
      isInSearchMode,
      t,
      insetBottom,
      hasSelectedTargets,
      castURL,
      copiedCastURL,
      onCopyCastURL,
      onDismiss,
      cast.author.username,
      stableOnSendPress,
      animatedFooterStyle,
    ],
  );

  const onSnapPointChange = useCallback((_: number, position: number) => {
    setSheetIsExtended(position === 0);
  }, []);

  const handleOnEndReached = useCallback(() => {
    fetchSearchResultsNextPage();
  }, [fetchSearchResultsNextPage]);

  useEffect(() => {
    const skipAnimation = isInitialMount.current;
    let nextHeight = !sheetIsExtended
      ? initialHeight
      : screenHeight - keyboardHeight - FOOTER_HEIGHT * 2;
    nextHeight = Math.max(nextHeight, 100);
    if (skipAnimation) {
      gridHeight.value = nextHeight;
    } else {
      gridHeight.value = withTiming(nextHeight, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
    }
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [
    sheetIsExtended,
    keyboardHeight,
    initialHeight,
    screenHeight,
    gridHeight,
  ]);

  const animatedGridStyle = useAnimatedStyle(() => {
    return {
      height: gridHeight.value,
    };
  });

  const TargetsGridSkeleton = useCallback(() => {
    return (
      <View style={[t.flex, t.flexCol, t.wFull, { gap: 16, height: 240 }]}>
        <View style={[t.flex, t.flexRow, t.wFull, t.justifyBetween, t.pX4]}>
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
        </View>
        <View style={[t.flex, t.flexRow, t.wFull, t.justifyBetween, t.pX4]}>
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
          <SkeletonPlaceholder style={[t.h17, t.w17, t.mB10, t.roundedFull]} />
        </View>
      </View>
    );
  }, [t]);

  return (
    <>
      <AutoDisplayingBottomSheetModal
        name="VideoShare"
        onDismiss={onDismiss}
        onChange={onSnapPointChange}
        footerComponent={Footer}
        snapPoints={['100%']}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <View style={[t.relative, t.wFull, { minHeight: initialHeight }]}>
          {Header}
          {isInSearchMode ? (
            <List
              key="search-results"
              data={searchResults}
              renderItem={renderSearchResultUser}
              keyExtractor={userKeyExtractor}
              onEndReached={handleOnEndReached}
              onEndReachedThreshold={0.1}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={[t.flexGrow]}
            />
          ) : (
            <Animated.View style={animatedGridStyle}>
              {isLoadingShareCastTargets ? (
                <TargetsGridSkeleton />
              ) : (
                <List
                  key="targets-grid"
                  data={combinedUserTargets}
                  renderItem={renderShareTarget}
                  initialNumToRender={NUM_SUGGESTED_TARGETS}
                  maxToRenderPerBatch={NUM_SUGGESTED_TARGETS}
                  numColumns={4}
                  horizontal={false}
                  columnWrapperStyle={t.justifyBetween}
                  keyboardShouldPersistTaps="always"
                  scrollEnabled={sheetIsExtended}
                />
              )}
            </Animated.View>
          )}
        </View>
      </AutoDisplayingBottomSheetModal>
      {cast && (
        <CastImageViewer
          cast={cast}
          visible={showImageShare}
          onClose={() => {
            setShowImageShare(false);
            onDismiss();
          }}
        />
      )}
    </>
  );
};

const MessageComposer = React.memo(
  ({ onSendPress }: { onSendPress: (message: string) => void }) => {
    const t = useTheme();
    const [directCastMessage, setDirectCastMessage] = useState<
      string | undefined
    >(undefined);

    const handleOnChangeText = useCallback((text: string) => {
      setDirectCastMessage(text || undefined);
    }, []);

    const handleOnSendPress = useCallback(() => {
      onSendPress(directCastMessage || '');
    }, [onSendPress, directCastMessage]);

    return (
      <Animated.View
        style={[
          t.wFull,
          t.flex1,
          t.flexShrink0,
          t.pX4,
          t.borderDefault,
          t.borderTHairline,
        ]}
        entering={FadeIn.duration(150)}
      >
        <BottomSheetTextInput
          autoFocus={true}
          clearButtonMode="never"
          onChangeText={handleOnChangeText}
          placeholder="Add a message..."
          placeholderTextColor={t.colors.text.tertiary}
          autoCorrect={true}
          value={directCastMessage}
          selectionColor={t.colors.selection}
          style={[
            {
              height: 42,
            },
            t.texts.primary,
            t.textBase,
            t.roundedLg,
            t.pY2,
            t.textLeft,
            t.mY2,
            t.pX4,
            t.rounded,
            t.borderHairline,
            t.borderDefault,
          ]}
        />
        <Pressable
          style={[
            t.bgActionFrameTx,
            t.roundedLg,
            t.flex,
            t.flexRow,
            t.justifyCenter,
            t.itemsCenter,
            t.roundedLg,
            t.borderHairline,
            t.borderDefault,
            t.fontSemibold,
            t.flex1,
            t.wFull,
            t.h12,
            { minHeight: 48 },
          ]}
          onPress={handleOnSendPress}
        >
          <Text2 color="light" size="base" weight="semibold">
            Send
          </Text2>
        </Pressable>
      </Animated.View>
    );
  },
);

MessageComposer.displayName = 'MessageComposer';

export { VideoShareSheet };
