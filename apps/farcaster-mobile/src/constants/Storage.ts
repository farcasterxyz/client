import { isDev } from './Env';

// Exporting this "private" variable, so tests can assert that all values are unique.
export const _storageKeys = {
  development: {
    aboutChannelStreakPrompt: 'about-channel-streak-prompt-dev',
    activeBadgeDetailsPrompt: 'active-badge-details-prompt-dev',
    authToken: 'auth-token-dev',
    authTokenValidated: 'auth-token-validated-dev',
    castActionsIntroductionPrompt: 'cast-actions-introduction-prompt-dev',
    startChannelStreakPrompt: 'start-channel-streak-dev',
    castChannelSelectorPrompt: 'channels-v3-cast-channel-selector-prompt-dev',
    castComposerActionsPrompt: 'cast-composer-actions-prompt-dev',
    castScheduledAtSelectorPrompt: 'cast-scheduled-at-selector-prompt-dev',
    castComposerDraftSavePrompt: 'cast-composer-draft-save-prompt-dev',
    castActionFramePrompt: 'cast-frame-action-prompt-dev',
    castDrafts: 'cast-drafts-dev',
    castQuotePrompt: 'cast-quote-prompt-dev',
    composerActionPrompt: 'composer-action-prompt-dev',
    device: 'device-dev',
    deviceToken: 'device-token-dev',
    enablePushNotificationsPromptInfo:
      'enable-push-notifications-prompt-info-dev',
    exportMnemonicPrompt: 'export-mnemonic-prompt-dev',
    followsDisabledPrompt: 'follows-disabled-prompt-dev',
    followMorePromptInfo: 'follow-more-prompt-info-dev',
    isAnalyticsEnabled: 'analytics-enabled-dev',
    lastClearedSplashCacheAt: 'last-cleared-splash-cache-at-dev',
    lastEnsuredManagedSignerAt: 'last-ensured-managed-signer-at-dev',
    lastEnsuredUpToDateDeviceTokenAt:
      'last-ensured-up-to-date-device-token-at-dev',
    lastFirebaseInstallationResetAt: 'last-firebase-installation-reset-at-dev',
    lastKnownLocationInfo: 'last-known-location-dev',
    missingPrivateKeyOrMnemonic: 'missing-private-key-or-mnemonic-dev',
    mnemonic: 'mnemonic-dev',
    privateKeyV1: 'private-key-dev',
    privateKeyV2: 'private-key-v2-dev',
    walletAddressKey: 'wallet-address-key-dev',
    recoveryId: 'recovery-id-dev',
    promptPasskeyEnrollmentAfterRecovery:
      'prompt-passkey-enrollment-after-recovery-dev',
    registration: 'registration-dev',
    reloadBundlePromptInfo: 'reload-bundle-prompt-info-dev',
    reportedDirectCastFailures: 'reported-direct-cast-failures-dev',
    reportUserReasonSelectorPrompt: 'report-user-reason-selector-prompt-dev',
    setUsernameConfirmationPrompt: 'set-username-confirmation-prompt-dev',
    syncChannelId: 'sync-channel-id-dev',
    syncTimestampKey: 'sync-timestamp-dev',
    transportAgreementPublicKey: 'transport-agreement-public-key-dev',
    updateEmailPromptInfo: 'update-email-prompt-info-dev',
    updateLocationEnabled: 'update-location-enabled-dev',
    updateLocationPromptInfo: 'update-location-prompt-info-dev',
    updateProfilePhotoPromptInfo: 'update-profile-photo-prompt-info-dev',
    kudosDismissed: 'kudos-dismissed-dev',
    version: 'version-dev',
    viewerAddressOverride: 'viewer-address-override-dev',
    warpTransactionInfoPrompt: 'warp-transaction-info-prompt-dev',
    mintWithWarpsPrompt: 'mint-with-warps-prompt-dev',
    giftWarpsPrompt: 'gift-warps-prompt-dev',
    mintWithWarpsChooseWalletPrompt: 'mint-with-warps-choose-wallet-prompt-dev',
    inviteLinkQRCodePrompt: 'invite-link-qr-code-prompt-dev',
    invitePrompt: 'invite-prompt-dev',
    inviteWithWarpsPrompt: 'invite-with-warps-prompt-dev',
    shareCastPrompt: 'share-cast-prompt-dev',
    contacts: 'contacts-dev',
    contactsNextUploadCursorStorage: 'contacts-next-upload-cursor-dev',
    directCastReactionPrompt: 'direct-cast-reaction-dev',
    directCastInvitePrompt: 'direct-cast-invite-dev',
    showDirectCastMessageReactionsPrompt:
      'show-direct-cast-message-reactions-dev',
    recentDirectCastReactions: 'recent-direct-cast-reactions-dev',
    userProfileQRCodePrompt: 'user-profile-qr-code-prompt-dev',
    installCoinbaseWalletPrompt: 'install-coinbase-wallet-prompt-dev',
    castInfoPrompt: 'cast-info-prompt-dev',
    syncContactsPrompt: 'sync-contacts-prompt-dev',
    dismissSyncContacts: 'dismiss-sync-contacts-dev',
    userBoostInfoPrompt: 'user-boost-info-prompt-dev',
    creatorRewardPrompt: 'creator-reward-prompt-dev',
    relaunchWarpcastPrompt: 'relaunch-warpcast-prompt-dev',
    joinChannelViaInviteCodePrompt: 'join-channel-via-invite-code-prompt-dev',
    joinChannelViaInviteCodeRestrictedPrompt:
      'join-channel-via-invite-code-restricted-prompt-dev',
    remoteSiwfRequestPrompt: 'remote-siwf-request-prompt-dev',
    dataSaverModeKey: 'data-saver-mode-dev',
    downloadUpdatesOnCellularKey: 'download-updates-on-cellular-dev',
    appStoreUpdatePrompt: 'app-store-update-prompt-dev',
    browserPreference: 'browser-preference-dev',
  },
  production: {
    aboutChannelStreakPrompt: 'about-channel-streak-prompt',
    activeBadgeDetailsPrompt: 'active-badge-details-prompt',
    authToken: 'auth-token',
    authTokenValidated: 'auth-token-validated',
    castActionsIntroductionPrompt: 'cast-actions-introduction-prompt',
    startChannelStreakPrompt: 'start-channel-streak',
    castChannelSelectorPrompt: 'channels-v3-cast-channel-selector-prompt',
    castComposerActionsPrompt: 'cast-composer-actions-prompt',
    castScheduledAtSelectorPrompt: 'cast-scheduled-at-selector-prompt',
    castComposerDraftSavePrompt: 'cast-composer-draft-save-prompt',
    castDrafts: 'cast-drafts',
    castActionFramePrompt: 'cast-frame-action-prompt',
    castQuotePrompt: 'cast-quote-prompt',
    composerActionPrompt: 'composer-action-prompt',
    device: 'device',
    deviceToken: 'device-token',
    enablePushNotificationsPromptInfo: 'enable-push-notifications-prompt-info',
    exportMnemonicPrompt: 'export-mnemonic-prompt',
    followsDisabledPrompt: 'follows-disabled-prompt',
    followMorePromptInfo: 'follow-more-prompt-info',
    isAnalyticsEnabled: 'analytics-enabled',
    lastClearedSplashCacheAt: 'last-cleared-splash-cache-at',
    lastEnsuredManagedSignerAt: 'last-ensured-managed-signer-at',
    lastEnsuredUpToDateDeviceTokenAt: 'last-ensured-up-to-date-device-token-at',
    lastFirebaseInstallationResetAt: 'last-firebase-installation-reset-at',
    lastKnownLocationInfo: 'last-known-location',
    missingPrivateKeyOrMnemonic: 'missing-private-key-or-mnemonic',
    mnemonic: 'mnemonic',
    privateKeyV1: 'private-key',
    privateKeyV2: 'private-key-v2',
    walletAddressKey: 'wallet-address-dev',
    recoveryId: 'recovery-id',
    promptPasskeyEnrollmentAfterRecovery:
      'prompt-passkey-enrollment-after-recovery',
    registration: 'registration',
    reloadBundlePromptInfo: 'reload-bundle-prompt-info',
    reportedDirectCastFailures: 'reported-direct-cast-failures',
    reportUserReasonSelectorPrompt: 'report-user-reason-selector-prompt',
    setUsernameConfirmationPrompt: 'set-username-confirmation-prompt',
    syncChannelId: 'sync-channel-id',
    syncTimestampKey: 'sync-timestamp',
    transportAgreementPublicKey: 'transport-agreement-public-key',
    updateEmailPromptInfo: 'update-email-prompt-info',
    updateLocationEnabled: 'update-location-enabled',
    updateLocationPromptInfo: 'update-location-prompt-info',
    updateProfilePhotoPromptInfo: 'update-profile-photo-prompt-info',
    kudosDismissed: 'kudos-dismissed',
    version: 'version',
    viewerAddressOverride: 'viewer-address-override',
    warpTransactionInfoPrompt: 'warp-transaction-info-prompt',
    mintWithWarpsPrompt: 'mint-with-warps-prompt',
    giftWarpsPrompt: 'gift-warps-prompt',
    mintWithWarpsChooseWalletPrompt: 'mint-with-warps-choose-wallet-prompt',
    inviteLinkQRCodePrompt: 'invite-link-qr-code-prompt-prod',
    invitePrompt: 'invite-prompt-prod',
    inviteWithWarpsPrompt: 'invite-with-warps-prompt-prod',
    shareCastPrompt: 'share-cast-prompt',
    contacts: 'contacts',
    contactsNextUploadCursorStorage: 'contacts-next-upload-cursor',
    directCastReactionPrompt: 'direct-cast-reaction',
    directCastInvitePrompt: 'direct-cast-invite',
    showDirectCastMessageReactionsPrompt: 'show-direct-cast-message-reactions',
    recentDirectCastReactions: 'recent-direct-cast-reactions',
    userProfileQRCodePrompt: 'user-profile-qr-code-prompt',
    installCoinbaseWalletPrompt: 'install-coinbase-wallet-prompt',
    castInfoPrompt: 'cast-info-prompt',
    syncContactsPrompt: 'sync-contacts-prompt',
    dismissSyncContacts: 'dismiss-sync-contacts',
    userBoostInfoPrompt: 'user-boost-info-prompt',
    creatorRewardPrompt: 'creator-reward-prompt',
    relaunchWarpcastPrompt: 'relaunch-warpcast-prompt',
    joinChannelViaInviteCodePrompt: 'join-channel-via-invite-code-prompt',
    joinChannelViaInviteCodeRestrictedPrompt:
      'join-channel-via-invite-code-restricted-prompt',
    remoteSiwfRequestPrompt: 'remote-siwf-request-prompt',
    dataSaverModeKey: 'data-saver-mode',
    downloadUpdatesOnCellularKey: 'download-updates-on-cellular',
    dismissedSetPreferredWallet: 'dismissed-set-preferred-wallet',
    appStoreUpdatePrompt: 'app-store-update-prompt',
    browserPreference: 'browser-preference',
  },
};

