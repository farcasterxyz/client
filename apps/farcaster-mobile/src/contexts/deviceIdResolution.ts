export type StoredDevice = { deviceId: string };

// Result of consulting the durable device store. `ok: false` means the read
// itself failed (threw/rejected) — distinct from a successful read that found
// nothing (`ok: true, device: undefined`).
export type DurableReadResult =
  | { ok: true; device: StoredDevice | undefined }
  | { ok: false };

export type DeviceIdDecision =
  | { action: 'use'; deviceId: string }
  | { action: 'mint' }
  | { action: 'retry' };

// Raw outcome of a durable (AsyncStorage) read, BEFORE interpretation. `threw`
// preserves a genuine read failure — we must read AsyncStorage directly rather
// than via StorageUtils.getItem, because getItem swallows read/parse errors and
// returns its fallback, which would mask a failure as "empty" and defeat the
// churn guard below (NEYN-12085).
export type RawDurableRead =
  | { threw: true }
  | { threw: false; raw: string | null };

/**
 * Map a raw durable read into a DurableReadResult, keeping the failure signal:
 * - threw                    → read failed      → ok:false (caller retries, never mints)
 * - raw === null             → genuinely absent → ok:true/empty (new install → mint)
 * - parseable, valid shape   → existing identity → ok:true with the device
 * - unparseable OR parseable
 *   but missing a string
 *   deviceId (corrupt)       → retrying won't help, so treat as empty and let the
 *                              caller mint a fresh id as the only recovery.
 *
 * The shape is validated rather than cast: a successfully-parsed-but-malformed
 * blob (no/empty/non-string deviceId) must NOT be trusted as a device — it falls
 * to the empty/mint path here. Callers can distinguish this "corrupt record" mint
 * from a true new-install mint by checking `raw !== null` (see DeviceProvider).
 */
export function interpretDurableRead(
  outcome: RawDurableRead,
): DurableReadResult {
  if (outcome.threw) return { ok: false };
  if (outcome.raw === null) return { ok: true, device: undefined };
  try {
    const parsed = JSON.parse(outcome.raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as StoredDevice).deviceId === 'string' &&
      (parsed as StoredDevice).deviceId.length > 0
    ) {
      return {
        ok: true,
        device: { deviceId: (parsed as StoredDevice).deviceId },
      };
    }
    return { ok: true, device: undefined };
  } catch {
    return { ok: true, device: undefined };
  }
}

/**
 * Decide what to do after consulting the durable device store, given the MMKV
 * fast path was empty.
 *
 * The critical invariant for NEYN-12085: a FAILED read must resolve to 'retry',
 * never to 'mint'. Minting a fresh deviceId on a transient storage error churns
 * the device identity, and because Expo keys the ExpoPushToken on the deviceId
 * we supply, churn produces a second delivery handle for the same physical
 * device — i.e. duplicate notifications. Only a SUCCESSFUL, genuinely-empty
 * read (a real new install) may mint.
 */
export function decideFromDurableRead(
  durable: DurableReadResult,
): DeviceIdDecision {
  if (!durable.ok) return { action: 'retry' };
  if (durable.device?.deviceId)
    return { action: 'use', deviceId: durable.device.deviceId };
  return { action: 'mint' };
}

export type ResolveDeviceIdDeps = {
  // MMKV fast-path read (synchronous; may throw → treated as unavailable, NOT absent).
  readFastId: () => string | undefined;
  // Durable read, already wrapped into a RawDurableRead (its own errors → { threw: true }).
  readDurable: () => Promise<RawDurableRead>;
  // Mint a new id, persist it to both stores, and return it.
  mintAndPersist: () => string;
  // Backfill the MMKV fast path with an id recovered from the durable store.
  backfillFastId: (deviceId: string) => void;
  sleep: (ms: number) => Promise<void>;
  // Reports a fast-path read error.
  trackError: (error: unknown) => void;
  // Telemetry: retries exhausted, minting as last resort.
  onDurableReadFailed: () => void;
  // Telemetry: minting because a non-null durable record was corrupt/invalid.
  onCorruptRecord: () => void;
  // Cooperative cancellation (effect unmounted).
  isCancelled: () => boolean;
  maxAttempts?: number;
};

/**
 * Orchestrates device-id resolution: MMKV fast path → durable read with bounded
 * retries → use / mint. Extracted from DeviceProvider so the loop bound,
 * cancellation, MMKV backfill, and last-resort mint are unit-testable without
 * React/AsyncStorage/timers — this is the churn-prone logic the NEYN-12085 fix
 * lives in.
 *
 * Returns the resolved deviceId, or `undefined` if cancelled before resolution
 * (the caller must not apply an undefined result). Never mints off a *failed*
 * read: failures retry; only a successful empty/corrupt read, or exhausted
 * retries, mints.
 */
export async function resolveDeviceId(
  deps: ResolveDeviceIdDeps,
): Promise<string | undefined> {
  let fastId: string | undefined;
  try {
    fastId = deps.readFastId();
  } catch (error) {
    deps.trackError(error);
  }
  if (fastId) return fastId;

  const maxAttempts = deps.maxAttempts ?? 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (deps.isCancelled()) return undefined;

    const outcome = await deps.readDurable();
    if (deps.isCancelled()) return undefined;

    const decision = decideFromDurableRead(interpretDurableRead(outcome));
    if (decision.action === 'retry') {
      // No point sleeping after the final attempt — the loop is about to exit to
      // the last-resort mint, so a trailing sleep only delays it (and prolongs the
      // caller's await after an unmount). The next loop iteration re-checks
      // isCancelled at the top, so a cancel during the sleep is caught promptly.
      if (attempt < maxAttempts - 1) await deps.sleep(150 * (attempt + 1));
      continue;
    }
    if (decision.action === 'use') {
      deps.backfillFastId(decision.deviceId);
      return decision.deviceId;
    }
    // decision.action === 'mint'. Flag a mint that's replacing a non-null but
    // unreadable durable record (a churn we want visibility into), vs a true
    // new-install mint (raw === null).
    if (!outcome.threw && outcome.raw !== null) deps.onCorruptRecord();
    return deps.mintAndPersist();
  }

  if (deps.isCancelled()) return undefined;
  deps.onDurableReadFailed();
  return deps.mintAndPersist();
}
