import {
  decideFromDurableRead,
  interpretDurableRead,
  type RawDurableRead,
  resolveDeviceId,
  type ResolveDeviceIdDeps,
} from '../deviceIdResolution';

describe('interpretDurableRead', () => {
  it('maps a thrown read to ok:false so the caller retries instead of minting', () => {
    // The crux of the fix: a failed AsyncStorage read must NOT look like "empty".
    expect(interpretDurableRead({ threw: true })).toEqual({ ok: false });
  });

  it('maps a successful null read to an empty result (genuinely new install)', () => {
    expect(interpretDurableRead({ threw: false, raw: null })).toEqual({
      ok: true,
      device: undefined,
    });
  });

  it('parses a stored device from a successful read', () => {
    expect(
      interpretDurableRead({
        threw: false,
        raw: JSON.stringify({ deviceId: 'existing-id' }),
      }),
    ).toEqual({ ok: true, device: { deviceId: 'existing-id' } });
  });

  it('treats an unparseable (corrupt) value as empty — retrying would not help', () => {
    expect(
      interpretDurableRead({ threw: false, raw: '{not valid json' }),
    ).toEqual({ ok: true, device: undefined });
  });

  it('treats a parseable-but-malformed record (missing/non-string deviceId) as empty rather than trusting the cast', () => {
    expect(interpretDurableRead({ threw: false, raw: '{}' })).toEqual({
      ok: true,
      device: undefined,
    });
    expect(
      interpretDurableRead({
        threw: false,
        raw: JSON.stringify({ deviceId: 123 }),
      }),
    ).toEqual({ ok: true, device: undefined });
    expect(
      interpretDurableRead({
        threw: false,
        raw: JSON.stringify({ deviceId: '' }),
      }),
    ).toEqual({ ok: true, device: undefined });
    expect(
      interpretDurableRead({ threw: false, raw: '"a-bare-string"' }),
    ).toEqual({
      ok: true,
      device: undefined,
    });
  });
});

describe('decideFromDurableRead', () => {
  it('uses the stored deviceId when the durable read succeeds with a value', () => {
    expect(
      decideFromDurableRead({ ok: true, device: { deviceId: 'existing-id' } }),
    ).toEqual({ action: 'use', deviceId: 'existing-id' });
  });

  it('mints only when the durable read succeeds and is genuinely empty (new install)', () => {
    expect(decideFromDurableRead({ ok: true, device: undefined })).toEqual({
      action: 'mint',
    });
  });

  it('retries — never mints — when the durable read failed (NEYN-12085 churn guard)', () => {
    // The whole bug: a transient read failure must not be treated as "no device"
    // and mint a fresh id, which would churn the deviceId and duplicate pushes.
    expect(decideFromDurableRead({ ok: false })).toEqual({ action: 'retry' });
  });

  it('mints for a malformed stored device missing a deviceId rather than using an empty id', () => {
    expect(
      decideFromDurableRead({ ok: true, device: {} as { deviceId: string } }),
    ).toEqual({ action: 'mint' });
  });
});

describe('resolveDeviceId', () => {
  const makeDeps = (
    overrides: Partial<ResolveDeviceIdDeps>,
  ): ResolveDeviceIdDeps => ({
    readFastId: () => undefined,
    readDurable: async () => ({ threw: true }),
    mintAndPersist: jest.fn(() => 'minted-id'),
    backfillFastId: jest.fn(),
    sleep: jest.fn(async () => {}),
    trackError: jest.fn(),
    onDurableReadFailed: jest.fn(),
    onCorruptRecord: jest.fn(),
    isCancelled: () => false,
    ...overrides,
  });

  it('returns the MMKV fast-path id without touching the durable store', async () => {
    const readDurable = jest.fn();
    const backfillFastId = jest.fn();
    const mintAndPersist = jest.fn(() => 'minted-id');
    const id = await resolveDeviceId(
      makeDeps({
        readFastId: () => 'fast-id',
        readDurable,
        backfillFastId,
        mintAndPersist,
      }),
    );
    expect(id).toBe('fast-id');
    expect(readDurable).not.toHaveBeenCalled();
    expect(backfillFastId).not.toHaveBeenCalled();
    expect(mintAndPersist).not.toHaveBeenCalled();
  });

  it('uses and backfills a recovered durable id without minting', async () => {
    const backfillFastId = jest.fn();
    const mintAndPersist = jest.fn(() => 'minted-id');
    const id = await resolveDeviceId(
      makeDeps({
        readDurable: async () => ({
          threw: false,
          raw: JSON.stringify({ deviceId: 'durable-id' }),
        }),
        backfillFastId,
        mintAndPersist,
      }),
    );
    expect(id).toBe('durable-id');
    expect(backfillFastId).toHaveBeenCalledWith('durable-id');
    expect(mintAndPersist).not.toHaveBeenCalled();
  });

  it('mints exactly once and flags durable-read-failed after retries are exhausted (loop bound)', async () => {
    const readDurable = jest.fn(
      async (): Promise<RawDurableRead> => ({ threw: true }),
    );
    const sleep = jest.fn(async () => {});
    const mintAndPersist = jest.fn(() => 'minted-id');
    const onDurableReadFailed = jest.fn();
    const id = await resolveDeviceId(
      makeDeps({ readDurable, sleep, mintAndPersist, onDurableReadFailed }),
    );
    expect(id).toBe('minted-id');
    expect(readDurable).toHaveBeenCalledTimes(3);
    // Sleeps between attempts but NOT after the final one (no point delaying the
    // last-resort mint): 3 attempts → 2 sleeps.
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(mintAndPersist).toHaveBeenCalledTimes(1);
    expect(onDurableReadFailed).toHaveBeenCalledTimes(1);
  });

  it('recovers the durable id after a transient failure, never minting', async () => {
    let n = 0;
    const mintAndPersist = jest.fn(() => 'minted-id');
    const readDurable = jest.fn(async (): Promise<RawDurableRead> => {
      n += 1;
      return n === 1
        ? { threw: true }
        : { threw: false, raw: JSON.stringify({ deviceId: 'recovered-id' }) };
    });
    const id = await resolveDeviceId(makeDeps({ readDurable, mintAndPersist }));
    expect(id).toBe('recovered-id');
    expect(mintAndPersist).not.toHaveBeenCalled();
  });

  it('does not mint or resolve when cancelled mid-read', async () => {
    let reads = 0;
    const mintAndPersist = jest.fn(() => 'minted-id');
    const id = await resolveDeviceId(
      makeDeps({
        readDurable: async () => {
          reads += 1;
          return { threw: true };
        },
        // cancelled becomes true once the first read has happened
        isCancelled: () => reads > 0,
        mintAndPersist,
      }),
    );
    expect(id).toBeUndefined();
    expect(mintAndPersist).not.toHaveBeenCalled();
  });

  it('mints and flags a corrupt record when a non-null durable read has no valid device', async () => {
    const onCorruptRecord = jest.fn();
    const mintAndPersist = jest.fn(() => 'minted-id');
    const id = await resolveDeviceId(
      makeDeps({
        readDurable: async () => ({ threw: false, raw: '{}' }),
        onCorruptRecord,
        mintAndPersist,
      }),
    );
    expect(id).toBe('minted-id');
    expect(onCorruptRecord).toHaveBeenCalledTimes(1);
  });
});
