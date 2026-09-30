import {
  ApiKeyStoreKey,
  BaseError,
  FarcasterError,
} from 'farcaster-client-data';

type FarcasterErrorOptionsShim<T extends object = {}> = {
  error?: unknown;
} & T;

const shimOptions = (options: FarcasterErrorOptionsShim) => {
  return {
    cause: options.error instanceof Error ? options.error : undefined,
  };
};

export class AppInitializationTimeoutError extends FarcasterError {
  readonly timeoutDuration: number;

  constructor(options: FarcasterErrorOptionsShim<{ timeoutDuration: number }>) {
    super(
      'App not initialized (still showing splash) after long wait',
      shimOptions(options),
    );
    this.timeoutDuration = options.timeoutDuration;
  }
}

export class CheckForOverTheAirUpdateError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Error checking for / downloading over-the-air update',
      shimOptions(options),
    );
  }
}

export class ReloadBundleError extends FarcasterError {
  readonly ui: 'drawer' | 'prompt';

  constructor(options: FarcasterErrorOptionsShim<{ ui: 'drawer' | 'prompt' }>) {
    super('Error reloading bundle', shimOptions(options));
    this.ui = options.ui;
  }
}

export class CreateCastError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Error creating cast', shimOptions(options));
  }
}

export class UpdateCastLikeError extends FarcasterError {
  readonly castHash: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      castHash: string;
    }>,
  ) {
    super('Error updating cast like', shimOptions(options));
    this.castHash = options.castHash;
  }
}

export class UpdateNftReactionError extends FarcasterError {
  readonly contractAddress: string;
  readonly tokenId: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      contractAddress: string;
      tokenId: string;
    }>,
  ) {
    super('Error updating nft reaction', shimOptions(options));
    this.contractAddress = options.contractAddress;
    this.tokenId = options.tokenId;
  }
}

export class BookmarkError extends FarcasterError {
  readonly hash: string;

  constructor(options: FarcasterErrorOptionsShim<{ hash: string }>) {
    super('Failed to update bookmark for cast', shimOptions(options));
    this.hash = options.hash;
  }
}

export class WatchError extends FarcasterError {
  readonly hash: string;

  constructor(options: FarcasterErrorOptionsShim<{ hash: string }>) {
    super('Failed to watch cast', shimOptions(options));
    this.hash = options.hash;
  }
}

export class DeleteCastFromTrendingTopicError extends FarcasterError {
  readonly hash: string;
  readonly topicId: string;

  constructor(
    options: FarcasterErrorOptionsShim<{ hash: string; topicId: string }>,
  ) {
    super('Failed to delete cast from trending topic', shimOptions(options));
    this.hash = options.hash;
    this.topicId = options.topicId;
  }
}

export class UnwatchError extends FarcasterError {
  readonly hash: string;

  constructor(options: FarcasterErrorOptionsShim<{ hash: string }>) {
    super('Failed to unwatch cast', shimOptions(options));
    this.hash = options.hash;
  }
}

export class RecastError extends FarcasterError {
  readonly fid: number;
  readonly castHash: string;

  constructor(
    options: FarcasterErrorOptionsShim<{ fid: number; castHash: string }>,
  ) {
    super('Failed to recast', shimOptions(options));
    this.castHash = options.castHash;
    this.fid = options.fid;
  }
}

export class UndoRecastError extends FarcasterError {
  readonly hash: string;

  constructor(options: FarcasterErrorOptionsShim<{ hash: string }>) {
    super('Failed to undo recast', shimOptions(options));
    this.hash = options.hash;
  }
}

export class DeleteCastError extends FarcasterError {
  readonly hash: string;

  constructor(options: FarcasterErrorOptionsShim<{ hash: string }>) {
    super('Failed to delete cast', shimOptions(options));
    this.hash = options.hash;
  }
}

export class ReportCastError extends FarcasterError {
  readonly hash: string;

  constructor(options: FarcasterErrorOptionsShim<{ hash: string }>) {
    super('Failed to report cast', shimOptions(options));
    this.hash = options.hash;
  }
}

