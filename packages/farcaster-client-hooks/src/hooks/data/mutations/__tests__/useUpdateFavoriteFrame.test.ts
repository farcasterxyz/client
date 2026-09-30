import type { ApiFrame } from 'farcaster-client-data';
import { describe, expect, it } from 'vitest';

import { buildUpdateFavoriteFrameRequest } from '../useUpdateFavoriteFrame.internal';

const frame = { domain: 'notifications.example.com' } as ApiFrame;

describe('buildUpdateFavoriteFrameRequest', () => {
  it('preserves an explicit push preference when disabling in-app notifications', () => {
    expect(
      buildUpdateFavoriteFrameRequest({
        frame,
        disableNotifications: true,
        pushNotificationsEnabled: true,
      }),
    ).toEqual({
      domain: frame.domain,
      disableNotifications: true,
      pushNotificationsEnabled: true,
      position: undefined,
    });
  });

  it('keeps legacy disable behavior when no push preference is supplied', () => {
    expect(
      buildUpdateFavoriteFrameRequest({
        frame,
        disableNotifications: true,
      }),
    ).toEqual({
      domain: frame.domain,
      disableNotifications: true,
      pushNotificationsEnabled: undefined,
      position: undefined,
    });
  });
});
