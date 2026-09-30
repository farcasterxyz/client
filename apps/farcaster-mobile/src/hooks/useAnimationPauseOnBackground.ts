import React from 'react';
import { AppState, AppStateStatus } from 'react-native';

type UseAnimationPauseOnBackgroundParams = {
  enabled?: boolean;
  startAnimation: () => void;
  stopAnimation: () => void;
};

function isAppActive(state: AppStateStatus) {
  return state === 'active';
}

/**
 * Pauses a Reanimated `withRepeat(..., -1)` animation when the app is not
 * `active` (background or iOS `inactive`) and resumes it on return.
 *
 * Pass `enabled` to additionally gate on screen focus or any other condition;
 * when `enabled` is false the animation is stopped (or never started).
 *
 * The caller owns the shared values: `startAnimation` should kick off the
 * `withRepeat` chain and `stopAnimation` should call `cancelAnimation(...)` and
 * reset to a sensible base value.
 */
function useAnimationPauseOnBackground({
  enabled = true,
  startAnimation,
  stopAnimation,
}: UseAnimationPauseOnBackgroundParams) {
  const isRunningRef = React.useRef(false);

  React.useEffect(() => {
    // When disabled, do nothing — no animation to manage and no need to keep
    // an AppState subscription alive. The effect re-runs when `enabled` flips
    // back to true, at which point we subscribe and start fresh.
    if (!enabled) {
      return;
    }

    const startIfEligible = () => {
      if (!isAppActive(AppState.currentState)) {
        return;
      }

      if (isRunningRef.current) {
        return;
      }

      startAnimation();
      isRunningRef.current = true;
    };

    const stopIfRunning = () => {
      if (!isRunningRef.current) {
        return;
      }

      stopAnimation();
      isRunningRef.current = false;
    };

    startIfEligible();

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (isAppActive(state)) {
          startIfEligible();
        } else {
          stopIfRunning();
        }
      },
    );

    return () => {
      appStateSubscription.remove();
      stopIfRunning();
    };
  }, [enabled, startAnimation, stopAnimation]);
}

export { useAnimationPauseOnBackground };
