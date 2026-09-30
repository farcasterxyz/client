// eslint-disable-next-line no-restricted-imports
import BottomSheetLib from '@gorhom/bottom-sheet';
import { sleep, useFetchFrameDetails } from 'farcaster-client-hooks';
import { useEmbeddedWallet } from 'farcaster-expo';
import * as React from 'react';
import { AppState, AppStateStatus, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '~/components/BottomSheet';
import { MiniAppBarProps } from '~/components/MiniApp/MiniAppBar';
import { MiniAppLaunchSplash } from '~/components/MiniApp/MiniAppLaunchSplash';
import { logMiniAppLaunchPhase } from '~/components/MiniApp/miniAppLaunchTelemetry';
import { MiniAppWrapper } from '~/components/MiniApp/MiniAppWrapper';
import { MiniAppProps } from '~/components/MiniApp/types';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { trackError } from '~/utils/ErrorUtils';
import {
  getDomainFromMiniAppLaunchConfig,
  useHeightForExpandingBottomSheet,
} from '~/utils/MiniAppUtils';

// Safety backstop: clear the instant launch splash if the sheet-settle event
// that normally hands it off never arrives (e.g. an aborted/failed open), so a
// stuck launch can't leave a permanent full-screen overlay.
const LAUNCH_SPLASH_TIMEOUT_MS = 10000;

type LaunchSplashInfo = {
  imageUrl?: string;
  backgroundColor?: string;
};

type MinimizedMiniAppContextValue = {
  setOpenMiniApp: (params: MiniAppProps | undefined) => void;
  minimizedMiniApp: MiniAppBarProps | undefined;
  maximizeMiniApp: () => void;
  minimizeMiniApp: () => void;
  closeMiniApp: () => void;
  disableGesturesForCurrentMiniApp: () => void;
  currentlyMinimized: boolean;
  /** True when a MiniApp BottomSheet is expanded (not minimized/closed).
   *  Used by Feed to suppress viewability callbacks and reduce JS thread
   *  contention with the MiniApp WebView. */
  isMiniAppActive: boolean;
  /** True only once the MiniApp BottomSheet has finished animating to its
   *  fully-expanded snap point. Unlike `isMiniAppActive` (true the instant the
   *  open begins), this stays false during the slide-up so the screen behind
   *  the sheet keeps rendering until it is actually occluded. Used to stop
   *  drawing the now-hidden content behind the sheet (RN has no view-level
   *  occlusion culling, so an occluded feed is otherwise still composited). */
  isMiniAppFullyExpanded: boolean;
  miniAppLoadingMessage: string | null;
  setMiniAppLoadingMessage: (message: string | null) => void;
};

const MinimizedMiniAppContext = React.createContext<
  MinimizedMiniAppContextValue | undefined
>(undefined);

type MiniAppInfo = {
  props: MiniAppProps;
  gesturesDisabled?: boolean;
};

type MinimizedMiniAppProviderProps = {
  children: React.ReactNode;
  MiniAppComponent: React.ComponentType<MiniAppProps>;
};

const MinimizedMiniAppProvider: React.FC<MinimizedMiniAppProviderProps> =
  React.memo(({ children, MiniAppComponent }) => {
    const [currentMiniApp, setCurrentMiniApp] = React.useState<
      MiniAppInfo | undefined
    >();

    const [bottomSheetIndex, setBottomSheetIndex] = React.useState(0);

    // True only after the open animation settles at the full snap point. Driven
    // by the BottomSheet's onChange (which fires on settle, not at the start of
    // the slide-up), so content behind the sheet keeps rendering during the
    // animation and is only dropped once it is fully occluded.
    const [isSheetSettledAtFull, setIsSheetSettledAtFull] =
      React.useState(false);

    const { clearPreviewRequests } = useEmbeddedWallet();

    const [minimizedMiniApp, setMinimizedMiniApp] = React.useState<
      MiniAppBarProps | undefined
    >();

    const [miniAppLoadingMessage, setMiniAppLoadingMessage] = React.useState<
      string | null
    >(null);

    // Instant full-screen splash shown above the host UI from the moment a
    // launch begins until the BottomSheet has settled over the screen. See
    // MiniAppLaunchSplash for the rationale.
    const [launchSplash, setLaunchSplash] = React.useState<
      LaunchSplashInfo | undefined
    >();

    const { triggerImpactAsync } = useHaptics();
    const fetchFrameDetails = useFetchFrameDetails();

    const bottomSheetRef = React.useRef<BottomSheetLib>(null);
    const bottomSheetIndexRef = React.useRef(0);
    // Holds the current launch's t0 (`launchConfig.timestamp`) so the
    // bottom-sheet `onChange` callback can log its settle time relative to the
    // tap. Dev-only launch tracing; see logMiniAppLaunchPhase.
    const currentLaunchTimestampRef = React.useRef<number | undefined>(
      undefined,
    );

    const launchSplashTimerRef = React.useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

    const clearLaunchSplash = React.useCallback(() => {
      if (launchSplashTimerRef.current) {
        clearTimeout(launchSplashTimerRef.current);
        launchSplashTimerRef.current = null;
      }
      setLaunchSplash(undefined);
    }, []);

    const showLaunchSplash = React.useCallback((info: LaunchSplashInfo) => {
      if (launchSplashTimerRef.current) {
        clearTimeout(launchSplashTimerRef.current);
      }
      setLaunchSplash(info);
      launchSplashTimerRef.current = setTimeout(() => {
        launchSplashTimerRef.current = null;
        setLaunchSplash(undefined);
      }, LAUNCH_SPLASH_TIMEOUT_MS);
    }, []);

    // Clear any pending launch-splash backstop timer on unmount so it can't
    // fire setState on an unmounted provider.
    React.useEffect(() => {
      return () => {
        if (launchSplashTimerRef.current) {
          clearTimeout(launchSplashTimerRef.current);
          launchSplashTimerRef.current = null;
        }
      };
    }, []);

    // On Android, close the MiniApp BottomSheet when returning from
    // background. The @gorhom/bottom-sheet gesture layer can get into a
    // corrupted state after sleep/wake, leaving an invisible touch-
    // intercepting backdrop that blocks all user interactions.
    //
    // We use close() instead of forceClose() here. forceClose() bypasses
    // the animation lifecycle and corrupts the bottom sheet's internal
    // animated position/index values, which causes subsequent
    // expand()/snapToIndex() calls to silently fail — leaving the mini
    // app permanently stuck in minimized mode. close() properly
    // transitions the sheet state and keeps the gesture layer consistent.
    React.useEffect(() => {
      if (Platform.OS !== 'android') {
        return;
      }
      let previousState: AppStateStatus = AppState.currentState;
      const subscription = AppState.addEventListener(
        'change',
        (nextState: AppStateStatus) => {
          if (
            previousState.match(/inactive|background/) &&
            nextState === 'active'
          ) {
            if (bottomSheetIndexRef.current >= 0) {
              bottomSheetRef.current?.close();
            }
          }
          previousState = nextState;
        },
      );
      return () => subscription.remove();
    }, []);

    const maximizeMiniApp = React.useCallback(() => {
      // Use snapToIndex(0) instead of expand(). expand() relies on the
      // sheet's internal tracking of which snap point is "expanded",
      // which can be stale after close()/forceClose() on Android.
      // snapToIndex(0) explicitly targets our single snap point (full
      // height) and is more reliable for recovering from closed state.
      bottomSheetRef.current?.snapToIndex(0);
      triggerImpactAsync();
    }, [triggerImpactAsync]);

    const pendingMinimizeEvent = React.useRef(false);
    const minimizeMiniApp = React.useCallback(() => {
      clearPreviewRequests();
      bottomSheetRef.current?.close();
      triggerImpactAsync();
      pendingMinimizeEvent.current = true;
    }, [triggerImpactAsync, clearPreviewRequests]);

    const disableGesturesForCurrentMiniApp = React.useCallback(() => {
      setCurrentMiniApp((curMiniApp) => {
        if (!curMiniApp) {
          return curMiniApp;
        }
        return {
          ...curMiniApp,
          gesturesDisabled: true,
        };
      });
    }, []);

    const pendingCloseEventRef = React.useRef(false);
    const closeMiniApp = React.useCallback(() => {
      clearPreviewRequests();
      clearLaunchSplash();
      setMinimizedMiniApp(undefined);
      setMiniAppLoadingMessage(null);
      if (bottomSheetIndex === -1) {
        pendingCloseEventRef.current = false;
        setCurrentMiniApp(undefined);
        bottomSheetIndexRef.current = 0;
        setBottomSheetIndex(0);
      } else {
        pendingCloseEventRef.current = true;
        bottomSheetRef.current?.close();
      }
    }, [bottomSheetIndex, clearPreviewRequests, clearLaunchSplash]);

    const currentlyMinimized = bottomSheetIndex < 0;

    // MiniApp is "active" when the BottomSheet is expanded (index >= 0)
    // and we actually have a MiniApp to display.
    const isMiniAppActive = !!currentMiniApp && bottomSheetIndex >= 0;
    const isMiniAppFullyExpanded = !!currentMiniApp && isSheetSettledAtFull;

    const setOpenMiniApp = React.useCallback(
      async (miniAppProps: MiniAppProps | undefined) => {
        if (!miniAppProps) {
          closeMiniApp();
          return;
        }

        let { launchConfig } = miniAppProps;
        const launchTimestamp = launchConfig.timestamp;
        currentLaunchTimestampRef.current = launchTimestamp;
        let domain = getDomainFromMiniAppLaunchConfig(launchConfig);
        const name =
          launchConfig.type === 'manifest' ? undefined : launchConfig.name;

        logMiniAppLaunchPhase({
          phase: `setOpenMiniApp:start (type=${launchConfig.type})`,
          launchTimestamp,
          domain,
        });

        if (!domain && launchConfig.type === 'manifest' && launchConfig.id) {
          try {
            const frameDetails = await fetchFrameDetails({
              id: launchConfig.id,
            });
            domain = frameDetails?.domain;
            launchConfig = {
              ...launchConfig,
              domain,
            };
          } catch (e) {
            trackError(e);
            closeMiniApp();
            return;
          }
        }

        if (!domain) {
          trackError(
            new Error(
              'MinimizedMiniAppProvider: refused to open mini-app without a resolved domain',
            ),
          );
          closeMiniApp();
          return;
        }

        // (`bottomSheetRef.current` is null until a surface is mounted, so a
        // true fresh/closed open correctly evaluates to "not already expanded".)
        const sheetAlreadyExpanded =
          bottomSheetRef.current !== null && bottomSheetIndexRef.current >= 0;

        // Show a full-screen launch splash immediately, above the host UI, so
        // tapping a mini app pulls up its splash right away instead of leaving
        // the user on the host screen while the BottomSheet slowly slides up
        // (its open animation is starved by the WebView's bridge traffic during
        // load). Only for a fresh open — when swapping while the sheet is
        // already expanded there's no host UI behind to hide. Handed off to the
        // identical in-sheet splash once the sheet settles (onChange, below).
        if (!sheetAlreadyExpanded && launchConfig.type === 'standalone') {
          showLaunchSplash({
            imageUrl: launchConfig.splashImageUrl,
            backgroundColor: launchConfig.splashBackgroundColor,
          });
          logMiniAppLaunchPhase({
            phase: 'launch splash shown (instant)',
            launchTimestamp,
            domain,
          });
          // Yield one turn so the lightweight overlay paints before the heavy
          // MiniApp subtree mounts on the same JS thread.
          await sleep(0);
        }

        logMiniAppLaunchPhase({
          phase: 'setCurrentMiniApp (mount MiniApp subtree)',
          launchTimestamp,
          domain,
        });
        setCurrentMiniApp({ props: { ...miniAppProps, launchConfig } });
        // If we're swapping mini apps while the BottomSheet is already fully
        // expanded, the sheet stays at index 0 and `onChange` won't fire again,
        // so keep behind-content rendering dropped immediately. Otherwise start
        // it enabled and drop it only once the open animation settles
        // (onChange), so the content behind stays visible during the slide-up.
        setIsSheetSettledAtFull(sheetAlreadyExpanded);
        pendingCloseEventRef.current = false;
        bottomSheetRef.current?.expand();
        bottomSheetIndexRef.current = 0;
        setBottomSheetIndex(0);

        // We wait a little bit so the user doesn't see the
        // mini app bar pop up before the BottomSheet expands
        await sleep(150);
        logMiniAppLaunchPhase({
          phase: 'after sleep(150), reveal bar',
          launchTimestamp,
          domain,
        });
        setMinimizedMiniApp({ domain, name });
        if (currentlyMinimized) {
          maximizeMiniApp();
        }
      },
      [
        closeMiniApp,
        fetchFrameDetails,
        maximizeMiniApp,
        currentlyMinimized,
        showLaunchSplash,
      ],
    );
    // Add similar to web, where we can set a loading state for the mini app

    const context = React.useMemo(
      () => ({
        setOpenMiniApp,
        minimizedMiniApp,
        maximizeMiniApp,
        minimizeMiniApp,
        closeMiniApp,
        disableGesturesForCurrentMiniApp,
        currentlyMinimized,
        isMiniAppActive,
        isMiniAppFullyExpanded,
        miniAppLoadingMessage,
        setMiniAppLoadingMessage,
      }),
      [
        setOpenMiniApp,
        minimizedMiniApp,
        maximizeMiniApp,
        minimizeMiniApp,
        closeMiniApp,
        disableGesturesForCurrentMiniApp,
        currentlyMinimized,
        isMiniAppActive,
        isMiniAppFullyExpanded,
        miniAppLoadingMessage,
        setMiniAppLoadingMessage,
      ],
    );

    const onBottomSheetIndexChange = React.useCallback(
      (index: number) => {
        if (currentLaunchTimestampRef.current !== undefined) {
          logMiniAppLaunchPhase({
            phase: `bottomSheet settled at index=${index}${
              index >= 0 ? ' (full-screen, splash now visible)' : ''
            }`,
            launchTimestamp: currentLaunchTimestampRef.current,
          });
        }
        bottomSheetIndexRef.current = index;
        setBottomSheetIndex(index);
        // onChange fires once the sheet settles at a snap point, so this marks
        // the open animation as complete (index 0 = full, -1 = minimized).
        setIsSheetSettledAtFull(index >= 0);
        // A settle at ANY snap point ends the launch, so always dismiss the
        // instant launch overlay: index >= 0 hands off to the (identical)
        // in-sheet splash; index < 0 means the sheet was minimized/closed
        // mid-launch (e.g. Android hardware back → minimizeMiniApp), which must
        // also clear it so the full-screen overlay can't block the UI until the
        // backstop fires. (The first settle of a launch is always index 0, so
        // this never clears the overlay before the sheet has covered.)
        clearLaunchSplash();
        if (pendingCloseEventRef.current && index <= 0) {
          setCurrentMiniApp(undefined);
          bottomSheetIndexRef.current = 0;
          setBottomSheetIndex(0);
          pendingCloseEventRef.current = false;
        } else if (index < 0 && pendingMinimizeEvent.current) {
          pendingMinimizeEvent.current = false;
        } else if (index < 0) {
          triggerImpactAsync();
        }
      },
      [triggerImpactAsync, clearLaunchSplash],
    );

    return (
      <MinimizedMiniAppContext.Provider value={context}>
        {children}
        {currentMiniApp ? (
          <MiniAppSurface
            currentMiniApp={currentMiniApp}
            bottomSheetIndex={bottomSheetIndex}
            onBottomSheetIndexChange={onBottomSheetIndexChange}
            bottomSheetRef={bottomSheetRef}
            MiniAppComponent={MiniAppComponent}
          />
        ) : null}
        {/* Rendered last + high zIndex so it covers the host UI and the sheet
            while it animates up. Dismissed once the sheet settles (onChange). */}
        {launchSplash ? (
          <MiniAppLaunchSplash
            imageUrl={launchSplash.imageUrl}
            backgroundColor={launchSplash.backgroundColor}
          />
        ) : null}
      </MinimizedMiniAppContext.Provider>
    );
  });

type MiniAppSurfaceProps = {
  currentMiniApp: MiniAppInfo;
  bottomSheetIndex: number;
  onBottomSheetIndexChange: (index: number) => void;
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  MiniAppComponent: React.ComponentType<MiniAppProps>;
};

const MiniAppSurface: React.FC<MiniAppSurfaceProps> = ({
  currentMiniApp,
  bottomSheetIndex,
  onBottomSheetIndexChange,
  bottomSheetRef,
  MiniAppComponent,
}) => {
  const t = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const height = useHeightForExpandingBottomSheet();
  const snapPoints = React.useMemo(() => [height], [height]);

  const domain = getDomainFromMiniAppLaunchConfig(
    currentMiniApp.props.launchConfig,
  );
  if (!domain) {
    return null;
  }

  return (
    <MiniAppWrapper>
      <BottomSheet
        name="miniApp"
        snapPoints={snapPoints}
        handleComponent={null}
        enablePanDownToClose={true}
        index={bottomSheetIndex}
        onChange={onBottomSheetIndexChange}
        enableContentPanningGesture={!currentMiniApp.gesturesDisabled}
        backgroundStyle={{
          shadowColor: t.colors.text.primary,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 0 }, // Centered shadow (no offset)
          shadowRadius: 4,
          elevation: 6, // For Android
          backgroundColor: t.colors.bgDefault,
        }}
        topInset={top}
        enableDynamicSizing={false}
        key={domain}
        ref={bottomSheetRef}
        bottomInset={Platform.OS === 'android' ? bottom : 0}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <MiniAppComponent
            id={currentMiniApp.props.id}
            launchConfig={currentMiniApp.props.launchConfig}
            context={currentMiniApp.props.context}
            debug={currentMiniApp.props.debug}
          />
        </View>
      </BottomSheet>
    </MiniAppWrapper>
  );
};

function useMinimizedMiniApp(options?: { optional?: boolean }) {
  const minimizedMiniApp = React.useContext(MinimizedMiniAppContext);

  if (!minimizedMiniApp) {
    if (options?.optional) {
      // Return noop fallback when context is not available and optional is true
      return {
        setOpenMiniApp: () => {
          // Mini apps are not supported in this context - noop
        },
        minimizedMiniApp: undefined,
        maximizeMiniApp: () => {},
        minimizeMiniApp: () => {},
        closeMiniApp: () => {},
        disableGesturesForCurrentMiniApp: () => {},
        currentlyMinimized: false,
        isMiniAppActive: false,
        isMiniAppFullyExpanded: false,
        miniAppLoadingMessage: null,
        setMiniAppLoadingMessage: () => {},
      };
    }

    throw new Error(
      'MinimizedMiniApp context unavailable from useMinimizedMiniApp!',
    );
  }

  return minimizedMiniApp;
}

export {
  MinimizedMiniAppContext,
  MinimizedMiniAppProvider,
  useMinimizedMiniApp,
};
