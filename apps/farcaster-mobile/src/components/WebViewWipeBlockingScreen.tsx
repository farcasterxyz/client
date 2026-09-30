import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { Button } from './Button';
import { Text } from './Text';

// Shown while the account-isolation boundary is unresolved: a sign-out could
// not confirm the mini app WebView wipe (an old Android System WebView whose
// fallback can't clear IndexedDB/CacheStorage, a timeout, or a native failure).
// Signing a new account in over that would let it inherit the previous
// account's mini app sessions, so the whole app is blocked here until a
// complete wipe is confirmed. Recovery is retry — and on Android, updating
// System WebView so the complete deleteBrowsingData path becomes available.
const WebViewWipeBlockingScreen: FC = memo(() => {
  const t = useTheme();
  const { retryWebViewWipe } = useAuthToken();
  const [retrying, setRetrying] = useState(true);
  const [failed, setFailed] = useState(false);

  const attempt = useCallback(async () => {
    setRetrying(true);
    setFailed(false);
    const ok = await retryWebViewWipe();
    if (ok) {
      // wipePending flips false and this screen unmounts; return before any
      // further state update to avoid a setState-after-unmount.
      return;
    }
    // Failure: keep the gate up and surface the retry affordance.
    setFailed(true);
    setRetrying(false);
  }, [retryWebViewWipe]);

  // Auto-attempt once on mount so a cold start after a WebView update can clear
  // itself without user action.
  useEffect(() => {
    attempt();
  }, [attempt]);

  return (
    <View
      style={[
        t.hFull,
        t.bgDefault,
        t.justifyCenter,
        t.itemsCenter,
        { paddingHorizontal: 24 },
      ]}
    >
      <Text
        style={[t.texts.primary, t.textXl, t.fontSemibold, t.textCenter, t.mB8]}
      >
        Clearing account data
      </Text>

      <Text
        style={[
          t.texts.secondary,
          t.textBase,
          t.textCenter,
          { marginBottom: 24 },
        ]}
      >
        {failed
          ? `We couldn’t finish clearing the previous account’s data. To keep your accounts separate, please try again.${
              Platform.OS === 'android'
                ? ' If it keeps failing, update Android System WebView, then retry.'
                : ''
            }`
          : 'Finishing sign-out and clearing the previous account’s data…'}
      </Text>

      {retrying ? (
        <ActivityIndicator size="large" color={t.colors.loadingIndicator} />
      ) : (
        failed && <Button title="Try again" onPress={attempt} />
      )}
    </View>
  );
});

WebViewWipeBlockingScreen.displayName = 'WebViewWipeBlockingScreen';

export { WebViewWipeBlockingScreen };
