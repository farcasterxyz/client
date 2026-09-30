const FIREBASE_INSTALLATION_RESET_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type FirebaseInstallationRecoveryOutcome =
  | 'not-applicable'
  | 'cooldown'
  | 'native-module-unavailable'
  | 'success'
  | 'failure';

const collectErrorMessages = (
  value: unknown,
  seen = new Set<unknown>(),
): string[] => {
  if (typeof value === 'string') {
    return [value];
  }
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return [];
  }

  seen.add(value);
  const record = value as Record<string, unknown>;
  const messages: string[] = [];

  for (const key of ['message', 'cause', 'error', 'details']) {
    messages.push(...collectErrorMessages(record[key], seen));
  }

  return messages;
};

const isFirebaseInstallationsAuthError = (error: unknown): boolean =>
  collectErrorMessages(error).some((message) =>
    message.includes('FIS_AUTH_ERROR'),
  );

const attemptFirebaseInstallationRecovery = async ({
  error,
  isAndroid,
  now,
  lastAttemptAt,
  resetInstallation,
  markAttempt,
  clearCachedTokens,
}: {
  error: unknown;
  isAndroid: boolean;
  now: number;
  lastAttemptAt: number;
  resetInstallation: (() => Promise<void>) | undefined;
  markAttempt: (attemptedAt: number) => Promise<unknown>;
  clearCachedTokens: () => Promise<unknown>;
}): Promise<FirebaseInstallationRecoveryOutcome> => {
  if (!isAndroid || !isFirebaseInstallationsAuthError(error)) {
    return 'not-applicable';
  }
  const elapsedSinceLastAttempt = now - lastAttemptAt;
  if (
    elapsedSinceLastAttempt >= 0 &&
    elapsedSinceLastAttempt < FIREBASE_INSTALLATION_RESET_COOLDOWN_MS
  ) {
    return 'cooldown';
  }
  if (!resetInstallation) {
    return 'native-module-unavailable';
  }

  try {
    // Do not reset unless the cooldown marker is durable. Otherwise a storage
    // failure could allow an unbounded reset loop on every foreground sync.
    await markAttempt(now);
    await resetInstallation();
    await clearCachedTokens();
    return 'success';
  } catch {
    return 'failure';
  }
};

export {
  attemptFirebaseInstallationRecovery,
  FIREBASE_INSTALLATION_RESET_COOLDOWN_MS,
  isFirebaseInstallationsAuthError,
};
export type { FirebaseInstallationRecoveryOutcome };