export class ReportUserError extends FarcasterError {
  readonly reportedFid: number;

  constructor(options: FarcasterErrorOptionsShim<{ reportedFid: number }>) {
    super('Failed to report user', shimOptions(options));
    this.reportedFid = options.reportedFid;
  }
}

export class CreateFollowError extends FarcasterError {
  readonly followerFid: number;
  readonly followeeFid: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      followerFid: number;
      followeeFid: number;
    }>,
  ) {
    super('Error creating follow', shimOptions(options));
    this.followeeFid = options.followeeFid;
    this.followerFid = options.followerFid;
  }
}

export class DeleteFollowError extends FarcasterError {
  readonly followerFid: number;
  readonly followeeFid: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      followerFid: number;
      followeeFid: number;
    }>,
  ) {
    super('Error deleting follow', shimOptions(options));
    this.followeeFid = options.followeeFid;
    this.followerFid = options.followerFid;
  }
}

export class CreateFeedFollowError extends FarcasterError {
  readonly feedKey: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      feedKey: string;
    }>,
  ) {
    super('Error creating feed follow', shimOptions(options));
    this.feedKey = options.feedKey;
  }
}

export class DeleteFeedFollowError extends FarcasterError {
  readonly feedKey: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      feedKey: string;
    }>,
  ) {
    super('Error deleting feed follow', shimOptions(options));
    this.feedKey = options.feedKey;
  }
}

export class UnableToFollowUserError extends FarcasterError {
  readonly followeeFid: number;
  readonly followerFid: number;
  readonly follow: boolean;

  constructor(
    options: FarcasterErrorOptionsShim<{
      followerFid: number;
      followeeFid: number;
      follow: boolean;
    }>,
  ) {
    super('Error following/unfollowing user', shimOptions(options));
    this.followerFid = options.followerFid;
    this.followeeFid = options.followeeFid;
    this.follow = options.follow;
  }
}

export class UnableToFollowFeedError extends FarcasterError {
  readonly followerFid: number;
  readonly feedKey: string;
  readonly follow: boolean;

  constructor(
    options: FarcasterErrorOptionsShim<{
      followerFid: number;
      feedKey: string;
      follow: boolean;
    }>,
  ) {
    super('Error following/unfollowing feed', shimOptions(options));
    this.followerFid = options.followerFid;
    this.feedKey = options.feedKey;
    this.follow = options.follow;
  }
}

export class DuplicateKeyError extends FarcasterError {
  readonly context: string;
  readonly duplicates: unknown[];

  constructor(
    options: FarcasterErrorOptionsShim<{
      context: string;
      duplicates: unknown[];
    }>,
  ) {
    super(
      `Duplicate keys encountered: ${options.context}`,
      shimOptions(options),
    );
    this.context = options.context;
    this.duplicates = options.duplicates;
  }
}

export class PurgeOldCastDraftsError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Error purging old cast drafts', shimOptions(options));
  }
}

export class NavigatorNotReadyForDeepLinkError extends FarcasterError {
  readonly url: string;

  constructor(options: FarcasterErrorOptionsShim<{ url: string }>) {
    super(
      'Navigator was not ready to navigate to deep link',
      shimOptions(options),
    );
    this.url = options.url;
  }
}

export class NavigatorNotReadyForPushNotificationError extends FarcasterError {
  readonly type: string;

  constructor(options: FarcasterErrorOptionsShim<{ type: string }>) {
    super(
      'Navigator was not ready to navigate to push notification',
      shimOptions(options),
    );
    this.type = options.type;
  }
}

export class FailedToRestoreWalletError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to restore wallet', shimOptions(options));
  }
}

export class PrefetchAuthedResourcesError extends FarcasterError {
  readonly fid: number | undefined;

  constructor(options: FarcasterErrorOptionsShim<{ fid: number | undefined }>) {
    super('Failed to prefetch authed resources', shimOptions(options));
    this.fid = options.fid;
  }
}

export class ImageUploadError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to upload image', shimOptions(options));
  }
}

export class VideoPreparationError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to prepare video', shimOptions(options));
  }
}

