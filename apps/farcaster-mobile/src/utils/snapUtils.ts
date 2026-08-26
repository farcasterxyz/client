/**
 * Snap utility functions for validating and parsing snap responses.
 *
 * Adapted from the snap emulator-native app's lib/snapPayload.ts
 */

import type { Spec } from '@json-render/core';

export type SnapPageResponse = {
  version: string;
  theme?: { accent?: string };
  effects?: string[];
  ui: Spec;
};

/** Validate that the response has the expected json-render Spec shape. */
function validateSpec(spec: unknown): spec is SnapPageResponse['ui'] {
  if (!spec || typeof spec !== 'object') return false;
  const s = spec as Record<string, unknown>;
  return (
    typeof s.root === 'string' &&
    typeof s.elements === 'object' &&
    s.elements !== null &&
    !Array.isArray(s.elements)
  );
}

/** Unwrap response and validate shape. */
export function parseSnapPayload(payload: unknown): SnapPageResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Snap response is not valid JSON');
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.version !== 'string') {
    throw new Error('Snap response must include version');
  }

  if (!validateSpec(candidate.ui)) {
    throw new Error(
      'Snap response must include ui: { root: "...", elements: { ... } }',
    );
  }

  return {
    version: candidate.version,
    theme: candidate.theme as SnapPageResponse['theme'],
    effects: candidate.effects as SnapPageResponse['effects'],
    ui: candidate.ui as SnapPageResponse['ui'],
  };
}

export const SNAP_ACCEPT_HEADER =
  'application/vnd.farcaster.snap+json,text/html,*/*';