export const _storageKeyPrefixes = {
  development: {
    directCastConversationsKeyPrefix: 'direct-cast-conversation-dev',
  },
  production: {
    directCastConversationsKeyPrefix: 'direct-cast-conversation',
  },
};

const env = isDev ? 'development' : 'production';

export const aboutChannelStreakPromptKey =
  _storageKeys[env].aboutChannelStreakPrompt;
export const activeBadgeDetailsPromptKey =
  _storageKeys[env].activeBadgeDetailsPrompt;
export const authTokenKey = _storageKeys[env].authToken;
export const authTokenValidatedKey = _storageKeys[env].authTokenValidated;
export const castActionsIntroductionPromptKey =
  _storageKeys[env].castActionsIntroductionPrompt;
export const startChannelStreakPromptKey =
  _storageKeys[env].startChannelStreakPrompt;
export const castChannelSelectorPromptKey =
  _storageKeys[env].castChannelSelectorPrompt;
export const castComposerActionsPromptKey =
  _storageKeys[env].castComposerActionsPrompt;
export const castScheduledAtSelectorPromptKey =
  _storageKeys[env].castScheduledAtSelectorPrompt;
export const castComposerDraftSavePromptKey =
  _storageKeys[env].castComposerDraftSavePrompt;
export const castDraftsStorageKey = _storageKeys[env].castDrafts;
export const castActionFramePromptKey = _storageKeys[env].castActionFramePrompt;
export const castQuotePromptKey = _storageKeys[env].castQuotePrompt;
export const deviceStorageKey = _storageKeys[env].device;
export const deviceTokenStorageKey = _storageKeys[env].deviceToken;
export const enablePushNotificationsPromptInfoKey =
  _storageKeys[env].enablePushNotificationsPromptInfo;