/**
 * `videoId` and `uploadTraceId` ride in `errorContext` rather than the message
 * so a report can be joined against the `videos` row and the upload trace
 * without giving every occurrence a unique message, which would scatter these
 * across one error group each.
 */
type VideoErrorOptions = FarcasterErrorOptionsShim<{
  videoId?: string;
  uploadTraceId?: string;
}>;

export class VideoUploadError extends FarcasterError {
  readonly videoId: string | undefined;
  readonly uploadTraceId: string | undefined;

  constructor(options: VideoErrorOptions) {
    super('Failed to upload video', shimOptions(options));
    this.videoId = options.videoId;
    this.uploadTraceId = options.uploadTraceId;
  }

  override get errorContext() {
    return {
      videoId: this.videoId,
      uploadTraceId: this.uploadTraceId,
    };
  }
}

export class VideoStatusError extends FarcasterError {
  readonly videoId: string | undefined;
  readonly uploadTraceId: string | undefined;

  constructor(options: VideoErrorOptions) {
    super('Failed to check video status', shimOptions(options));
    this.videoId = options.videoId;
    this.uploadTraceId = options.uploadTraceId;
  }

  override get errorContext() {
    return {
      videoId: this.videoId,
      uploadTraceId: this.uploadTraceId,
    };
  }
}

export class NewCastError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to create cast', shimOptions(options));
  }
}

export class EnsureUserKeysError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to ensure user keys', shimOptions(options));
  }
}

export type DelegateManagedSignerStep =
  | 'reading_timestamp'
  | 'fetching_delegate_public_key'
  | 'updating_delegate_signer'
  | 'writing_timestamp';

export class FailedToDelegateSignerError extends FarcasterError {
  readonly step: DelegateManagedSignerStep;

  constructor(
    options: FarcasterErrorOptionsShim<{ step: DelegateManagedSignerStep }>,
  ) {
    super('Failed to delegate managed signer', shimOptions(options));
    this.step = options.step;
  }
}

export class WebViewMessageParsingError extends FarcasterError {
  readonly messageData: string;

  constructor(options: FarcasterErrorOptionsShim<{ messageData: string }>) {
    super('Error parsing message from webview', shimOptions(options));
    this.messageData = options.messageData;
  }
}

export class UnrecognizedWebViewMessageError extends FarcasterError {
  readonly messageData: string;

  constructor(options: FarcasterErrorOptionsShim<{ messageData: string }>) {
    super('Unrecognized message type from webview', shimOptions(options));
    this.messageData = options.messageData;
  }
}

type FarcasterOnboardingErrorOptions<T = Record<string, unknown>> =
  FarcasterErrorOptionsShim<
    {
      fid: number | undefined;
      email: string | undefined;
    } & T
  >;

export class FarcasterOnboardingError extends FarcasterError {
  readonly fid: number | undefined;
  readonly email: string | undefined;

  constructor(message: string, options: FarcasterOnboardingErrorOptions) {
    super(message, shimOptions(options));
    this.fid = options.fid;
    this.email = options.email;
  }
}

export class OnboardingSubmitEmailError extends FarcasterOnboardingError {
  constructor(options: FarcasterOnboardingErrorOptions) {
    super('Onboarding error: Failed to submit email', options);
  }
}

export class OnboardingCreateAccountError extends FarcasterOnboardingError {
  constructor(options: FarcasterOnboardingErrorOptions) {
    super('Onboarding error: Failed to create account', options);
  }
}

export class OnboardingCreateDirectoryError extends FarcasterOnboardingError {
  constructor(options: FarcasterOnboardingErrorOptions) {
    super('Onboarding error: Failed to create directory', options);
  }
}

type OnboardingRefreshOnboardingStateStep =
  | 'email_verification'
  | 'connect_address'
  | 'approval_pending'
  | 'notifications_nudge'
  | 'create_profile'
  | 'upload_avatar'
  | 'register_fid'
  | 'register_fname'
  | 'interests_nudge'
  | 'contacts_nudge';

