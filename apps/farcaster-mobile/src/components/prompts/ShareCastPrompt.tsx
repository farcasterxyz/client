import { Octicons } from '@expo/vector-icons';
import {
  BottomSheetScrollView,
  BottomSheetScrollViewMethods,
  useBottomSheet,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiFrame,
  ApiShareCastTarget,
  ApiShareCastTargetUser,
  ApiUser,
  getCastURL,
} from 'farcaster-client-data';
import {
  convertCastToCastShareContext,
  useNonSuspendingShareCast,
  useNonSuspenseSearchUsers,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import { SkeletonPlaceholder, Text2, useUnfocusInputs } from 'farcaster-expo';
import React from 'react';
import { Platform, TextInput, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CastImageViewer } from '~/components/casts/CastActions/CastImageViewer';
import { DirectCastsSlimUser } from '~/components/DirectCasts/DirectCastsSlimUser';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { SearchInput } from '~/components/SearchInput';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { shareCastPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastToTakeAction } from '~/contexts/CastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useScreenBasedPrompt } from '~/contexts/ScreenBasedPromptProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useDirectCastShare } from '~/hooks/useDirectCastShare';
import { useHaptics } from '~/hooks/useHaptics';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { trackError } from '~/utils/ErrorUtils';
import {
  sortMiniAppsAlphabetically,
  sortMiniAppsByUsage,
  useMiniAppUsageTracking,
} from '~/utils/MiniAppUtils';

import { ChunkedShareCastTargets } from './ChunkedShareCastTargets';
import { ChunkedShareMiniAppTargets } from './ChunkedShareMiniAppTargets';
import { MiniAppMoreButton } from './MiniAppMoreButton';
import { MiniAppShareExtensionList } from './MiniAppShareExtensionList';
import { Prompt } from './Prompt';
import { ShareCastBottomActions } from './ShareCastBottomActions';

interface TargetUser {
  type: 'user';
  target: ApiShareCastTarget;
}

interface TargetMiniAppPresent {
  type: 'mini-app';
  isStatic: false;
  target: ApiFrame;
}

interface TargetMiniAppMore {
  type: 'mini-app';
  isStatic: true;
}

type TargetMiniApp = TargetMiniAppPresent | TargetMiniAppMore;

type Target = TargetUser | TargetMiniApp;
type KeyboardEventsHandle = {
  shouldHandleKeyboardEvents?: {
    value: boolean;
  };
};

const MAX_MINIAPPS_TO_SHOW = 8;

const ShareCastPrompt: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();

  const { cast, clearCastToTakeAction } = useCastToTakeAction();

  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();

  const shouldPresent = React.useCallback(
    () => activePromptKey === shareCastPromptKey && typeof cast !== 'undefined',
    [activePromptKey, cast],
  );

  React.useEffect(() => {
    if (activePromptKey === shareCastPromptKey && typeof cast !== 'undefined') {
      trackEvent(AnalyticsEvent.ShowShareCastPrompt, undefined);
    }
  }, [activePromptKey, cast, trackEvent]);

  const [showImageShare, setShowImageShare] = React.useState(false);

  const isActive = activePromptKey === shareCastPromptKey;

  // When the prompt is dismissed, clear the cast data so the overlay
  // (CastImageViewer) unmounts and the share state fully resets.
  const handleDismiss = React.useCallback(() => {
    hideGlobalPrompt();
    setShowImageShare(false);
  }, [hideGlobalPrompt]);

  const handleAfterCleanup = React.useCallback(() => {
    clearCastToTakeAction();
  }, [clearCastToTakeAction]);

  return (
    <>
      <Prompt
        shouldPresent={shouldPresent}
        height={'75%'}
        enableDynamicSizing
        storageKey={shareCastPromptKey}
        enableTouchThrough={false}
        onBackdropPress={handleDismiss}
        onCloseCallback={handleDismiss}
        onAfterPromptCleanup={handleAfterCleanup}
        withExtraShadow={false}
        dismissWhenShouldNotPresent
      >
        <React.Suspense>
          <ShareCastPromptContent
            cast={cast!}
            setShowImageShare={setShowImageShare}
            onShareComplete={handleDismiss}
          />
        </React.Suspense>
      </Prompt>
      {isActive && cast && (
        <CastImageViewer
          cast={cast}
          visible={showImageShare}
          onClose={handleDismiss}
        />
      )}
    </>
  );
});

ShareCastPrompt.displayName = 'ShareCastPrompt';