export const exportMnemonicPromptKey = _storageKeys[env].exportMnemonicPrompt;
export const followsDisabledPromptKey = _storageKeys[env].followsDisabledPrompt;
export const followMorePromptInfoKey = _storageKeys[env].followMorePromptInfo;
export const isAnalyticsEnabledKey = _storageKeys[env].isAnalyticsEnabled;
export const lastClearedSplashCacheAtKey =
  _storageKeys[env].lastClearedSplashCacheAt;
export const lastEnsuredManagedSignerAtKey =
  _storageKeys[env].lastEnsuredManagedSignerAt;
export const lastEnsuredUpToDateDeviceTokenAtKey =
  _storageKeys[env].lastEnsuredUpToDateDeviceTokenAt;
export const lastFirebaseInstallationResetAtKey =
  _storageKeys[env].lastFirebaseInstallationResetAt;
export const lastKnownLocationInfoKey = _storageKeys[env].lastKnownLocationInfo;
export const missingPrivateKeyOrMnemonicStorageKey =
  _storageKeys[env].missingPrivateKeyOrMnemonic;
export const mnemonicStorageKey = _storageKeys[env].mnemonic;
export const privateKeyV1StorageKey = _storageKeys[env].privateKeyV1;
export const privateKeyV2StorageKey = _storageKeys[env].privateKeyV2;
export const walletAddressKey = _storageKeys[env].walletAddressKey;
export const recoveryIdStorageKey = _storageKeys[env].recoveryId;
export const promptPasskeyEnrollmentAfterRecoveryKey =
  _storageKeys[env].promptPasskeyEnrollmentAfterRecovery;
