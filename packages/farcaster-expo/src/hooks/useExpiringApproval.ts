import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook that provides dual timeout protection for transaction approvals.
 *
 * Prevents users from approving stale or expired transactions by:
 * 1. Automatically rejecting after a specified timeout period
 * 2. Checking elapsed time before executing approval to prevent race conditions
 *
 * This is critical for wallet security to ensure transactions don't hang indefinitely
 * and users can't accidentally approve outdated transaction requests.
 *
 * @param approveFn - Function to execute when approval is confirmed
 * @param rejectFn - Function to execute when approval is rejected
 * @param timeoutMs - Timeout duration in milliseconds
 * @param onTimeout - Callback executed when timeout occurs
 * @returns Object with hardened approval function that includes timeout checks
 */
export function useExpiringApproval({
  approveFn,
  rejectFn,
  timeoutMs,
  onTimeout,
}: {
  approveFn: () => Promise<void>;
  rejectFn: () => void;
  timeoutMs: number;
  onTimeout: () => void;
}) {
  const rejectAndTimeout = useCallback(() => {
    rejectFn();
    onTimeout();
  }, [rejectFn, onTimeout]);

  // Automatic timeout - rejects approval after specified time
  const renderTime = useRef(Date.now());
  useEffect(() => {
    const timeout = setTimeout(() => {
      rejectAndTimeout();
    }, timeoutMs);
    return () => clearTimeout(timeout);
  }, [timeoutMs, rejectAndTimeout]);

  const hardenedApproveFn = useCallback(async () => {
    // Manual timeout check - prevents approval if time already expired
    const timeSinceRender = Date.now() - renderTime.current;
    if (timeSinceRender > timeoutMs) {
      rejectAndTimeout();
      return;
    }

    await approveFn();
  }, [approveFn, timeoutMs, rejectAndTimeout]);

  return {
    approveFn: hardenedApproveFn,
  };
}
