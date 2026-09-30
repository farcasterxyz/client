import { MEDIA_TYPE } from '@farcaster/snap';

/** Sent on every upstream snap fetch (matches emulator proxy GET behavior). */
export const SNAP_UPSTREAM_ACCEPT = `${MEDIA_TYPE},text/html,*/*`;
