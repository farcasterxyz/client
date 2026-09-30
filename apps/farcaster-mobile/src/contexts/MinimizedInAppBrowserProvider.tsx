// eslint-disable-next-line no-restricted-imports
import BottomSheetLib from '@gorhom/bottom-sheet';
import { useEmbeddedWallet, WalletLinkAttribution } from 'farcaster-expo';
import * as React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '~/components/BottomSheet';
import { InAppBrowserBarProps } from '~/components/InAppBrowser/InAppBrowserBar';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { normalizeOriginFromUrl } from '~/screens/InAppBrowser/BrowserOriginController';
import { useHeightForExpandingBottomSheet } from '~/utils/MiniAppUtils';

export type InAppBrowserLaunchProps = {
  url: string;
  source?:
    | 'linking-fallback'
    | 'manual'
    | 'debug-menu'
    | 'mini-app-globe'
    | 'wallet-card';
  /**
   * Set when launched from a wallet-links carousel card so transactions made
   * inside the session can be attributed back to the link (NEYN-12452).
   */
  walletLink?: WalletLinkAttribution;
};

export type InAppBrowserSurfaceProps = {
  url: string;
  source?: InAppBrowserLaunchProps['source'];
  walletLink?: WalletLinkAttribution;
  onRequestMinimize: () => void;
  onRequestClose: () => void;
  onBarUpdate: (updates: Partial<InAppBrowserBarProps>) => void;
};

type MinimizedInAppBrowserContextValue = {
  setOpenInAppBrowser: (props: InAppBrowserLaunchProps | undefined) => void;
  minimizedInAppBrowser: InAppBrowserBarProps | undefined;
  maximizeInAppBrowser: () => void;
  minimizeInAppBrowser: () => void;
  closeInAppBrowser: () => void;
  currentlyMinimized: boolean;
  isInAppBrowserActive: boolean;
};

const MinimizedInAppBrowserContext = React.createContext<
  MinimizedInAppBrowserContextValue | undefined
>(undefined);

type ActiveSession = {
  url: string;
  source?: InAppBrowserLaunchProps['source'];
  walletLink?: WalletLinkAttribution;
};

type MinimizedInAppBrowserProviderProps = {
  children: React.ReactNode;
  InAppBrowserComponent: React.ComponentType<InAppBrowserSurfaceProps>;
};

const MinimizedInAppBrowserProvider: React.FC<MinimizedInAppBrowserProviderProps> =
  React.memo(({ children, InAppBrowserComponent }) => {
    const [currentSession, setCurrentSession] = React.useState<
      ActiveSession | undefined
    >();
    const [bottomSheetIndex, setBottomSheetIndex] = React.useState(0);
    const [minimizedInAppBrowser, setMinimizedInAppBrowser] = React.useState<
      InAppBrowserBarProps | undefined
    >();

    const { clearPreviewRequests } = useEmbeddedWallet();
    const { triggerImpactAsync } = useHaptics();

    const bottomSheetRef = React.useRef<BottomSheetLib>(null);
    const bottomSheetIndexRef = React.useRef(0);
    const pendingMinimizeEvent = React.useRef(false);
    const pendingCloseEventRef = React.useRef(false);

    // Same Android app-resume workaround we use for mini apps: @gorhom/bottom-sheet
    // can end up with an invisible touch-intercepting backdrop after
    // sleep/wake. close() transitions the sheet cleanly.
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

    const maximizeInAppBrowser = React.useCallback(() => {
      bottomSheetRef.current?.snapToIndex(0);
      triggerImpactAsync();
    }, [triggerImpactAsync]);

    const minimizeInAppBrowser = React.useCallback(() => {
      // Cancel any preview sheets stacked over the browser so the dock bar
      // isn't racing against a transient confirm sheet.
      clearPreviewRequests();
      bottomSheetRef.current?.close();
      triggerImpactAsync();
      pendingMinimizeEvent.current = true;
    }, [triggerImpactAsync, clearPreviewRequests]);

    const closeInAppBrowser = React.useCallback(() => {
      clearPreviewRequests();
      setMinimizedInAppBrowser(undefined);
      pendingMinimizeEvent.current = false;
      if (bottomSheetIndex === -1) {
        pendingCloseEventRef.current = false;
        setCurrentSession(undefined);
        bottomSheetIndexRef.current = 0;
        setBottomSheetIndex(0);
      } else {
        // Keep the BottomSheet mounted until it reports a fully closed index.
        // This preserves the pendingCloseEventRef state machine so
        // onBottomSheetIndexChange performs the final session cleanup after
        // the close animation completes, avoiding the stale-ref issue.
        pendingCloseEventRef.current = true;
        bottomSheetRef.current?.close();
      }
    }, [bottomSheetIndex, clearPreviewRequests]);

    const setOpenInAppBrowser = React.useCallback(
      (next: InAppBrowserLaunchProps | undefined) => {
        if (!next) {
          closeInAppBrowser();
          return;
        }

        const origin = normalizeOriginFromUrl(next.url) ?? next.url;
        const session: ActiveSession = {
          url: next.url,
          source: next.source,
          walletLink: next.walletLink,
        };

        setCurrentSession((prev) => {
          // Same URL reopened: keep the WebView mount (keyed by URL) but
          // refresh source/walletLink so attribution tracks the latest launch.
          if (prev && prev.url === session.url) {
            if (
              prev.source === session.source &&
              prev.walletLink?.id === session.walletLink?.id
            ) {
              return prev;
            }
            return {
              ...prev,
              source: session.source,
              walletLink: session.walletLink,
            };
          }
          return session;
        });
        setMinimizedInAppBrowser((prev) =>
          prev && prev.url === next.url ? prev : { origin, url: next.url },
        );
        pendingCloseEventRef.current = false;
        bottomSheetRef.current?.expand();
        bottomSheetIndexRef.current = 0;
        setBottomSheetIndex(0);
      },
      [closeInAppBrowser],
    );

    const onBarUpdate = React.useCallback(
      (updates: Partial<InAppBrowserBarProps>) => {
        setMinimizedInAppBrowser((prev) =>
          prev ? { ...prev, ...updates } : prev,
        );
      },
      [],
    );

    const currentlyMinimized = bottomSheetIndex < 0;
    const isInAppBrowserActive = !!currentSession && bottomSheetIndex >= 0;

    const context = React.useMemo(
      () => ({
        setOpenInAppBrowser,
        minimizedInAppBrowser,
        maximizeInAppBrowser,
        minimizeInAppBrowser,
        closeInAppBrowser,
        currentlyMinimized,
        isInAppBrowserActive,
      }),
      [
        setOpenInAppBrowser,
        minimizedInAppBrowser,
        maximizeInAppBrowser,
        minimizeInAppBrowser,
        closeInAppBrowser,
        currentlyMinimized,
        isInAppBrowserActive,
      ],
    );

    const onBottomSheetIndexChange = React.useCallback(
      (index: number) => {
        bottomSheetIndexRef.current = index;
        setBottomSheetIndex(index);
        if (pendingCloseEventRef.current && index <= 0) {
          setCurrentSession(undefined);
          bottomSheetIndexRef.current = 0;
          setBottomSheetIndex(0);
          pendingCloseEventRef.current = false;
        } else if (index < 0 && pendingMinimizeEvent.current) {
          pendingMinimizeEvent.current = false;
        } else if (index < 0) {
          triggerImpactAsync();
        }
      },
      [triggerImpactAsync],
    );

    return (
      <MinimizedInAppBrowserContext.Provider value={context}>
        {children}
        {currentSession ? (
          <InAppBrowserSurface
            currentSession={currentSession}
            bottomSheetIndex={bottomSheetIndex}
            onBottomSheetIndexChange={onBottomSheetIndexChange}
            bottomSheetRef={bottomSheetRef}
            InAppBrowserComponent={InAppBrowserComponent}
            minimizeInAppBrowser={minimizeInAppBrowser}
            closeInAppBrowser={closeInAppBrowser}
            onBarUpdate={onBarUpdate}
          />
        ) : null}
      </MinimizedInAppBrowserContext.Provider>
    );
  });