export class OnboardingRefreshOnboardingStateError extends FarcasterOnboardingError {
  readonly step: OnboardingRefreshOnboardingStateStep;

  constructor(
    options: FarcasterOnboardingErrorOptions<{
      step: OnboardingRefreshOnboardingStateStep;
    }>,
  ) {
    super(
      `Onboarding error: Failed to refresh onboarding state at ${options.step}`,
      options,
    );
    this.step = options.step;
  }
}

export class CreateDirectCastConversationError extends FarcasterError {
  readonly fid: number;
  readonly counterPartyFids: number[];

  constructor(
    options: FarcasterErrorOptionsShim<{
      fid: number;
      counterPartyFids: number[];
    }>,
  ) {
    super('Failed to create direct cast conversation', shimOptions(options));
    this.fid = options.fid;
    this.counterPartyFids = options.counterPartyFids;
  }
}

export class BuildDoubleRatchetError extends FarcasterError {
  readonly fid: number;
  readonly counterPartyFid: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      fid: number;
      counterPartyFid: number;
    }>,
  ) {
    super('Error building double ratchet', shimOptions(options));
    this.fid = options.fid;
    this.counterPartyFid = options.counterPartyFid;
  }
}

export class UserKeysNotFoundError extends FarcasterError {
  readonly fid: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      fid: number;
    }>,
  ) {
    super('User keys not found', shimOptions(options));
    this.fid = options.fid;
  }
}

export class OptimisticallySendDirectCastError extends FarcasterError {
  readonly fid: number;
  readonly conversationId: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      fid: number;
      conversationId: string;
    }>,
  ) {
    super('Error optimistically sending direct cast', shimOptions(options));
    this.fid = options.fid;
    this.conversationId = options.conversationId;
  }
}

export class SendDirectCastError extends FarcasterError {
  readonly fid: number;
  readonly conversationId: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      fid: number;
      conversationId: string;
    }>,
  ) {
    super('Error sending direct cast', shimOptions(options));
    this.fid = options.fid;
    this.conversationId = options.conversationId;
  }
}

export class CouldNotFindLocalPrivateSPKAfterCreationError extends FarcasterError {
  readonly address: string;
  readonly fid: number;
  readonly spk: ApiKeyStoreKey;

  constructor(
    options: FarcasterErrorOptionsShim<{
      address: string;
      fid: number;
      spk: ApiKeyStoreKey;
    }>,
  ) {
    super(
      'Could not find local SPK private key after creation',
      shimOptions(options),
    );
    this.address = options.address;
    this.fid = options.fid;
    this.spk = options.spk;
  }
}

export class CouldNotFindRemoteSPKAfterUploadingError extends FarcasterError {
  readonly address: string;
  readonly fid: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      address: string;
      fid: number;
    }>,
  ) {
    super('Could not find remote SPK after uploading', shimOptions(options));
    this.address = options.address;
    this.fid = options.fid;
  }
}

export class DirectCastDecryptError extends FarcasterError {
  readonly conversationId: string;
  readonly counterPartyFid: number;
  readonly counterPartyUsername: string | undefined;
  readonly senderFid: number;
  readonly senderUsername: string | undefined;
  readonly timestamp: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      conversationId: string;
      counterPartyFid: number;
      counterPartyUsername: string | undefined;
      senderFid: number;
      senderUsername: string | undefined;
      timestamp: number;
    }>,
  ) {
    super('Direct cast could not be decrypted.', shimOptions(options));
    this.conversationId = options.conversationId;
    this.counterPartyFid = options.counterPartyFid;
    this.counterPartyUsername = options.counterPartyUsername;
    this.senderFid = options.senderFid;
    this.senderUsername = options.senderUsername;
    this.timestamp = options.timestamp;
  }
}

export class DirectCastDecryptErrorForDebugging extends FarcasterError {
  readonly conversationId: string;
  readonly counterPartyFid: number;
  readonly senderFid: number;

