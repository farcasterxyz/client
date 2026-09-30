import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// NEYN-11640: Suppress the Android POST_NOTIFICATIONS runtime permission
// dialog in E2E builds (Maestro/BrowserStack). The dialog is rendered by
// com.android.permissioncontroller, which is outside the app's accessibility
// scope, so Maestro's polling can neither see nor tap it — it blocks the
// post-sign-in home-feed assertion for the full 240s wait (run 27167191515).
// launchApp.permissions.notifications: deny only configures the install-time
// grant state and does not intercept the Android 13+ runtime request.
// The env var is set on the `internal` EAS profile (eas.json); production
// builds do not set it, so end users continue to be prompted.
export const isNotificationPromptDisabled =
  process.env.EXPO_PUBLIC_DISABLE_NOTIFICATION_PROMPT === '1';

export function useRequestNotificationsPermission() {
  return async ({
    onAsked,
    onGranted,
  }: {
    onAsked: () => void;
    onGranted: () => void;
  }) => {
    if (isNotificationPromptDisabled) {
      return;
    }

    const permissions = await Notifications.getPermissionsAsync();

    if (
      !Device.isDevice ||
      permissions?.status === 'granted' ||
      (permissions?.status === 'denied' && !permissions.canAskAgain)
    ) {
      return;
    }

    onAsked();

    const res = await Notifications.requestPermissionsAsync();

    if (res.granted) {
      onGranted();
    }
  };
}
