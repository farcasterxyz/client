/**
 * Maps legacy event names → canonical entity.action event names.
 *
 * Events not in this map are emitted with their original legacy name. Add a
 * mapping here when an existing legacy event gets a structured replacement
 * (e.g. onboarding.*, recovery.*, recovery_address_change.*).
 */

export const ANALYTICS_EVENT_MAP: Record<string, string> = {
  // === Entity: push_notification ===
  'open push notification': 'push_notification.opened',

  // === Entity: onboarding (general flow) ===
  'press sign up': 'onboarding.signup_pressed',
  'press continue sign up': 'onboarding.continue_signup_pressed',
  'onboarding step shown': 'onboarding.step_shown',
  'onboarding completed v2': 'onboarding.completed',
  'completed onboarding': 'onboarding.completed_legacy',
  'press exit onboarding': 'onboarding.exited',
  'onboarding skipped screens': 'onboarding.screens_skipped',
  'onboarding no skip screens': 'onboarding.screens_not_skipped',
  'show waitlist': 'onboarding.waitlist_shown',
  'show external registration': 'onboarding.external_registration_shown',
  'set referrer': 'onboarding.referrer_set',
  'set location': 'onboarding.location_set',
  'click location': 'onboarding.location_clicked',
  'click inviter': 'onboarding.inviter_clicked',
  'clicked onboarding connect address': 'onboarding.connect_address_clicked',
  'auto register auth address': 'onboarding.auth_address_auto_registered',
  'abandon account creation': 'onboarding.abandoned',
  'cancel abandon account creation': 'onboarding.abandon_cancelled',
  'view abandon account creation': 'onboarding.abandon_viewed',

  // === Entity: onboarding_email ===
  'onboarding submit email': 'onboarding_email.submitted',
  'press next onboarding email': 'onboarding_email.next_pressed',
  'press back onboarding email': 'onboarding_email.back_pressed',
  'update email': 'onboarding_email.updated',

  // === Entity: onboarding_email_verification ===
  'press next onboarding email code':
    'onboarding_email_verification.next_pressed',
  'press back onboarding email code':
    'onboarding_email_verification.back_pressed',

  // === Entity: onboarding_x_verification ===
  'press continue with x verify': 'onboarding_x_verification.continue_pressed',
  'user x verification started': 'onboarding_x_verification.started',
  'user x verification completed': 'onboarding_x_verification.completed',
  'user x verification failed': 'onboarding_x_verification.failed',

  // === Entity: onboarding_phone_verification ===
  'skip verify phone': 'onboarding_phone_verification.skipped',
  'user phone verification started': 'onboarding_phone_verification.started',
  'user phone verification completed':
    'onboarding_phone_verification.completed',
  'user phone verification failed': 'onboarding_phone_verification.failed',

  // === Entity: onboarding_payment ===
  'skip registration payment': 'onboarding_payment.skipped',
  'click pay and register': 'onboarding_payment.iap_clicked',
  'register iap success': 'onboarding_payment.iap_succeeded',
  'register iap fail': 'onboarding_payment.iap_failed',
  'click register paid invite': 'onboarding_payment.paid_invite_clicked',
  'click register no payment needed': 'onboarding_payment.no_payment_needed',
  'show offering fees prompt': 'onboarding_payment.fees_prompt_shown',
  'registration purchase blocked': 'onboarding_payment.purchase_blocked',
  'use invite code to register': 'onboarding_payment.invite_code_used',
  'try another way press on verify x': 'onboarding_payment.try_another_x',
  'try another way press on iap': 'onboarding_payment.try_another_iap',
  'try another way press on invite codes':
    'onboarding_payment.try_another_invite',
  'move to option iap': 'onboarding_payment.switched_to_iap',
  'move to option verify x': 'onboarding_payment.switched_to_x',
  'move to option invite code': 'onboarding_payment.switched_to_invite',
  'redirect to iap from failed x':
    'onboarding_payment.redirected_from_x_to_iap',

  // === Entity: onboarding_registration ===
  'broadcast register tx': 'onboarding_registration.tx_broadcast',
  'confirm register tx': 'onboarding_registration.tx_confirmed',
  'fail register tx': 'onboarding_registration.tx_failed',

  // === Entity: onboarding_passkeys ===
  'onboarding skipped passkeys': 'onboarding_passkeys.skipped',

  // === Entity: onboarding_profile ===
  'onboarding complete profile': 'onboarding_profile.completed',
  'onboarding skipped profile': 'onboarding_profile.skipped',

  // === Entity: onboarding_interests ===
  'onboarding select interests': 'onboarding_interests.selected',
  'view onboarding interests': 'onboarding_interests.viewed',
  'view interests prompt': 'onboarding_interests.prompt_viewed',
  'skip interests prompt': 'onboarding_interests.prompt_skipped',
  'select onboarding interest': 'onboarding_interests.interest_toggled',
  'submit selected onboarding interests': 'onboarding_interests.submitted',
  'submit selected prompt interests': 'onboarding_interests.prompt_submitted',
  'skipped onboarding interests': 'onboarding_interests.skipped',

  // === Entity: onboarding_follow ===
  'onboarding follow all alpha': 'onboarding_follow.all_alpha_followed',
  'onboarding skipped follow all alpha': 'onboarding_follow.all_alpha_skipped',
  'onboarding follow all alpha notifications failed':
    'onboarding_follow.all_alpha_notifications_failed',

  // === Entity: onboarding_permissions ===
  'click onboarding enable push notifications':
    'onboarding_permissions.push_enable_clicked',
  'skip push notifications on onboarding':
    'onboarding_permissions.push_skipped',
  'enabled push notifications on onboarding':
    'onboarding_permissions.push_enabled',
  'disabled push notifications on onboarding':
    'onboarding_permissions.push_disabled',
  'skip contacts on onboarding': 'onboarding_permissions.contacts_skipped',
  'enabled contacts on onboarding': 'onboarding_permissions.contacts_enabled',
  'disabled contacts on onboarding': 'onboarding_permissions.contacts_disabled',
  'prompt for push notifications': 'onboarding_permissions.push_prompt_shown',
  'asked for push': 'onboarding_permissions.push_asked',
  'granted for push': 'onboarding_permissions.push_granted',

  // === AnalyticsEvent: onboarding ===
  onboarding_state_loaded: 'onboarding.state_loaded',
  onboarding_stuck_missing_delegate_signer:
    'onboarding.stuck_missing_delegate_signer',

  // === Entity: recovery (Flow A: FID Recovery) ===
  'submit request recovery link': 'recovery_email.submit_pressed',
  'submit propose recovery': 'recovery_registration.submit_attempt',
  'view recovery': 'recovery.screen_shown',
  'cancel recovery': 'recovery.cancelled',
  'complete recovery': 'recovery.completed',
  'click recovery backup recovery phrase': 'recovery.backup_phrase_clicked',
  'view recovery denied': 'recovery.denied_shown',
  'view recovery started': 'recovery.started_shown',
  'click lost recovery phrase': 'recovery.lost_phrase_clicked',

  // === Entity: recovery_address (Flow B: Recovery Address Change) ===
  'click change recovery address': 'recovery_address.change_clicked',
  'submit recovery address change': 'recovery_address.submit_pressed',
  'submit recovery address change failed':
    'recovery_address_change.submit_failed',
  'view recovery address change broadcasting':
    'recovery_address.broadcasting_shown',
  'view recovery address change succeeded':
    'recovery_address_change.succeeded_shown',
  'view recovery address change failed': 'recovery_address_change.failed_shown',
};

/**
 * Resolve the canonical event name for a legacy event name.
 * Returns the mapped name if present, otherwise returns the input unchanged.
 */
export function resolveAnalyticsEventName(legacyEventName: string): string {
  return ANALYTICS_EVENT_MAP[legacyEventName] ?? legacyEventName;
}
