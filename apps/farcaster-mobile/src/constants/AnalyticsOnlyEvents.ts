/**
 * Analytics events emitted using the canonical entity.action naming
 * convention. Fire these via the analytics abstraction (useAnalytics or the
 * trackEvent prop on AnalyticsProvider).
 */
export enum AnalyticsOnlyEvent {
  // onboarding_email
  OnboardingEmailError = 'onboarding_email.error',

  // onboarding_email_verification
  OnboardingEmailVerificationError = 'onboarding_email_verification.error',

  // onboarding_x_verification
  OnboardingXVerificationError = 'onboarding_x_verification.error',

  // onboarding_payment
  OnboardingPaymentIapError = 'onboarding_payment.iap_error',

  // onboarding_registration
  OnboardingRegistrationError = 'onboarding_registration.error',
  OnboardingRegistrationTimeout = 'onboarding_registration.timeout',

  // auth (session lifecycle diagnostics)
  // Fired when a 401 was CONFIRMED (via the /v2/me re-validation probe) to be a
  // real revocation and the user was involuntarily signed out. Carries which
  // endpoint/status/source triggered it, so unexpected logouts are diagnosable.
  AuthSignOutUnexpected = 'auth.sign_out_unexpected',
  // Fired when the re-validation probe cleared a transient/edge 401 and a
  // false-positive logout was PREVENTED. Lets us measure the "phantom logout"
  // rate the re-validation fix suppresses.
  AuthSignOutPrevented = 'auth.sign_out_prevented',
  // Fired when the re-validation probe could NOT reach the origin (network /
  // timeout / offline) so revocation was neither confirmed nor cleared. We fail
  // SAFE and skip the sign-out, but this is not a prevented phantom logout —
  // tracked separately so it doesn't inflate the sign_out_prevented metric.
  AuthSignOutInconclusive = 'auth.sign_out_inconclusive',

  // recovery (Flow A flow-level)
  RecoveryInitiateScreenShown = 'recovery.initiate_screen_shown',
  RecoveryConfirmScreenShown = 'recovery.confirm_screen_shown',
  RecoveryDeepLinkOpened = 'recovery.deep_link_opened',
  RecoveryPollingTerminal = 'recovery.polling_terminal',
  RecoveryIntentClassified = 'recovery.intent_classified',
  RecoveryAbandoned = 'recovery.abandoned',

  // recovery_email
  RecoveryEmailError = 'recovery_email.error',
  RecoveryEmailResendPressed = 'recovery_email.resend_pressed',

  // recovery_phrase
  RecoveryPhraseShown = 'recovery_phrase.shown',
  RecoveryPhraseCopied = 'recovery_phrase.copied',
  RecoveryPhraseBackupConfirmed = 'recovery_phrase.backup_confirmed',

  // recovery_registration (FE signals)
  RecoveryRegistrationHashRequested = 'recovery_registration.hash_requested',
  RecoveryRegistrationHashSigned = 'recovery_registration.hash_signed',
  RecoveryRegistrationSubmitSucceeded = 'recovery_registration.submit_succeeded',
  RecoveryRegistrationSubmitFailed = 'recovery_registration.submit_failed',
  RecoveryRegistrationTxBroadcast = 'recovery_registration.tx_broadcast',
  RecoveryRegistrationTxConfirmed = 'recovery_registration.tx_confirmed',

  // recovery_approval (old-device Yes/No)
  RecoveryApprovalNotificationShown = 'recovery_approval.notification_shown',
  RecoveryApprovalApproved = 'recovery_approval.approved',
  RecoveryApprovalRejected = 'recovery_approval.rejected',
  RecoveryApprovalError = 'recovery_approval.error',

  // recovery_address (Flow B)
  RecoveryAddressEditScreenShown = 'recovery_address.edit_screen_shown',

  // recovery_address_change
  RecoveryAddressChangeHashRequested = 'recovery_address_change.hash_requested',
  RecoveryAddressChangeSubmitSucceeded = 'recovery_address_change.submit_succeeded',
  RecoveryAddressChangePollingTerminal = 'recovery_address_change.polling_terminal',

  // wallet_restore (client-side private key regeneration diagnostics)
  // Logs (masked) the params needed to re-generate the user's private key and
  // whether they are present on the device (NEYN-13180).
  WalletRestoreParamsChecked = 'wallet_restore.params_checked',
}
