import { validateSnapResponse } from '@farcaster/snap';
import type { SnapPage } from '@farcaster/snap/react';

export function validateAndParseSnap(json: unknown): SnapPage {
  const validation = validateSnapResponse(json);
  if (!validation.valid) {
    throw new Error(
      `Invalid snap: ${validation.issues.map((i) => i.message).join(', ')}`,
    );
  }
  return json as SnapPage;
}
