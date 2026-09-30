import { ApiGenericNotificationGroup } from 'farcaster-client-data';

import { NotificationRenderer } from './types/_types';
import { renderAdvertiseOnramp } from './types/advertiseOnramp';
import { renderGenericNoLogo } from './types/genericNoLogo';
import { renderGenericWithLogo } from './types/genericWithLogo';
import { renderImportX } from './types/importX';
import { renderProFeesUpsell } from './types/proFeesUpsell';
import { renderStorageWarning } from './types/storageWarning';
import { renderWarpcastWallet } from './types/warpcastWallet';
import { renderWelcomeToFcPro } from './types/welcomeToFcPro';

export const NOTIFICATION_RENDERERS: Record<string, NotificationRenderer> = {
  'advertise-onramp': renderAdvertiseOnramp,
  'warpcast-wallet': renderWarpcastWallet,
  'import-x': renderImportX,
  'welcome-to-fc-pro': renderWelcomeToFcPro,
  'farcaster-pro-fees-upsell': renderProFeesUpsell,
  'no-fee-november-pro-upsell': renderProFeesUpsell,
  'storage-warning-casts': renderStorageWarning,
  'storage-warning-reactions': renderStorageWarning,
  'storage-warning-links': renderStorageWarning,
};

export function resolveRenderer(
  item: ApiGenericNotificationGroup['previewItems'][0],
): NotificationRenderer {
  // Check for ID-specific renderer first
  const byId = NOTIFICATION_RENDERERS[item.id];
  if (byId) return byId;

  // Fallback to generic with logo renderer
  const icon = item.content.icon;
  if (icon) return renderGenericWithLogo;
  const hasTitle = !!(item.content.mobileOverride?.title || item.content.title);
  return hasTitle ? renderGenericNoLogo : () => null;
}
