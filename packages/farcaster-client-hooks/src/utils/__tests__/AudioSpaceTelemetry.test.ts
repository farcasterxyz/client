import { vi } from 'vitest';

import {
  normalizeAudioSpaceError,
  sanitizeAudioSpaceErrorMessage,
  shouldEmitAudioSpaceEvent,
} from '../AudioSpaceTelemetry';

describe('AudioSpaceTelemetry', () => {
  describe('sanitizeAudioSpaceErrorMessage', () => {
    it('normalizes whitespace and trims length', () => {
      const raw = `  first line\n\nsecond   line ${'x'.repeat(250)}  `;
      const sanitized = sanitizeAudioSpaceErrorMessage(raw);

      expect(sanitized).toBeDefined();
      expect(sanitized).toContain('first line second line');
      expect(sanitized?.length).toBeLessThanOrEqual(180);
    });

    it('redacts obvious sensitive values', () => {
      const sanitized = sanitizeAudioSpaceErrorMessage(
        'failed for bob@example.com at https://api.example.com with token eyJabc.def.ghi',
      );

      expect(sanitized).toContain('[redacted_email]');
      expect(sanitized).toContain('[redacted_url]');
      expect(sanitized).toContain('[redacted_token]');
    });

    it('returns undefined for empty values', () => {
      expect(sanitizeAudioSpaceErrorMessage(undefined)).toBeUndefined();
    });
  });

  describe('normalizeAudioSpaceError', () => {
    it('extracts structured fields from Error-like objects', () => {
      const normalized = normalizeAudioSpaceError({
        name: 'JoinError',
        code: 'join_failed',
        message: '  unable  to join  ',
      });

      expect(normalized).toEqual({
        errorCode: 'join_failed',
        errorName: 'JoinError',
        errorMessageSanitized: 'unable to join',
      });
    });

    it('handles string and unknown errors', () => {
      expect(normalizeAudioSpaceError('network timeout')).toEqual({
        errorName: 'Error',
        errorMessageSanitized: 'network timeout',
      });

      expect(normalizeAudioSpaceError(1234)).toEqual({
        errorName: 'UnknownError',
        errorMessageSanitized: '1234',
      });
    });
  });

  describe('shouldEmitAudioSpaceEvent', () => {
    it('dedupes emissions inside the dedupe window', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      const dedupeMap = new Map<string, number>();

      expect(shouldEmitAudioSpaceEvent(dedupeMap, 'space:join', 1000)).toBe(
        true,
      );
      expect(shouldEmitAudioSpaceEvent(dedupeMap, 'space:join', 1000)).toBe(
        false,
      );

      vi.advanceTimersByTime(1001);
      expect(shouldEmitAudioSpaceEvent(dedupeMap, 'space:join', 1000)).toBe(
        true,
      );

      vi.useRealTimers();
    });

    it('prunes stale entries when map is at capacity', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      const now = Date.now();
      const dedupeMap = new Map<string, number>();

      for (let i = 0; i < 1000; i += 1) {
        dedupeMap.set(`old:${i}`, now - 10 * 60 * 1000);
      }

      expect(
        shouldEmitAudioSpaceEvent(dedupeMap, 'new:event', 1000),
      ).toBeTruthy();
      expect(dedupeMap.size).toBeLessThanOrEqual(1000);

      vi.useRealTimers();
    });
  });
});
