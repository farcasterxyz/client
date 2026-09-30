package farcaster.modules.pushNotificationRecovery

import com.google.android.gms.tasks.Tasks
import com.google.firebase.installations.FirebaseInstallations
import com.google.firebase.messaging.FirebaseMessaging
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private class FirebaseInstallationResetException(cause: Throwable) :
  CodedException(
    "ERR_FIREBASE_INSTALLATION_RESET_FAILED",
    "Failed to reset the Firebase installation used for push notifications",
    cause,
  )

class PushNotificationRecoveryModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FarcasterPushNotificationRecovery")

    AsyncFunction("resetFirebasePushInstallation") {
      // Deleting the FCM token is best-effort because FIS_AUTH_ERROR can make
      // this request fail. Deleting the installation is the required recovery
      // step; the next token lookup creates a fresh installation and FCM token.
      try {
        Tasks.await(FirebaseMessaging.getInstance().deleteToken())
      } catch (_: Throwable) {
        // Continue to the installation reset.
      }

      try {
        Tasks.await(FirebaseInstallations.getInstance().delete())
      } catch (error: Throwable) {
        throw FirebaseInstallationResetException(error)
      }
    }
  }
}