type ShareCastPromptContentProps = {
  cast: ApiCast;
  setShowImageShare: (showImageShare: boolean) => void;
  onShareComplete: () => void;
};

const ShareCastPromptContent: React.FC<ShareCastPromptContentProps> =
  React.memo(({ cast, setShowImageShare, onShareComplete }) => {
    const currentUser = useCurrentUser_UNSAFE();
    const launchFrame = useLaunchFrame();

    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const { trackEvent } = useAnalytics();

    const { hideGlobalPrompt } = useGlobalPrompts();
    const { forceClose } = useBottomSheet();
    const { isPromptActiveRef } = useScreenBasedPrompt();

    const { data, isLoading: isLoadingShareCastTargets } =
      useNonSuspendingShareCast({
        castHash: cast.hash,
      });

    const [selectedTargets, setSelectedTargets] = React.useState<
      (string | number)[]
    >([]);
    const [searchedTargets, setSearchedTargets] = React.useState<
      ApiShareCastTargetUser[]
    >([]);

    React.useEffect(() => {
      return () => {
        setSelectedTargets([]);
        setSearchedTargets([]);
      };
    }, []);

    const onTargetPress = React.useCallback(
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

    const { castShareEnabledMiniApps } = useUserAppContext();

    const targets = React.useMemo(() => {
      return data?.result.targets || [];
    }, [data]);

    const combinedUserTargets: TargetUser[] = React.useMemo(() => {
      const usersTargets = [
        ...searchedTargets,
        // We want to omit from targets if searched targets already contain
        // the result.
        ...targets.filter(
          (o) =>
            o.type === 'group-conversation' ||
            searchedTargets
              .map(({ content: { user } }) => user.fid)
              .indexOf(o.content.user.fid) === -1,
        ),
        // Capping the max amount of targets shown to 8 for now
      ].slice(0, 8);
      return usersTargets.map((target) => ({
        type: 'user',
        target,
      }));
    }, [searchedTargets, targets]);

    const { trackMiniAppUsage } = useMiniAppUsageTracking();

    const combinedMiniAppTargets: TargetMiniApp[] = React.useMemo(() => {
      if (!castShareEnabledMiniApps) {
        return [];
      }

      // Only show the top 8 mini apps sorted by usage
      const sortedMiniApps: TargetMiniApp[] = sortMiniAppsByUsage(
        castShareEnabledMiniApps,
      )
        .slice(0, MAX_MINIAPPS_TO_SHOW)
        .map((miniApp) => ({
          type: 'mini-app',
          isStatic: false,
          target: miniApp,
        }));

      // Add the "More" button if there are more than 8 mini apps
      if (castShareEnabledMiniApps.length > MAX_MINIAPPS_TO_SHOW) {
        sortedMiniApps.push({
          type: 'mini-app',
          isStatic: true,
        });
      }
      return sortedMiniApps;
    }, [castShareEnabledMiniApps]);

    const handleMiniAppPress = React.useCallback(
      (miniApp: ApiFrame, row: number) => {
        if (!miniApp.castShareUrl) {
          return;
        }

        triggerImpactAsync();

        trackEvent(AnalyticsEvent.ShareCast, {
          shareTo: 'miniApp',
          miniAppDomain: miniApp.domain,
          miniAppName: miniApp.name,
          row,
        });

        // Build the cast share URL with the cast hash
        const url = new URL(miniApp.castShareUrl);
        url.searchParams.set('castHash', cast.hash);
        url.searchParams.set('castFid', cast.author.fid.toString());
        url.searchParams.set('viewerFid', currentUser.fid.toString());

        launchFrame({
          context: convertCastToCastShareContext(cast),
          config: {
            url: url.toString(),
            name: miniApp.name,
            splashImageUrl: miniApp.splashImageUrl,
            splashBackgroundColor: miniApp.splashBackgroundColor,
          },
          author: miniApp.author,
        });
        trackMiniAppUsage(miniApp);
        isPromptActiveRef.current = false;
        hideGlobalPrompt();
        forceClose();
      },
      [
        launchFrame,
        trackMiniAppUsage,
        hideGlobalPrompt,
        forceClose,
        cast,
        currentUser.fid,
        trackEvent,
        triggerImpactAsync,
        isPromptActiveRef,
      ],
    );

    const [isRenderMiniApps, setIsRenderMiniApps] = React.useState(false);
    const renderItem = React.useCallback(
      ({ item, index }: { item: Target; index: number }) => {
        if (item.type === 'user') {
          return (
            <ChunkedShareCastTargets
              row={index}
              targets={[item.target]}
              selectedTargets={selectedTargets}
              onTargetPress={onTargetPress}
            />
          );
        }
        if (item.type === 'mini-app') {
          if (item.isStatic === false) {
            return (
              <ChunkedShareMiniAppTargets
                row={index}
                miniApp={item.target}
                onMiniAppPress={handleMiniAppPress}
              />
            );
          }
          if (item.isStatic === true) {
            return (
              <MiniAppMoreButton
                onPress={() => {
                  setIsRenderMiniApps(true);
                }}
              />
            );
          }
        }
        return null;
      },
      [selectedTargets, onTargetPress, handleMiniAppPress],
    );

    const [copiedCastURL, setCopiedCastURL] = React.useState<boolean>(false);

    const castURL = React.useMemo(() => {
      return getCastURL({
        castUsername: cast.author.username,
        castHash: cast.hash,
      });
    }, [cast.author.username, cast.hash]);

    const { sendToTargets } = useDirectCastShare({
      cast,
      castURL,
      targets,
      onComplete: () => {
        isPromptActiveRef.current = false;
        hideGlobalPrompt();
        forceClose();
      },
    });

    const { bottom } = useSafeAreaInsets();

    const [searchFilter, setSearchFilter] = React.useState<string | undefined>(
      undefined,
    );

    const [directCastMessage, setDirectCastMessage] = React.useState<
      string | undefined
    >(undefined);

    const {
      data: searchData,
      fetchNextPage: fetchSearchResultsNextPage,
      isFetching: isSearchResultsLoading,
    } = useNonSuspenseSearchUsers({
      q: searchFilter || '', // Empty search filter should not query
      excludeSelf: true,
      includeDirectCastAbility: true,
    });

    const searchResults = React.useMemo(
      () => searchData?.pages.flatMap((page) => page.result.users) || [],
      [searchData],
    );

    const searchInputRef = React.useRef<TextInput>(null);

    const { shouldHandleKeyboardEvents } =
      useBottomSheetInternal() as KeyboardEventsHandle;

    const setKeyboardHandling = React.useCallback(
      (value: boolean) => {
        try {
          if (!shouldHandleKeyboardEvents) {
            return;
          }
          shouldHandleKeyboardEvents.value = value;
        } catch (error) {
          trackError(error);
        }
      },
      [shouldHandleKeyboardEvents],
    );

    React.useEffect(() => {
      return () => {
        runOnJS(setKeyboardHandling)(false);
      };
    }, [setKeyboardHandling]);

    const ref = React.useRef<BottomSheetScrollViewMethods>(null);

    const handleOnFocus = React.useCallback(() => {
      setTimeout(() => ref.current?.scrollToEnd(), 300);

      if (Platform.OS !== 'android') {
        runOnJS(setKeyboardHandling)(true);
      }
    }, [setKeyboardHandling]);

    const handleOnBlur = React.useCallback(() => {
      runOnJS(setKeyboardHandling)(false);
    }, [setKeyboardHandling]);

    const onSendPress = React.useCallback(() => {
      sendToTargets(selectedTargets, directCastMessage);
    }, [selectedTargets, directCastMessage, sendToTargets]);

    const { unfocusInputs } = useUnfocusInputs();

    const onSearchedUserPress = React.useCallback(
      ({ user }: { user: ApiUser }) => {
        triggerImpactAsync();

        trackEvent(AnalyticsEvent.ClickSearchDirectCastUser, {});

        const userTarget: ApiShareCastTargetUser = {
          type: 'user',
          content: { user },
        };

        setSearchedTargets((prev) => {
          if (
            prev.map(({ content: { user } }) => user.fid).indexOf(user.fid) !==
            -1
          ) {
            return prev.filter((o) => o.content.user.fid !== user.fid);
          }
          return [...prev, userTarget];
        });

        onTargetPress({ target: user.fid });

        setSearchFilter(undefined);

        unfocusInputs();
      },
      [onTargetPress, trackEvent, unfocusInputs, triggerImpactAsync],
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
      [
        onSearchedUserPress,
        selectedTargets,
        t.bgTransparent,
        t.bgWhite,
        t.border,
        t.borderDefault,
        t.colors.feed.actionPurple,
        t.opacity0,
        t.roundedFull,
        t.opacity50,
      ],
    );

    const onCopyCastURL = React.useCallback(() => {
      setCopiedCastURL(true);
      setTimeout(() => {
        setCopiedCastURL(false);
      }, 3000);
    }, []);

    const isInSearchMode = typeof searchFilter !== 'undefined';

    if (isRenderMiniApps) {
      const miniAppsSortedAlphabetically = sortMiniAppsAlphabetically(
        castShareEnabledMiniApps ?? [],
      );
      return (
        <MiniAppShareExtensionList
          apps={miniAppsSortedAlphabetically}
          onPress={handleMiniAppPress}
          onClose={() => setIsRenderMiniApps(false)}
        />
      );
    }

    return (
      <BottomSheetScrollView
        style={[t.flex, t.flexCol, t.hFull]}
        keyboardShouldPersistTaps="always"
        ref={ref}
      >
        <View style={[t.flexGrow]}>
          {/* Only show selector if there are mini apps to select from */}
          <View style={[t.mX4, t.pY3]}>
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
            />
          </View>
          {isInSearchMode && (
            <View style={[t.mT2, t.flex1]}>
              {isSearchResultsLoading && <LoadingIndicator style={[t.mY2]} />}
              <FlatList
                data={searchResults}
                renderItem={renderSearchResultUser}
                keyExtractor={userKeyExtractor}
                onEndReached={() => fetchSearchResultsNextPage}
                onEndReachedThreshold={onEndReachedThreshold}
                initialNumToRender={60}
                keyboardShouldPersistTaps="always"
                style={[t.flex1]}
                contentContainerStyle={[t.flexGrow]}
              />
            </View>
          )}
          <View
            style={[
              t.wFull,
              t.flex,
              t.flex1,
              { gap: 16 },
              t.pY3,
              isInSearchMode ? t.hidden : undefined,
            ]}
          >
            <View
              style={[
                t.hAuto,
                combinedMiniAppTargets.length > 0 && [
                  t.borderBHairline,
                  t.borderDefault,
                ],
              ]}
            >
              <Text2
                size="sm"
                color="secondary"
                weight="semibold"
                style={[t.mB4, t.mX3]}
              >
                Send as DC
              </Text2>
              {isLoadingShareCastTargets ? (
                <View
                  style={[t.flex, t.flexCol, t.wFull, { gap: 16, height: 240 }]}
                >
                  <View
                    style={[
                      t.flex,
                      t.flexRow,
                      t.wFull,
                      t.justifyBetween,
                      t.pX4,
                    ]}
                  >
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                  </View>
                  <View
                    style={[
                      t.flex,
                      t.flexRow,
                      t.wFull,
                      t.justifyBetween,
                      t.pX4,
                    ]}
                  >
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                    <SkeletonPlaceholder
                      style={[t.h17, t.w17, t.mB10, t.roundedFull]}
                    />
                  </View>
                </View>
              ) : (
                <FlatList
                  data={combinedUserTargets}
                  renderItem={renderItem}
                  numColumns={4}
                  ItemSeparatorComponent={() => (
                    <View style={[{ height: 16 }]} />
                  )}
                  horizontal={false}
                  columnWrapperStyle={t.justifyBetween}
                  scrollEnabled={false}
                  keyboardShouldPersistTaps="always"
                  contentContainerStyle={[{ height: 240 }]}
                />
              )}
            </View>
            {combinedMiniAppTargets.length > 0 && (
              <View style={[t.hAuto]}>
                <Text2
                  size="sm"
                  color="secondary"
                  weight="semibold"
                  style={[t.mB4, t.mX3]}
                >
                  Mini apps
                </Text2>
                <FlatList
                  data={combinedMiniAppTargets}
                  contentContainerStyle={[t.mL1]}
                  renderItem={renderItem}
                  horizontal={true}
                  scrollEnabled={true}
                  ItemSeparatorComponent={() => <View style={[{ width: 3 }]} />}
                  keyboardShouldPersistTaps="always"
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            t.flex,
            t.borders.primary,
            t.borderTHairline,
            t.wFull,
            t.itemsCenter,
            { paddingBottom: bottom },
          ]}
        >
          <ShareCastBottomActions
            cast={cast}
            castURL={castURL}
            selectedTargets={selectedTargets}
            directCastMessage={directCastMessage}
            copiedCastURL={copiedCastURL}
            onSendPress={onSendPress}
            onDirectCastMessageChange={setDirectCastMessage}
            onCopyCastURL={onCopyCastURL}
            onShowImageShare={() => setShowImageShare(true)}
            onShareComplete={onShareComplete}
            handleOnBlur={handleOnBlur}
            handleOnFocus={handleOnFocus}
          />
        </View>
      </BottomSheetScrollView>
    );
  });

export { ShareCastPrompt };