type InAppBrowserSurfaceLeafProps = {
  currentSession: ActiveSession;
  bottomSheetIndex: number;
  onBottomSheetIndexChange: (index: number) => void;
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  InAppBrowserComponent: React.ComponentType<InAppBrowserSurfaceProps>;
  minimizeInAppBrowser: () => void;
  closeInAppBrowser: () => void;
  onBarUpdate: (updates: Partial<InAppBrowserBarProps>) => void;
};

const InAppBrowserSurface: React.FC<InAppBrowserSurfaceLeafProps> = ({
  currentSession,
  bottomSheetIndex,
  onBottomSheetIndexChange,
  bottomSheetRef,
  InAppBrowserComponent,
  minimizeInAppBrowser,
  closeInAppBrowser,
  onBarUpdate,
}) => {
  const t = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const height = useHeightForExpandingBottomSheet();
  const snapPoints = React.useMemo(() => [height], [height]);

  return (
    <BottomSheet
      name="inAppBrowser"
      snapPoints={snapPoints}
      handleComponent={null}
      enablePanDownToClose={true}
      enableContentPanningGesture={true}
      index={bottomSheetIndex}
      onChange={onBottomSheetIndexChange}
      backgroundStyle={{
        shadowColor: t.colors.text.primary,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 4,
        elevation: 6,
        backgroundColor: t.colors.bgDefault,
      }}
      topInset={top}
      enableDynamicSizing={false}
      // Keyed by URL so requesting a brand-new destination fully
      // remounts the in-app browser (clears permissions refs,
      // provider controller, etc.). Same URL => same mount.
      key={currentSession.url}
      ref={bottomSheetRef}
      bottomInset={Platform.OS === 'android' ? bottom : 0}
    >
      <React.Suspense fallback={null}>
        <InAppBrowserComponent
          url={currentSession.url}
          source={currentSession.source}
          walletLink={currentSession.walletLink}
          onRequestMinimize={minimizeInAppBrowser}
          onRequestClose={closeInAppBrowser}
          onBarUpdate={onBarUpdate}
        />
      </React.Suspense>
    </BottomSheet>
  );
};

MinimizedInAppBrowserProvider.displayName = 'MinimizedInAppBrowserProvider';

function useMinimizedInAppBrowser(options?: { optional?: boolean }) {
  const ctx = React.useContext(MinimizedInAppBrowserContext);
  if (!ctx) {
    if (options?.optional) {
      return {
        setOpenInAppBrowser: () => {},
        minimizedInAppBrowser: undefined,
        maximizeInAppBrowser: () => {},
        minimizeInAppBrowser: () => {},
        closeInAppBrowser: () => {},
        currentlyMinimized: false,
        isInAppBrowserActive: false,
      } satisfies MinimizedInAppBrowserContextValue;
    }
    throw new Error(
      'MinimizedInAppBrowser context unavailable from useMinimizedInAppBrowser!',
    );
  }
  return ctx;
}

export {
  MinimizedInAppBrowserContext,
  MinimizedInAppBrowserProvider,
  useMinimizedInAppBrowser,
};
