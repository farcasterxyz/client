import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { miniAppHeaderHeight } from '~/constants/MiniApp';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHeightForExpandingBottomSheet } from '~/utils/MiniAppUtils';

type MiniAppLaunchSplashProps = {
  imageUrl?: string;
  backgroundColor?: string;
};

/**
 * Full-screen splash shown the instant a mini app launch begins, rendered at
 * the provider level ABOVE the host UI (Discover/feed) and above the still-
 * animating MiniApp BottomSheet.
 *
 * Why this exists: the in-sheet `SplashScreen` (see MiniApp.tsx) only becomes
 * visible once the BottomSheet has finished sliding up to cover the screen —
 * and that open animation is starved by the WebView's RPC/bridge traffic while
 * the mini app loads, so it measured ~1–3.3s in the simulator. Until then the
 * user stared at the host screen with just the docked bar ("mini apps won't
 * pull up instantly"). This overlay covers exactly that gap: it paints
 * immediately, then hands off to the identical in-sheet splash once the sheet
 * settles. The icon is centered in the same region (below the safe-area top +
 * mini app header) so the hand-off is pixel-identical — no visual jump.
 */
export function MiniAppLaunchSplash({
  imageUrl,
  backgroundColor,
}: MiniAppLaunchSplashProps) {
  const t = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  // Match the in-sheet SplashScreen's centering region exactly (same height
  // basis + header offset) so the hand-off at sheet-settle has no icon jump —
  // including on Android, where useHeightForExpandingBottomSheet() omits the
  // top inset (so `bottom: 0` here would differ by the status-bar height).
  const iconRegionHeight =
    useHeightForExpandingBottomSheet() - miniAppHeaderHeight;

  // The full-screen container stays transparent and only positions the icon in
  // screen coordinates. The painted background is a separate inset layer that
  // matches EXACTLY the region the settled MiniApp BottomSheet covers
  // (topInset=top on both platforms, bottomInset=bottom on Android). Painting
  // the whole screen instead would cover the status-bar strip (and the Android
  // nav-bar strip) that the sheet leaves uncovered, so at sheet-settle those
  // strips would flip from this splash color to the host UI behind the sheet —
  // a flash on every launch hand-off. See MinimizedMiniAppProvider.
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          // Sit above the host UI and the BottomSheet (elevation 6 / shadow).
          zIndex: 100,
          elevation: 100,
        },
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top,
          left: 0,
          right: 0,
          bottom: Platform.OS === 'android' ? bottom : 0,
          backgroundColor: backgroundColor ?? t.colors.background.light,
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: 'absolute',
          top: top + miniAppHeaderHeight,
          left: 0,
          right: 0,
          height: iconRegionHeight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        pointerEvents="none"
      >
        {imageUrl ? (
          <View style={{ marginTop: -88 }}>
            <SimplerRemoteImage uri={imageUrl} height={88} width={88} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