export const registrationStorageKey = _storageKeys[env].registration;
export const reloadBundlePromptInfoKey =
  _storageKeys[env].reloadBundlePromptInfo;
export const reportedDirectCastFailuresKey =
  _storageKeys[env].reportedDirectCastFailures;
export const reportUserReasonSelectorPromptKey =
  _storageKeys[env].reportUserReasonSelectorPrompt;
export const setUsernameConfirmationPromptKey =
  _storageKeys[env].setUsernameConfirmationPrompt;
export const syncChannelIdKey = _storageKeys[env].syncChannelId;
export const syncTimestampKey = _storageKeys[env].syncTimestampKey;
export const transportAgreementPublicKeyKey =
  _storageKeys[env].transportAgreementPublicKey;
export const updateEmailPromptInfoKey = _storageKeys[env].updateEmailPromptInfo;
export const updateLocationEnabledKey = _storageKeys[env].updateLocationEnabled;
export const updateLocationPromptInfoKey =
  _storageKeys[env].updateLocationPromptInfo;
export const updateProfilePhotoPromptInfoKey =
  _storageKeys[env].updateProfilePhotoPromptInfo;
export const kudosDismissedKey = _storageKeys[env].kudosDismissed;
export const versionStorageKey = _storageKeys[env].version;
export const viewerAddressOverrideStorageKey =
  _storageKeys[env].viewerAddressOverride;
export const directCastConversationKeyPrefix =
  _storageKeyPrefixes[env].directCastConversationsKeyPrefix;
export const warpTransactionInfoPromptKey =
  _storageKeys[env].warpTransactionInfoPrompt;
export const mintWithWarpsPromptKey = _storageKeys[env].mintWithWarpsPrompt;
export const mintWithWarpsChooseWalletPromptKey =
  _storageKeys[env].mintWithWarpsChooseWalletPrompt;
export const inviteLinkQRCodePrompt = _storageKeys[env].inviteLinkQRCodePrompt;
export const invitePrompt = _storageKeys[env].invitePrompt;
export const inviteWithWarpsPrompt = _storageKeys[env].inviteWithWarpsPrompt;
export const giftWarpsPromptKey = _storageKeys[env].giftWarpsPrompt;
export const shareCastPromptKey = _storageKeys[env].shareCastPrompt;
export const contactsStorageKey = _storageKeys[env].contacts;
export const contactsNextUploadCursorStorageKey =
  _storageKeys[env].contactsNextUploadCursorStorage;
export const directCastReactionPromptKey =
  _storageKeys[env].directCastReactionPrompt;
export const directCastInvitePromptKey =
  _storageKeys[env].directCastInvitePrompt;
export const showDirectCastMessageReactionsPromptKey =
  _storageKeys[env].showDirectCastMessageReactionsPrompt;
export const recentDirectCastReactionsKey =
  _storageKeys[env].recentDirectCastReactions;
export const userProfileQRCodePromptKey =
  _storageKeys[env].userProfileQRCodePrompt;
export const installCoinbaseWalletPromptKey =
  _storageKeys[env].installCoinbaseWalletPrompt;
export const castInfoPromptKey = _storageKeys[env].castInfoPrompt;
export const syncContactsPromptKey = _storageKeys[env].syncContactsPrompt;
export const dismissSyncContactsKey = _storageKeys[env].dismissSyncContacts;
export const userBoostInfoPromptKey = _storageKeys[env].userBoostInfoPrompt;
export const creatorRewardPromptKey = _storageKeys[env].creatorRewardPrompt;
export const relaunchWarpcastPromptKey =
  _storageKeys[env].relaunchWarpcastPrompt;
export const composerActionPromptKey = _storageKeys[env].composerActionPrompt;
export const joinChannelViaInviteCodePrompt =
  _storageKeys[env].joinChannelViaInviteCodePrompt;
export const joinChannelViaInviteCodeRestrictedPrompt =
  _storageKeys[env].joinChannelViaInviteCodeRestrictedPrompt;
export const remoteSiwfRequestPrompt =
  _storageKeys[env].remoteSiwfRequestPrompt;
export const dataSaverModeKey = _storageKeys[env].dataSaverModeKey;
export const downloadUpdatesOnCellularKey =
  _storageKeys[env].downloadUpdatesOnCellularKey;
export const appStoreUpdatePromptKey = _storageKeys[env].appStoreUpdatePrompt;
export const browserPreferenceStorageKey = _storageKeys[env].browserPreference;
