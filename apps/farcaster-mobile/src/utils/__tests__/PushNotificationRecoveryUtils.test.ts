import {
  attemptFirebaseInstallationRecovery,
  FIREBASE_INSTALLATION_RESET_COOLDOWN_MS,
  isFirebaseInstallationsAuthError,
} from '../PushNotificationRecoveryUtils';

describe('PushNotificationRecoveryUtils', () => {
  describe('isFirebaseInstallationsAuthError', () => {
    it('finds FIS_AUTH_ERROR in nested Expo and Java error causes', () => {
      const error = {
        message: 'Fetching the token failed',
        cause: {
          error: new Error(
            'java.util.concurrent.ExecutionException: java.io.IOException: FIS_AUTH_ERROR',
          ),
        },
      };

      expect(isFirebaseInstallationsAuthError(error)).toBe(true);
    });

    it('does not match unrelated network or backend errors', () => {
      expect(
        isFirebaseInstallationsAuthError(
          new Error('Network request failed: Unable to resolve host'),
        ),
      ).toBe(false);
      expect(
        isFirebaseInstallationsAuthError({
          error: { message: 'PUT /v2/devices returned 500' },
        }),
      ).toBe(false);
    });

    it('handles cyclic error causes', () => {
      const error: { message: string; cause?: unknown } = {
        message: 'FIS_AUTH_ERROR',
      };
      error.cause = error;

      expect(isFirebaseInstallationsAuthError(error)).toBe(true);
    });
  });

  describe('attemptFirebaseInstallationRecovery', () => {
    const fisError = new Error('java.io.IOException: FIS_AUTH_ERROR');

    it('resets, clears cached tokens, and records the attempt', async () => {
      const resetInstallation = jest.fn().mockResolvedValue(undefined);
      const markAttempt = jest.fn().mockResolvedValue(undefined);
      const clearCachedTokens = jest.fn().mockResolvedValue(undefined);

      const outcome = await attemptFirebaseInstallationRecovery({
        error: fisError,
        isAndroid: true,
        now: 100_000_000,
        lastAttemptAt: 0,
        resetInstallation,
        markAttempt,
        clearCachedTokens,
      });

      expect(outcome).toBe('success');
      expect(markAttempt).toHaveBeenCalledWith(100_000_000);
      expect(resetInstallation).toHaveBeenCalledTimes(1);
      expect(clearCachedTokens).toHaveBeenCalledTimes(1);
    });

    it('respects the 24-hour cooldown', async () => {
      const resetInstallation = jest.fn().mockResolvedValue(undefined);

      const outcome = await attemptFirebaseInstallationRecovery({
        error: fisError,
        isAndroid: true,
        now: 100_000_000,
        lastAttemptAt:
          100_000_000 - FIREBASE_INSTALLATION_RESET_COOLDOWN_MS + 1,
        resetInstallation,
        markAttempt: jest.fn(),
        clearCachedTokens: jest.fn(),
      });

      expect(outcome).toBe('cooldown');
      expect(resetInstallation).not.toHaveBeenCalled();
    });

    it('ignores a future cooldown timestamp caused by clock changes', async () => {
      const resetInstallation = jest.fn().mockResolvedValue(undefined);
      const markAttempt = jest.fn().mockResolvedValue(undefined);

      const outcome = await attemptFirebaseInstallationRecovery({
        error: fisError,
        isAndroid: true,
        now: 100_000_000,
        lastAttemptAt: 100_000_001,
        resetInstallation,
        markAttempt,
        clearCachedTokens: jest.fn().mockResolvedValue(undefined),
      });

      expect(outcome).toBe('success');
      expect(markAttempt).toHaveBeenCalledWith(100_000_000);
      expect(resetInstallation).toHaveBeenCalledTimes(1);
    });

    it('is safe when the native module is not installed yet', async () => {
      const outcome = await attemptFirebaseInstallationRecovery({
        error: fisError,
        isAndroid: true,
        now: 100_000_000,
        lastAttemptAt: 0,
        resetInstallation: undefined,
        markAttempt: jest.fn(),
        clearCachedTokens: jest.fn(),
      });

      expect(outcome).toBe('native-module-unavailable');
    });

    it('does not reset for non-FIS or non-Android failures', async () => {
      const resetInstallation = jest.fn().mockResolvedValue(undefined);
      const base = {
        now: 100_000_000,
        lastAttemptAt: 0,
        resetInstallation,
        markAttempt: jest.fn(),
        clearCachedTokens: jest.fn(),
      };

      await expect(
        attemptFirebaseInstallationRecovery({
          ...base,
          error: new Error('Offline'),
          isAndroid: true,
        }),
      ).resolves.toBe('not-applicable');
      await expect(
        attemptFirebaseInstallationRecovery({
          ...base,
          error: fisError,
          isAndroid: false,
        }),
      ).resolves.toBe('not-applicable');
      expect(resetInstallation).not.toHaveBeenCalled();
    });

    it('returns failure without clearing tokens when native reset fails', async () => {
      const clearCachedTokens = jest.fn();

      const outcome = await attemptFirebaseInstallationRecovery({
        error: fisError,
        isAndroid: true,
        now: 100_000_000,
        lastAttemptAt: 0,
        resetInstallation: jest.fn().mockRejectedValue(new Error('failed')),
        markAttempt: jest.fn().mockResolvedValue(undefined),
        clearCachedTokens,
      });

      expect(outcome).toBe('failure');
      expect(clearCachedTokens).not.toHaveBeenCalled();
    });

    it('returns failure without resetting when the cooldown marker cannot be persisted', async () => {
      const resetInstallation = jest.fn();
      const clearCachedTokens = jest.fn();

      const outcome = await attemptFirebaseInstallationRecovery({
        error: fisError,
        isAndroid: true,
        now: 100_000_000,
        lastAttemptAt: 0,
        resetInstallation,
        markAttempt: jest.fn().mockRejectedValue(new Error('storage failed')),
        clearCachedTokens,
      });

      expect(outcome).toBe('failure');
      expect(resetInstallation).not.toHaveBeenCalled();
      expect(clearCachedTokens).not.toHaveBeenCalled();
    });
  });
});
