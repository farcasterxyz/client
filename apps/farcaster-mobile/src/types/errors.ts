import { FarcasterError } from 'farcaster-client-data';

export type ApiError = unknown;

type FarcasterErrorOptionsShim<T extends object = object> = {
  error?: unknown;
} & T;

const shimOptions = (options: FarcasterErrorOptionsShim) => {
  return {
    cause: options.error instanceof Error ? options.error : undefined,
  };
};

export class RegisterDevicePushTokenError extends FarcasterError {
  readonly deviceId: string;
  readonly deviceToken: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      deviceId: string;
      deviceToken: string;
    }>,
  ) {
    super('Error registering device push token', shimOptions(options));
    this.deviceId = options.deviceId;
    this.deviceToken = options.deviceToken;
  }
}

export class UnregisterDevicePushTokenError extends FarcasterError {
  readonly deviceId: string;

  constructor(options: FarcasterErrorOptionsShim<{ deviceId: string }>) {
    super('Error unregistering device push token', shimOptions(options));
    this.deviceId = options.deviceId;
  }
}

export class MissingDeviceTokenError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim = {}) {
    super(
      'Device token for push notifications was blank, unable to register',
      shimOptions(options),
    );
  }
}

export class SyncPushNotificationsPermissionsError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim = {}) {
    super('Could not sync push notification permissions', shimOptions(options));
  }
}

export class SyncLocationPermissionsError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim = {}) {
    super('Could not sync location permissions', shimOptions(options));
  }
}

export class OptimisticUpdateError extends FarcasterError {
  readonly hash: string;
  readonly context: string;

  constructor(
    options: FarcasterErrorOptionsShim<{ context: string; hash: string }>,
  ) {
    super(`Optimistic update error: ${options.context}`, shimOptions(options));
    this.context = options.context;
    this.hash = options.hash;
  }
}

export class CreateAccountError extends FarcasterError {
  readonly step: string;

  constructor(options: FarcasterErrorOptionsShim<{ step: string }>) {
    super(`Error creating account: ${options.step}`, shimOptions(options));
    this.step = options.step;
  }
}

export class PrivateKeyOrMnemonicMissingError extends FarcasterError {
  readonly missingPrivateKeyCount: number;
  readonly missingMnemonicCount: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      missingPrivateKeyCount: number;
      missingMnemonicCount: number;
    }>,
  ) {
    super(
      'Private key or mnemonic missing when attempting to restore wallet',
      shimOptions(options),
    );
    this.missingPrivateKeyCount = options.missingPrivateKeyCount;
    this.missingMnemonicCount = options.missingMnemonicCount;
  }
}

export class FetchSyncChannelError extends FarcasterError {
  readonly channelId: string | null;

  constructor(
    options: FarcasterErrorOptionsShim<{
      channelId: string | null;
    }>,
  ) {
    super('Could not retrieve sync channel', shimOptions(options));
    this.channelId = options.channelId;
  }
}

export class InitiateSyncChannelError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could not init sync channel', shimOptions(options));
  }
}

export class SignInWithMobileError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could not sign in with mobile', shimOptions(options));
  }
}

export class GetExistingTransportAgreementKeyError extends FarcasterError {
  readonly publicKey: string;

  constructor(options: FarcasterErrorOptionsShim<{ publicKey: string }>) {
    super(
      'Could not retrieve existing transport agreement key',
      shimOptions(options),
    );
    this.publicKey = options.publicKey;
  }
}

export class ConfirmQRCodeForSignInError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could not confirm QR code for sign-in', shimOptions(options));
  }
}

export class UserDoesNotExistQRCodeSignInError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'User does not exist when trying to sign in with QR code',
      shimOptions(options),
    );
  }
}

export class CouldNotRefreshConversationError extends FarcasterError {
  readonly conversationId: string;
  readonly counterpartyFids: number[];

  constructor(
    options: FarcasterErrorOptionsShim<{
      conversationId: string;
      counterpartyFids: number[];
    }>,
  ) {
    super('Could not refresh conversation', shimOptions(options));
    this.conversationId = options.conversationId;
    this.counterpartyFids = options.counterpartyFids;
  }
}

export class SignOutListenerError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('One or more signout listeners rejected', shimOptions(options));
  }
}

export class PushNotificationUserPreferenceUpdateError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Failed to update push notification user preference',
      shimOptions(options),
    );
  }
}

export class InAppNotificationUserPreferenceUpdateError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Failed to update in-app notification user preference',
      shimOptions(options),
    );
  }
}

export class RestartToUseDirectCastsError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to restart to use direct casts', shimOptions(options));
  }
}

export class CouldNotFindSenderInParticipantListError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could not find sender in participant list', shimOptions(options));
  }
}

export class WipeDirectCastsStoreError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could not wipe direct casts store', shimOptions(options));
  }
}

export class DeleteDeviceKeyError extends FarcasterError {
  readonly inboxId: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      inboxId: string;
    }>,
  ) {
    super('Failed to delete device key', shimOptions(options));
    this.inboxId = options.inboxId;
  }
}

export class InAppPurchaseError extends FarcasterError {
  constructor(
    options: FarcasterErrorOptionsShim<{
      productId: string;
    }>,
  ) {
    super('Failed to trigger an in-app purchase', shimOptions(options));
  }
}

export class InAppPurchaseNoOfferingFoundError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Failed to trigger an in-app purchase as no offering found',
      shimOptions(options),
    );
  }
}

export class InAppPurchaseNoProductsFoundError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Failed to trigger an in-app purchase as no products found',
      shimOptions(options),
    );
  }
}

export class InAppPurchaseNoWayToSubmitError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Failed to trigger an in-app purchase - nothing to submit',
      shimOptions(options),
    );
  }
}

export class SyncDirectCastsInboxError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to sync direct casts inbox', shimOptions(options));
  }
}

export class GetDirectCastsInboxError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to get direct casts inbox', shimOptions(options));
  }
}

export class GetDirectCastsConversationPageError extends FarcasterError {
  readonly participantFids: number[];

  constructor(
    options: FarcasterErrorOptionsShim<{ participantFids: number[] }>,
  ) {
    super('Failed to get direct casts conversation page', shimOptions(options));
    this.participantFids = options.participantFids;
  }
}

export class GetDirectCastsConversationError extends FarcasterError {
  readonly counterPartyFids: number[];

  constructor(
    options: FarcasterErrorOptionsShim<{ counterPartyFids: number[] }>,
  ) {
    super('Failed to get direct casts conversation', shimOptions(options));
    this.counterPartyFids = options.counterPartyFids;
  }
}

export class SendDirectCastError extends FarcasterError {
  readonly conversationId: string;
  readonly counterPartyFids: number[];

  constructor(
    options: FarcasterErrorOptionsShim<{
      conversationId: string;
      counterPartyFids: number[];
    }>,
  ) {
    super('Failed to send direct cast', shimOptions(options));
    this.conversationId = options.conversationId;
    this.counterPartyFids = options.counterPartyFids;
  }
}

export class CouldNotInitPasskeysError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to initialize passkeys', shimOptions(options));
  }
}

export class CouldNotImportWalletError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could not import wallet', shimOptions(options));
  }
}

export class UpdateStoredPassKeyError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to update stored passkey', shimOptions(options));
  }
}

export class ResultReturnedNullError extends FarcasterError {
  readonly screenOrProviderId: string;

  constructor(
    options: FarcasterErrorOptionsShim<{ screenOrProviderId: string }>,
  ) {
    super('Result returned null', shimOptions(options));
    this.screenOrProviderId = options.screenOrProviderId;
  }
}
