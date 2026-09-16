import type { ApiFrame } from 'farcaster-client-data';

export interface UpdateFavoriteFrameParams {
  frame: ApiFrame;
  disableNotifications?: boolean;
  pushNotificationsEnabled?: boolean;
  position?: number;
}

export function buildUpdateFavoriteFrameRequest({
  frame,
  disableNotifications,
  pushNotificationsEnabled,
  position,
}: UpdateFavoriteFrameParams) {
  return {
    domain: frame.domain,
    disableNotifications,
    pushNotificationsEnabled,
    position,
  };
}