  constructor(
    options: FarcasterErrorOptionsShim<{
      conversationId: string;
      counterPartyFid: number;
      senderFid: number;
    }>,
  ) {
    super(
      'Debugging: Direct cast could not be decrypted',
      shimOptions(options),
    );
    this.conversationId = options.conversationId;
    this.counterPartyFid = options.counterPartyFid;
    this.senderFid = options.senderFid;
  }
}

export class SaveLoggedDirectCastDecryptFailuresError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could not saved logged direct cast failures', shimOptions(options));
  }
}

export class MultipleInstancesOfRatchetError extends FarcasterError {
  readonly conversationId: string;

  constructor(options: FarcasterErrorOptionsShim<{ conversationId: string }>) {
    super('Multiple instances of ratchet', shimOptions(options));
    this.conversationId = options.conversationId;
  }
}

export class UserKeysDoNotMatchError extends FarcasterError {
  readonly keyType: 'idk' | 'spk';
  readonly localKey: string | undefined;
  readonly serverKey: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      keyType: 'idk' | 'spk';
      localKey: string | undefined;
      serverKey: string;
    }>,
  ) {
    super('User keys do not match', shimOptions(options));
    this.keyType = options.keyType;
    this.localKey = options.localKey;
    this.serverKey = options.serverKey;
  }
}

export class UserKeysCouldNotDecryptError extends FarcasterError {
  readonly keyType: 'idk' | 'spk';
  readonly serverKey: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      keyType: 'idk' | 'spk';
      serverKey: string;
    }>,
  ) {
    super('User keys could not be decrypted', shimOptions(options));
    this.keyType = options.keyType;
    this.serverKey = options.serverKey;
  }
}

export class UserKeysCouldNotEncryptError extends FarcasterError {
  readonly keyType: 'idk' | 'spk';
  readonly localKey: string;

  constructor(
    options: FarcasterErrorOptionsShim<{
      keyType: 'idk' | 'spk';
      localKey: string;
    }>,
  ) {
    super('User keys could not be encrypted', shimOptions(options));
    this.keyType = options.keyType;
    this.localKey = options.localKey;
  }
}

export class OverwriteUserKeysError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Could overwrite IPK/SPK keys', shimOptions(options));
  }
}

export class FakeError extends FarcasterError {
  readonly simpleFoo: string;
  readonly complexFoo: object;

  constructor(
    options: FarcasterErrorOptionsShim<{
      simpleFoo: string;
      complexFoo: object;
    }>,
  ) {
    super('This is a fake error for testing', shimOptions(options));
    this.simpleFoo = options.simpleFoo;
    this.complexFoo = options.complexFoo;
  }
}

export class NoLocalIDKFoundError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('No local IDK found', shimOptions(options));
  }
}

export class ExpectedToBeAuthenticatedError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Expected to be authenticated when fetching onboarding state',
      shimOptions(options),
    );
  }
}

export class UpdateUserVisibilityError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to update user visibility', shimOptions(options));
  }
}

export class OnboardingStateError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to fetch onboarding state (fatal)', shimOptions(options));
  }
}

export class UpdateLinkNotificationsError extends BaseError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Failed to update link notifications preferences',
      shimOptions(options),
    );
  }
}

export class UpdateTraderSubscriptionError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to update trader subscription', shimOptions(options));
  }
}

export class UpdateChannelNotificationsError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super(
      'Failed to update channel notifications preferences',
      shimOptions(options),
    );
  }
}

export class StartInAppPurchaseError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to start in app purchase (fatal)', shimOptions(options));
  }
}

export class FinishInAppPurchaseError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to finish in app purchase (fatal)', shimOptions(options));
  }
}

export class PreloadLazyComponentError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to preload lazy component', shimOptions(options));
  }
}

export class CouldNotSignOutError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Failed to sign out', shimOptions(options));
  }
}

export class SignOutListenerError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Error running signout listener', shimOptions(options));
  }
}

export class ResetKeyTransportError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Error resetting key transport', shimOptions(options));
  }
}

export class RemovePersistentQueryStorageError extends FarcasterError {
  constructor(options: FarcasterErrorOptionsShim) {
    super('Error removing persistent storage', shimOptions(options));
  }
}
