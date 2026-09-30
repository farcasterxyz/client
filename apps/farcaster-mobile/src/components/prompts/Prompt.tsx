import { DdRum, RumActionType } from '@datadog/mobile-react-native';
// eslint-disable-next-line no-restricted-imports
import BottomSheetLib, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetProps as BottomSheetPropsLib,
} from '@gorhom/bottom-sheet';
import React, {
  FC,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '~/components/BottomSheet';
import { useScreenBasedPrompt } from '~/contexts/ScreenBasedPromptProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { PromptInfo } from '~/types';
import { getPromptInfo, setPromptInfo } from '~/utils/PromptUtils';

type PromptProps = {
  children: ReactNode;
  height: number | string;
  storageKey: string;
  shouldPresent: (info: PromptInfo) => boolean;
  snapPoints?: BottomSheetPropsLib['snapPoints'];
  enableTouchThrough?: boolean;
  enablePanDownToClose?: boolean;
  onBackdropPress?: () => void;
  onCloseCallback?: () => void;
  onAfterPromptCleanup?: () => void;
  withExtraShadow?: boolean;
  animationConfigs?: WithSpringConfig | WithTimingConfig | undefined;
  enableDynamicSizing?: boolean;
  disableOverDrag?: boolean;
  dismissWhenShouldNotPresent?: boolean;
  keyboardBlurBehavior?: BottomSheetPropsLib['keyboardBlurBehavior'];
  /**
   * When true, the bottom sheet stays mounted (at index -1) even while closed
   * and is driven open/closed imperatively via `snapToIndex(0)`/`close()`.
   * This makes the very first present reliable in flows where a fresh mount
   * would otherwise fail to animate open (e.g. presenting right after a
   * keyboard dismissal).  Opt-in because it changes the sheet lifecycle:
   * prompts that close via `forceClose()` must NOT use it (forceClose corrupts
   * a persistent sheet's internal state).  Default keeps the original
   * unmount-on-close behavior.
   */
  keepMounted?: boolean;
  /**
   * A monotonically increasing value that the host bumps every time it
   * (re)requests this prompt to present — even if `shouldPresent` already
   * returns true.  When it changes, the prompt re-presents itself, recovering
   * from any state where it believes it is already open but isn't actually on
   * screen.  Only meaningful together with `keepMounted`.
   */
  forcePresentSignal?: number;
};

const defaultAnimationConfig = {
  duration: 150,
};

const Prompt: FC<PromptProps> = memo(
  ({
    children,
    height,
    shouldPresent,
    snapPoints: snapPointsProp,
    storageKey,
    onBackdropPress: onBackdropPressCallback,
    enableTouchThrough = true,
    enablePanDownToClose = true,
    withExtraShadow = false,
    onCloseCallback,
    onAfterPromptCleanup,
    animationConfigs,
    enableDynamicSizing = false,
    disableOverDrag = false,
    dismissWhenShouldNotPresent = false,
    keyboardBlurBehavior = 'restore',
    keepMounted = false,
    forcePresentSignal,
  }) => {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const [isVisible, setIsVisible] = useState(false);
    const { isPromptActiveRef } = useScreenBasedPrompt();
    const bottomSheetRef = useRef<BottomSheetLib | null>(null);
    // Ref mirror of isVisible so timeouts can read the latest value without
    // stale closures.
    const isVisibleRef = useRef(isVisible);
    isVisibleRef.current = isVisible;

    const [hasPresentedThisSession, setHasPresentedThisSession] =
      useState(false);

    // Track if onClose has been called to prevent double-execution
    const hasClosedRef = useRef(false);
    // Track whether the prompt was actually opened.  In `keepMounted` mode the
    // sheet is mounted (at index -1) before it is ever presented, and gorhom can
    // fire `onClose` on mount / when `close()` is called against an
    // already-closed sheet.  Without this guard those spurious closes would run
    // the cleanup (e.g. `onAfterPromptCleanup` → keyboard refocus / hide) when
    // the host first renders, not when the user dismisses.
    const hasOpenedRef = useRef(false);
    // Incremented on every open so stale safety-net timeouts from previous
    // opens can't fire against a freshly-opened sheet.
    const openEpochRef = useRef(0);

    const onClose = useCallback(() => {
      // Ignore closes that fire before the prompt was ever opened (see
      // hasOpenedRef), and guard against double-calling.
      if (hasClosedRef.current || !hasOpenedRef.current) {
        return;
      }
      hasClosedRef.current = true;
      hasOpenedRef.current = false;

      // FIXME: Order of this callback matters. Since this call is followed by
      // local state and ref updates, it results in re-renders and causes some odd
      // double render behavior. One option here is if its defined, never calling
      // local state updates, but going with utilizing this as a callback instead.
      // Meaning: local updates continue to occur, parent components use it as a signal.
      if (typeof onCloseCallback === 'function') {
        onCloseCallback();
      }

      DdRum.addAction(RumActionType.CUSTOM, 'prompt_close', {
        storageKey,
      });

      setIsVisible(false);
      isPromptActiveRef.current = false;

      if (typeof onAfterPromptCleanup === 'function') {
        onAfterPromptCleanup();
      }
    }, [onCloseCallback, storageKey, isPromptActiveRef, onAfterPromptCleanup]);

    // Always-current ref so safety-net timeouts call the latest onClose without
    // capturing a stale closure (avoids adding onClose to timeout dep arrays).
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const onBackdropPress = useCallback(() => {
      isPromptActiveRef.current = false;

      DdRum.addAction(RumActionType.CUSTOM, 'backdrop-press', {
        feature: storageKey,
      });

      if (typeof onBackdropPressCallback === 'function') {
        onBackdropPressCallback();
      }

      // Programmatically close the sheet as a safety measure.  On Android the
      // backdrop-press animation can sometimes fail to reach the final snap
      // point, which means `onClose` never fires and the backdrop stays mounted
      // — blocking all touch events behind it.
      bottomSheetRef.current?.close();

      // Safety-net: if `onClose` still hasn't fired after the animation
      // duration, force-trigger the cleanup logic to ensure callbacks run
      // and the backdrop is removed from the tree.  The epoch check prevents
      // this timeout from firing against a sheet that has since been reopened.
      const epochAtPress = openEpochRef.current;
      setTimeout(() => {
        if (isVisibleRef.current && openEpochRef.current === epochAtPress) {
          onCloseRef.current();
        }
      }, 500);
    }, [isPromptActiveRef, onBackdropPressCallback, storageKey]);

    useEffect(() => {
      return () => {
        isPromptActiveRef.current = false;
      };
    }, [isPromptActiveRef]);

    useEffect(() => {
      // Guard against stale async callbacks: if this effect re-runs (deps
      // changed) before the promise resolves, the cleanup sets isCurrent=false
      // and the stale .then() bails out immediately.  Without this, a promise
      // captured with isVisible=true could fire dismissWhenShouldNotPresent
      // against a freshly-opened sheet.
      let isCurrent = true;

      getPromptInfo({ storageKey }).then(
        ({ hasOptedOut, lastPresentedAt = 0, presentedCount = 0 }) => {
          if (!isCurrent) {
            return;
          }

          const wantsToShow =
            !hasOptedOut &&
            shouldPresent({
              hasOptedOut,
              hasPresentedThisSession,
              lastPresentedAt: lastPresentedAt,
              presentedCount: presentedCount,
            });

          // Open when we want to show and no other prompt owns the slot.  In
          // `keepMounted` mode we do NOT also gate on `!isVisible`: the shared
          // `isPromptActiveRef` mutex can be reset by another prompt while this
          // prompt's local `isVisible` is still stuck `true`, and the old
          // `!isVisible` gate would then never let it reopen.  In the default
          // (non-persistent) mode we keep the original `!isVisible` gate.
          const canOpen = keepMounted || !isVisible;
          if (!isPromptActiveRef.current && canOpen && wantsToShow) {
            openEpochRef.current += 1;
            const wasStuckVisible = isVisible;
            hasClosedRef.current = false;
            hasOpenedRef.current = true;
            isPromptActiveRef.current = true;
            setHasPresentedThisSession(true);

            if (keepMounted && wasStuckVisible) {
              // Desync recovery: the shared mutex was reset while this prompt
              // still thinks it's visible, so `isVisible` won't change and the
              // sync effect won't re-run.  Snap the (already-mounted) sheet open
              // imperatively.
              bottomSheetRef.current?.snapToIndex(0);
            } else {
              // keepMounted: the sync effect (keyed on `isVisible`) opens it.
              // default: a fresh mount with `animateOnMount` opens it.
              setIsVisible(true);
            }

            DdRum.addAction(RumActionType.CUSTOM, 'prompt_open', {
              storageKey,
            });

            setPromptInfo({
              storageKey,
              info: {
                hasPresentedThisSession: true,
                lastPresentedAt: Date.now(),
                presentedCount: presentedCount + 1,
              },
            });
          } else if (dismissWhenShouldNotPresent && isVisible && !wantsToShow) {
            if (keepMounted) {
              // Run cleanup now; `onClose` drops `isVisible`, which the sync
              // effect picks up to `close()` the still-mounted sheet.
              onCloseRef.current();
            } else {
              // Original behavior: imperatively close the (about-to-unmount)
              // sheet.
              bottomSheetRef.current?.close();
            }
          }
        },
      );

      return () => {
        isCurrent = false;
      };
    }, [
      dismissWhenShouldNotPresent,
      hasPresentedThisSession,
      isPromptActiveRef,
      isVisible,
      keepMounted,
      shouldPresent,
      storageKey,
    ]);

    // Tracks the last `forcePresentSignal` we acted on so we only react to
    // genuine changes (not the initial mount).
    const lastForcePresentSignalRef = useRef(forcePresentSignal);

    // Dedicated force-present path: when the host bumps `forcePresentSignal`
    // (e.g. the user taps Cancel again), present the sheet unconditionally with
    // a fresh mount.  This recovers from any stuck state the main effect can't
    // see — including `isVisible=true`/`isPromptActiveRef=true` while the sheet
    // isn't actually on screen, where re-setting `activePromptKey` to the same
    // value is a no-op and nothing would otherwise re-trigger.
    useEffect(() => {
      if (forcePresentSignal === undefined) {
        return;
      }
      if (forcePresentSignal === lastForcePresentSignalRef.current) {
        return;
      }
      lastForcePresentSignalRef.current = forcePresentSignal;

      let isCurrent = true;
      getPromptInfo({ storageKey }).then(
        ({ hasOptedOut, lastPresentedAt = 0, presentedCount = 0 }) => {
          if (!isCurrent) {
            return;
          }
          const wantsToShow =
            !hasOptedOut &&
            shouldPresent({
              hasOptedOut,
              hasPresentedThisSession,
              lastPresentedAt,
              presentedCount,
            });

          if (!wantsToShow) {
            return;
          }

          // Present (or re-present) the sheet regardless of the current local
          // flags.  If it's already mounted (`isVisible`), snap it open
          // imperatively; otherwise set `isVisible` so the sync effect opens it.
          //
          // Bump `openEpochRef` so any in-flight backdrop safety-net timeout
          // from an earlier dismiss (which captured the previous epoch) can no
          // longer match and fire `onClose` against this freshly re-presented
          // sheet.  We can't rely on the main open effect to do this: this
          // handler sets `isPromptActiveRef.current = true`, so when the main
          // effect re-runs its `!isPromptActiveRef.current` guard is already
          // false and it skips the increment entirely — leaving the epoch
          // unchanged and the stale timeout free to close the reopened sheet.
          openEpochRef.current += 1;
          hasClosedRef.current = false;
          hasOpenedRef.current = true;
          isPromptActiveRef.current = true;
          setHasPresentedThisSession(true);
          if (isVisibleRef.current) {
            bottomSheetRef.current?.snapToIndex(0);
          } else {
            setIsVisible(true);
          }
        },
      );

      return () => {
        isCurrent = false;
      };
      // Intentionally only depends on the signal: we want this to fire exactly
      // once per host request, reading the latest values via refs/closures.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [forcePresentSignal]);

    // In `keepMounted` mode the sheet stays mounted (see render) so its
    // container is always measured.  We sync its detent to `isVisible`
    // imperatively: `snapToIndex(0)` to open, `close()` to close.  This works
    // reliably precisely because the sheet is already mounted/measured —
    // imperative calls on a freshly-mounted sheet silently no-op (the "tap
    // twice" bug).  We avoid the `index` prop because, in this gorhom version,
    // it reliably animates open (to 0) but not closed (to -1), which left an
    // empty half-open panel after dismiss.  In the default mode the sheet is
    // mounted only while visible and presents via `animateOnMount`, so this
    // sync is a no-op.
    // Tracks the previous `isVisible` for the sync effect so we only `close()`
    // on a real open→closed transition — never on the initial mount, where
    // closing an already-closed sheet can spuriously fire `onClose`.
    const syncPrevVisibleRef = useRef(false);
    useEffect(() => {
      if (!keepMounted) {
        return;
      }
      const wasVisible = syncPrevVisibleRef.current;
      syncPrevVisibleRef.current = isVisible;
      if (isVisible) {
        bottomSheetRef.current?.snapToIndex(0);
      } else if (wasVisible) {
        bottomSheetRef.current?.close();
      }
    }, [isVisible, keepMounted]);

    const snapPoints = React.useMemo(() => {
      return snapPointsProp
        ? snapPointsProp
        : enableDynamicSizing
          ? undefined
          : [height];
    }, [snapPointsProp, enableDynamicSizing, height]);

    const backdropOpacity = React.useMemo(() => {
      return withExtraShadow ? 0.85 : 0.3;
    }, [withExtraShadow]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={1}
          disappearsOnIndex={-1}
          opacity={backdropOpacity}
          onPress={onBackdropPress}
        />
      ),
      [backdropOpacity, onBackdropPress],
    );

    // Default mode unmounts the sheet when closed (original behavior).
    if (!keepMounted && !isVisible) {
      return null;
    }

    // keepMounted: the sheet stays mounted at index -1 and is measured/laid-out
    // so the imperative `snapToIndex(0)` on the first present animates reliably.
    // Children are gated on `isVisible` so their mount/side-effects still align
    // with the open state.
    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={keepMounted ? -1 : undefined}
        name={storageKey}
        topInset={insets.top}
        enableOverDrag={disableOverDrag ? false : true}
        keyboardBlurBehavior={keyboardBlurBehavior}
        snapPoints={snapPoints}
        enableDynamicSizing={enableDynamicSizing}
        backdropComponent={enableTouchThrough ? undefined : renderBackdrop}
        backgroundStyle={[t.borderHairline, t.borderDefault, t.bgDefault]}
        handleIndicatorStyle={[t.bgPromptHandle, t.w12]}
        onClose={onClose}
        enablePanDownToClose={enablePanDownToClose}
        enableContentPanningGesture={enablePanDownToClose}
        animateOnMount={!keepMounted}
        animationConfigs={animationConfigs ?? defaultAnimationConfig}
      >
        {keepMounted ? (isVisible ? children : null) : children}
      </BottomSheet>
    );
  },
);

Prompt.displayName = 'Prompt';

export { Prompt };
