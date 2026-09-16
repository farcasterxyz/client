import { readdirSync } from 'fs';
import { normalize } from 'path';

import { compactQueryKey } from '../../../../utils/QueryUtils';
import { buildAccountVerificationsKey as buildAccountVerificationsKeyV1 } from '../accountVerification/buildAccountVerificationsKey';
import { buildAccountVerificationsKey } from '../accountVerifications/buildAccountVerificationsKey';
import { buildActiveChannelStreakKey } from '../activeChannelStreak/buildActiveChannelStreakKey';
import { buildAdminFeedKey } from '../adminFeed/buildAdminFeedKey';
import { buildAllStarterPacksKey } from '../allStarterPacks/buildAllStarterPacksKey';
import { buildAMAKey } from '../ama/buildAMAKey';
import { buildAnalyticsMiniAppRollupKey } from '../analyticsMiniAppRollup/buildAnalyticsMiniAppRollupKey';
import { buildApiKeysKey } from '../apiKeys/buildApiKeysKey';
import { buildAppsByAuthorKey } from '../appsByAuthor/buildAppsByAuthorKey';
import { buildArticleKey } from '../article/buildArticleKey';
import { buildAudioRoomKey } from '../audioRoom/buildAudioRoomKey';
import { buildAudioRoomChatKey } from '../audioRoomChat/buildAudioRoomChatKey';
import { buildAudioRoomParticipantsKey } from '../audioRoomParticipants/buildAudioRoomParticipantsKey';
import { buildAudioRoomsListKey } from '../audioRoomsList/buildAudioRoomsListKey';
import { buildAuthenticatedUserKey } from '../authenticatedUser/buildAuthenticatedUserKey';
import { buildBlockedUsersKey } from '../blockedUsers/buildBlockedUsersKey';
import { buildBookmarkedCastsKey } from '../bookmarkedCasts/buildBookmarkedCastsKey';
import { buildBuyWarpsCoinbaseCommerceInfoKey } from '../buyWarpsCoinbaseCommerceInfo/buildBuyWarpsCoinbaseCommerceInfoKey';
import { buildCampaignKey } from '../campaign/buildCampaignKey';
import { buildCastAttachmentCacheKey } from '../castAttachmentCache/buildCastAttachmentCacheKey';
import { buildCastAttachmentPreviewCacheKey } from '../castAttachmentPreviewCache/buildCastAttachmentPreviewCacheKey';
import { buildCastLikesKey } from '../castLikes/buildCastLikesKey';
import { buildCastQuotesKey } from '../castQuotes/buildCastQuotesKey';
import { buildCastRecastersKey } from '../castRecasters/buildCastRecastersKey';
import { buildChannelKey } from '../channel/buildChannelKey';
import { buildChannelBannedUsersKey } from '../channelBannedUsers/buildChannelBannedUsersKey';
import { buildChannelCreationInfoKey } from '../channelCreationInfo/buildChannelCreationInfoKey';
import { buildChannelDetailsKey } from '../channelDetails/buildChannelDetailsKey';
import { buildChannelFollowersYouKnowKey } from '../channelFollowersYouKnow/buildChannelFollowersYouKnowKey';
import { buildChannelSettingsKey } from '../channelSettings/buildChannelSettingsKey';
import { buildChannelUsersKey } from '../channelUsers/buildChannelUsersKey';
import { buildChannelUsersForInviteKey } from '../channelUsersForInvite/buildChannelUsersForInviteKey';
import { buildChannelUsersForManagementKey } from '../channelUsersForManagement/buildChannelUsersForManagementKey';
import { buildClientConfigKey } from '../clientConfig/buildClientConfigKey';
import { buildConnectedAccountsKey } from '../connectedAccounts/buildConnectedAccountsKey';
import { buildContactsUsersKey } from '../contactsUsers/buildContactsUsersKey';
import { buildContractAddressKey } from '../contractAddress/buildContractAddressKey';
import { buildConversationCastRepliesKey } from '../conversationCastReplies/buildConversationCastRepliesKey';
import { buildDevToolsDomainRolesKey } from '../devToolsDomainRoles/buildDevToolsDomainRolesKey';
import { buildDevToolsDomainsOwnedKey } from '../devToolsDomainsOwned/buildDevToolsDomainsOwnedKey';
import { buildDevToolsFarcasterJsonKey } from '../devToolsFarcasterJson/buildDevToolsFarcasterJsonKey';
import { buildDevToolsGetMiniAppManifestKey } from '../devToolsGetMiniAppManifest/buildDevToolsGetMiniAppManifestKey';
import { buildDevToolsGetRegisteredAccountAssociationKey } from '../devToolsGetRegisteredAccountAssociation/buildDevToolsGetRegisteredAccountAssociationKey';
import { buildDevToolsInspectImageUrlKey } from '../devToolsInspectImageUrl/buildDevToolsInspectImageUrlKey';
import { buildDevToolsInspectMiniAppUrlKey } from '../devToolsInspectMiniAppUrl/buildDevToolsInspectMiniAppUrlKey';
import { buildDevToolsListMiniAppManifestsKey } from '../devToolsListMiniAppManifests/buildDevToolsListMiniAppManifestsKey';
import { buildDevToolsManagedAppsKey } from '../devToolsManagedApps/buildDevToolsManagedAppsKey';
import { buildDevToolsMetaTagsKey } from '../devToolsMetaTags/buildDevToolsMetaTagsKey';
import { buildDevToolsTempAccountAssociationKey } from '../devToolsTempAccountAssociation/buildDevToolsTempAccountAssociationKey';
import { buildDirectCastConversationKey } from '../directCastConversation/buildDirectCastConversationKey';
import { buildDirectCastConversationHistoricalMessagesKey } from '../directCastConversationHistoricalMessages/buildDirectCastConversationHistoricalMessagesKey';
import { buildDirectCastConversationMessagesKey } from '../directCastConversationMessages/buildDirectCastConversationMessagesKey';
import { buildDirectCastConversationRecentMessagesKey } from '../directCastConversationRecentMessages/buildDirectCastConversationRecentMessagesKey';
import { buildDirectCastGroupInvitesKey } from '../directCastGroupInvites/buildDirectCastGroupInvitesKey';
import { buildDirectCastInboxByAccountKey } from '../directCastInbox/buildDirectCastInboxByAccountKey';
import { buildDirectCastKeysByAccountKey } from '../directCastKeysByAccount/buildDirectCastKeysByAccountKey';
import { buildDirectCastUsersKey } from '../directCastUsers/buildDirectCastUsersKey';
import { buildDiscoverAppsKey } from '../discoverApps/buildDiscoverAppsKey';
import { buildDiscoverChannelsKey } from '../discoverChannels/buildDiscoverChannelsKey';
import { buildDiscoverFramesKey } from '../discoverFrames/buildDiscoverFramesKey';
import { buildDiscoveryAppKey } from '../discoveryApps/buildDiscoveryAppKey';
import { buildDiscoveryFrameKey } from '../discoveryFrames/buildDiscoveryFrameKey';
import { buildDraftCastsKey } from '../draftCasts/buildDraftCastsKey';
import { buildExploreFeedKey } from '../exploreFeed/buildExploreFeedKey';
import { buildFarcasterProIsEligibleForLimitedEditionNftKey } from '../farcasterProIsEligibleForLimitedEditionNft/buildFarcasterProIsEligibleForLimitedEditionNftKey';
import { buildFarcasterProSubscribeWithUsdcDetailsKey } from '../farcasterProSubscribeWithUsdcDetails/buildFarcasterProSubscribeWithUsdcDetailsKey';
import { buildFarcasterProSubscribeWithUsdcStatusKey } from '../farcasterProSubscribeWithUsdcStatus/buildFarcasterProSubscribeWithUsdcStatusKey';
import { buildFarcasterProSubscribeWithWarpsDetailsKey } from '../farcasterProSubscribeWithWarpsDetails/buildFarcasterProSubscribeWithWarpsDetailsKey';
import { buildFavoriteFramesKey } from '../favoriteFrames/buildFavoriteFramesKey';
import { buildFeaturedHeroAppsKey } from '../featuredHeroApps/buildFeaturedHeroAppsKey';
import { buildFeedItemsKey } from '../feedItems/buildFeedItemsKey';
import { buildFeedSummariesKey } from '../feedSummaries/buildFeedSummariesKey';
import { buildFindLocationKey } from '../findLocation/buildFindLocationKey';
import { buildFollowersKey } from '../followers/buildFollowersKey';
import { buildFollowersYouKnowKey } from '../followersYouKnow/buildFollowersYouKnowKey';
import { buildFollowingKey } from '../following/buildFollowingKey';
import { buildFrameBlocklistKey } from '../frameBlocklist/buildFrameBlocklistKey';
import { buildFrameDetailsKey } from '../frameDetails/buildFrameDetailsKey';
import { buildGenerateImageUploadUrlKey } from '../generateImageUploadUrl/buildGenerateImageUploadUrlKey';
import { buildGetSiweNonceKey } from '../getSiweNonce/buildGetSiweNonceKey';
import { buildGlobalFrameAnalyticsKey } from '../globalFrameAnalytics/buildGlobalFrameAnalyticsKey';
import { buildGloballyCachedCastKey } from '../globallyCachedCast/buildGloballyCachedCastKey';
import { buildGloballyCachedChannelKey } from '../globallyCachedChannel/buildGloballyCachedChannelKey';
import { buildGloballyCachedDirectCastInboxConversationKey } from '../globallyCachedDirectCastInboxConversation/buildGloballyCachedDirectCastInboxConversationKey';
import { buildGloballyCachedTokenKey } from '../globallyCachedToken/buildGloballyCachedTokenKey';
import { buildGloballyCachedTotpTokenKey } from '../globallyCachedTotpToken/buildGloballyCachedTotpTokenKey';
import { buildGloballyCachedUserKey } from '../globallyCachedUser/buildGloballyCachedUserKey';
import { buildHealthKey } from '../health/buildHealthKey';
import { buildHighlightedChannelsKey } from '../highlightedChannels/buildHighlightedChannelsKey';
import { buildImageAspectRatiosCacheKey } from '../imageAspectRatiosCache/buildImageAspectRatiosCacheKey';
import { buildInviteKey } from '../invite/buildInviteKey';
import { buildInvitedKey } from '../invited/buildInvitedKey';
import { buildInviteWithWarpsOfferingKey } from '../inviteWithWarpsOffering/buildInviteWithWarpsOfferingKey';
import { buildIsFnameAvailableKey } from '../isFnameAvailable/buildIsFnameAvailableKey';
import { buildKeyTransactionKey } from '../keyTransaction/buildKeyTransactionKey';
import { buildLeastInteractedWithFollowingKey } from '../leastInteractedWithFollowing/buildLeastInteractedWithFollowingKey';
import { buildLocationUsersKey } from '../locationUsers/buildLocationUsersKey';
import { buildLookupOnboardingStateKey } from '../lookupOnboardingState/buildLookupOnboardingStateKey';
import { buildMiniAppHomeEmbedKey } from '../miniAppHomeEmbed/buildMiniAppHomeEmbedKey';
import { buildMiniappsHostedManifestKey } from '../miniappsHostedManifest/buildMiniappsHostedManifestKey';
import { buildMintableAssetsKey } from '../mintableAssets/buildMintableAssetsKey';
import { buildMutedKeywordKey } from '../mutedKeyword/buildMutedKeywordKey';
import { buildMutedKeywordsKey } from '../mutedKeywords/buildMutedKeywordsKey';
import { buildMutedUsersKey } from '../mutedUsers/buildMutedUsersKey';
import { buildNewsKey } from '../news/buildNewsKey';
import { buildNotificationActorsInGroupKey } from '../notificationActorsInGroup/buildNotificationActorsInGroupKey';
import { buildNotificationsForTabKey } from '../notificationsForTab/buildNotificationsForTabKey';
import { buildNotificationsInGroupKey } from '../notificationsInGroup/buildNotificationsInGroupKey';
import { buildOfferingKey } from '../offering/buildOfferingKey';
import { buildOnboardingStateKey } from '../onboardingState/buildOnboardingStateKey';
import { buildOnchainActionKey } from '../onchainAction/buildOnchainActionKey';
import { buildPendingAdminReviewsKey } from '../pendingAdminReviews/buildPendingAdminReviewsKey';
import { buildPlaintextDirectCastGroupInviteKey } from '../plaintextDirectCastGroupInvite/buildPlaintextDirectCastGroupInviteKey';
import { buildPlaintextDirectCastReactionsKey } from '../plaintextDirectCastReactions/buildPlaintextDirectCastReactionsKey';
import { buildPollResultsKey } from '../pollResults/buildPollResultsKey';
import { buildPrimaryAddressKey } from '../primaryAddress/buildPrimaryAddressKey';
import { buildProductCatalogKey } from '../productCatalog/buildProductCatalogKey';
import { buildQuestsKey } from '../quests/buildQuestsKeys';
import { buildRecentlyLaunchedFramesKey } from '../recentlyLaunchedFrames/buildRecentlyLaunchedFramesKey';
import { buildRecoveryKey } from '../recovery/buildRecoveryKey';
import { buildRecoveryAddressKey } from '../recoveryAddress/buildRecoveryAddressKey';
import { buildRecoveryAddressChangeKey } from '../recoveryAddressChange/buildRecoveryAddressChangeKey';
import { buildRecoveryAddressChangeHashKey } from '../recoveryAddressChangeHash/buildRecoveryAddressChangeHashKey';
import { buildRemoteSiwfRequestKey } from '../remoteSiwfRequest/buildRemoteSiwfRequestKey';
import { buildRentStorageOfferingsKey } from '../rentStorageOfferings/buildRentStorageOfferingsKey';
import { buildScheduledAudioRoomsListKey } from '../scheduledAudioRoomsList/buildScheduledAudioRoomsListKey';
import { buildSearchCastsKey } from '../searchCasts/buildSearchCastsKey';
import { buildSearchChannelsKey } from '../searchChannels/buildSearchChannelsKey';
import { buildSearchDirectCastInboxKey } from '../searchDirectCastInbox';
import { buildSearchDirectCastMessagesKey } from '../searchDirectCastMessages';
import { buildSearchMiniAppsKey } from '../searchMiniApps/buildSearchMiniAppsKey';
import { buildSearchMiniAppsForAutocompleteKey } from '../searchMiniAppsForAutocomplete/buildSearchMiniAppsForAutocompleteKey';
import { buildSearchSummaryKey } from '../searchSummary/buildSearchSummaryKey';
import { buildSearchUsersKey } from '../searchUsers/buildSearchUsersKey';
import { buildSearchUsersForStarterPacksKey } from '../searchUsersForStarterPacks/buildSearchUsersForStarterPacksKey';
import { buildSearchWalletSendTargetsKey } from '../searchWalletSendTargets/buildSearchWalletSendTargetsKey';
import { buildShareCastKey } from '../shareCast/buildShareCastKey';
import { buildSignedKeyRequestKey } from '../signedKeyRequest/buildSignedKeyRequestKey';
import { buildSignerRemoveHashKey } from '../signerRemoveHash/buildSignerRemoveHashKey';
import { buildSignersKey } from '../signers/buildSignersKey';
import { buildStarterPackKey } from '../starterPack/buildStarterPackKey';
import { buildStarterPackFeedKey } from '../starterPackFeed/buildStarterPackFeedKey';
import { buildStarterPacksKey } from '../starterPacks/buildStarterPacksKey';
import { buildStarterPackUsersKey } from '../starterPackUsers/buildStarterPackUsersKey';
import { buildStorageUtilizationKey } from '../storageUtilization/buildStorageUtilizationKey';
import { buildSuggestedChannelsKey } from '../suggestedChannels/buildSuggestedChannelsKey';
import { buildSuggestedStarterPacksKey } from '../suggestedStarterPacks/buildSuggestedStarterPacksKey';
import { buildSuggestedUsersKey } from '../suggestedUsers/buildSuggestedUsersKey';
import { buildSyncChannelKey } from '../syncChannel/buildSyncChannelKey';
import { buildThreadKey } from '../thread/buildThreadKey';
import { buildTokenKey } from '../token/buildTokenKey';
import { buildTokenHoldersKey } from '../tokenHolders/buildTokenHoldersKey';
import { buildTokenLinksKey } from '../tokenLinks/buildTokenLinksKey';
import { buildTokenWatchlistsKey } from '../tokenWatchlists/buildTokenWatchlistsKey';
import { buildTopFramesKey } from '../topFrames/buildTopFramesKey';
import { buildTotpEnabledKey } from '../totpEnabled/buildTotpEnabledKey';
import { buildTrendingTopicCastsKey } from '../trendingTopicCasts/buildTrendingTopicCastsKey';
import { buildTrendingTopicsKey } from '../trendingTopics/buildTrendingTopicsKey';
import { buildTwitterFollowingKey } from '../twitterFollowing/buildTwitterFollowingKey';
import { buildUnseenKey } from '../unseen/buildUnseenKey';
import { buildUserKey } from '../user/buildUserKey';
import { buildUserAppContextKey } from '../userAppContext/buildUserAppContextKey';
import { buildUserByFidKey } from '../userByFid/buildUserByFidKey';
import { buildUserByUsernameKey } from '../userByUsername/buildUserByUsernameKey';
import { buildUserCastKey } from '../userCast/buildUserCastKey';
import { buildUserCastsKey } from '../userCasts/buildUserCastsKey';
import { buildUserCastsAndRepliesKey } from '../userCastsAndReplies/buildUserCastsAndRepliesKey';
import { buildUserChannelsForCategoryKey } from '../userChannelsForCategory/buildUserChannelsForCategoryKey';
import { buildUserFollowingChannelsKey } from '../userFollowingChannels/buildUserFollowingChannelsKey';
import { buildUserLikedCastsKey } from '../userLikedCasts/buildUserLikedCastsKey';
import { buildUserPreferencesKey } from '../userPreferences/buildUserPreferencesKey';
import { buildUserThreadCastsKey } from '../userThreadCasts/buildUserThreadCastsKey';
import { buildUserThreadHiddenRepliesKey } from '../userThreadHiddenReplies/buildUserThreadHiddenRepliesKey';
import { buildUserUsernamesKey } from '../userUsernames/buildUserUsernamesKey';
import { buildValidateNewChannelKeyKey } from '../validateNewChannelKey/buildValidateNewChannelKeyKey';
import { buildVerificationsKey } from '../verifications/buildVerificationsKey';
import { buildWalletActivityKey } from '../walletActivity/buildWalletActivityKey';
import { buildWalletChainNativeAssetKey } from '../walletChainNativeAsset/buildWalletChainNativeAssetKey';
import { buildWalletEvmScanActionKey } from '../walletEvmScanAction/buildWalletEvmScanActionKey';
import { buildWalletNftsKey } from '../walletNfts/buildWalletNftsKey';
import { buildWalletPositionsKey } from '../walletPositions/buildWalletPositionsKey';
import { buildWalletResourceKey } from '../walletResource/buildWalletResourceKey';
import { buildWalletSendSuggestionsKey } from '../walletSendSuggestions/buildWalletSendSuggestionsKey';
import { buildWarpsOfferingKey } from '../warpsOffering/buildWarpsOfferingKey';
import { buildWarpTransactionsKey } from '../warpTransactions/buildWarpTransactionsKey';

describe('hooks/data', () => {
  it('should have a unique query key prefix for each file', () => {
    const keys = compactQueryKey(
      [
        buildAccountVerificationsKeyV1,
        buildAccountVerificationsKey,
        buildActiveChannelStreakKey,
        buildAdminFeedKey,
        buildAllStarterPacksKey,
        buildAMAKey,
        buildApiKeysKey,
        buildBookmarkedCastsKey,
        buildBuyWarpsCoinbaseCommerceInfoKey,
        buildCampaignKey,
        buildCastAttachmentCacheKey,
        buildCastAttachmentPreviewCacheKey,
        buildCastLikesKey,
        buildCastQuotesKey,
        buildCastRecastersKey,
        buildChannelBannedUsersKey,
        buildChannelCreationInfoKey,
        buildChannelDetailsKey,
        buildChannelFollowersYouKnowKey,
        buildChannelKey,
        buildChannelSettingsKey,
        buildChannelUsersForInviteKey,
        buildChannelUsersForManagementKey,
        buildChannelUsersKey,
        buildClientConfigKey,
        buildConnectedAccountsKey,
        buildContactsUsersKey,
        buildContractAddressKey,
        buildConversationCastRepliesKey,
        buildDirectCastConversationHistoricalMessagesKey,
        buildDirectCastConversationKey,
        buildDirectCastConversationMessagesKey,
        buildDirectCastConversationRecentMessagesKey,
        buildDirectCastGroupInvitesKey,
        buildDirectCastInboxByAccountKey,
        buildDirectCastKeysByAccountKey,
        buildDirectCastUsersKey,
        buildDiscoverAppsKey,
        buildDiscoverChannelsKey,
        buildDiscoverFramesKey,
        buildDiscoveryAppKey,
        buildDiscoveryFrameKey,
        buildDraftCastsKey,
        buildExploreFeedKey,
        buildFavoriteFramesKey,
        buildFeaturedHeroAppsKey,
        buildFeedItemsKey,
        buildFeedSummariesKey,
        buildFindLocationKey,
        buildFollowersKey,
        buildFollowersYouKnowKey,
        buildFollowingKey,
        buildFrameBlocklistKey,
        buildFrameDetailsKey,
        buildGenerateImageUploadUrlKey,
        buildGetSiweNonceKey,
        buildGlobalFrameAnalyticsKey,
        buildGloballyCachedTokenKey,
        buildGloballyCachedCastKey,
        buildGloballyCachedChannelKey,
        buildGloballyCachedDirectCastInboxConversationKey,
        buildGloballyCachedUserKey,
        buildGloballyCachedTotpTokenKey,
        buildHealthKey,
        buildHighlightedChannelsKey,
        buildImageAspectRatiosCacheKey,
        buildInvitedKey,
        buildInviteKey,
        buildInviteWithWarpsOfferingKey,
        buildIsFnameAvailableKey,
        buildKeyTransactionKey,
        buildLeastInteractedWithFollowingKey,
        buildLocationUsersKey,
        buildLookupOnboardingStateKey,
        buildMintableAssetsKey,
        buildMutedKeywordKey,
        buildMutedKeywordsKey,
        buildMutedUsersKey,
        buildBlockedUsersKey,
        buildNewsKey,
        buildNotificationActorsInGroupKey,
        buildNotificationsForTabKey,
        buildNotificationsInGroupKey,
        buildOfferingKey,
        buildOnboardingStateKey,
        buildOnchainActionKey,
        buildPendingAdminReviewsKey,
        buildPlaintextDirectCastGroupInviteKey,
        buildPlaintextDirectCastReactionsKey,
        buildPollResultsKey,
        buildPrimaryAddressKey,
        buildProductCatalogKey,
        buildQuestsKey,
        buildRecentlyLaunchedFramesKey,
        buildRecoveryAddressChangeHashKey,
        buildRecoveryAddressChangeKey,
        buildRecoveryAddressKey,
        buildRecoveryKey,
        buildRemoteSiwfRequestKey,
        buildRentStorageOfferingsKey,
        buildSearchCastsKey,
        buildSearchChannelsKey,
        buildSearchDirectCastInboxKey,
        buildSearchDirectCastMessagesKey,
        buildSearchSummaryKey,
        buildSearchUsersForStarterPacksKey,
        buildSearchUsersKey,
        buildSearchWalletSendTargetsKey,
        buildShareCastKey,
        buildSignedKeyRequestKey,
        buildSignerRemoveHashKey,
        buildSignersKey,
        buildStarterPackKey,
        buildStarterPackFeedKey,
        buildStarterPacksKey,
        buildStarterPackUsersKey,
        buildStorageUtilizationKey,
        buildSuggestedChannelsKey,
        buildSuggestedStarterPacksKey,
        buildSuggestedUsersKey,
        buildSyncChannelKey,
        buildTopFramesKey,
        buildThreadKey,
        buildTokenKey,
        buildTokenHoldersKey,
        buildTokenLinksKey,
        buildTokenWatchlistsKey,
        buildTotpEnabledKey,
        buildTrendingTopicCastsKey,
        buildTrendingTopicsKey,
        buildTwitterFollowingKey,
        buildUnseenKey,
        buildUserAppContextKey,
        buildUserByFidKey,
        buildUserByUsernameKey,
        buildUserCastKey,
        buildUserCastsAndRepliesKey,
        buildUserCastsKey,
        buildUserChannelsForCategoryKey,
        buildUserFollowingChannelsKey,
        buildUserKey,
        buildUserLikedCastsKey,
        buildUserPreferencesKey,
        buildUserThreadCastsKey,
        buildUserThreadHiddenRepliesKey,
        buildUserUsernamesKey,
        buildValidateNewChannelKeyKey,
        buildVerificationsKey,
        buildWalletActivityKey,
        buildWalletChainNativeAssetKey,
        buildWalletNftsKey,
        buildWalletPositionsKey,
        buildWalletResourceKey,
        buildWalletSendSuggestionsKey,
        buildWarpsOfferingKey,
        buildWarpTransactionsKey,
        buildWalletEvmScanActionKey,
        buildDevToolsMetaTagsKey,
        buildDevToolsFarcasterJsonKey,
        buildDevToolsTempAccountAssociationKey,
        buildDevToolsDomainsOwnedKey,
        buildAppsByAuthorKey,
        buildArticleKey,
        buildAudioRoomKey,
        buildAudioRoomChatKey,
        buildAudioRoomParticipantsKey,
        buildAudioRoomsListKey,
        buildScheduledAudioRoomsListKey,
        buildAuthenticatedUserKey,
        buildMiniAppHomeEmbedKey,
        buildMiniappsHostedManifestKey,
        buildDevToolsInspectMiniAppUrlKey,
        buildDevToolsGetMiniAppManifestKey,
        buildDevToolsInspectImageUrlKey,
        buildAnalyticsMiniAppRollupKey,
        buildDevToolsDomainRolesKey,
        buildDevToolsListMiniAppManifestsKey,
        buildDevToolsManagedAppsKey,
        buildSearchMiniAppsKey,
        buildSearchMiniAppsForAutocompleteKey,
        buildFarcasterProSubscribeWithWarpsDetailsKey,
        buildFarcasterProSubscribeWithUsdcDetailsKey,
        buildFarcasterProSubscribeWithUsdcStatusKey,
        buildFarcasterProIsEligibleForLimitedEditionNftKey,
        buildDevToolsGetRegisteredAccountAssociationKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ].flatMap((build) => (build as any)({})),
    );

    const omitted = new Set(['__tests__', 'index.ts', 'types.ts']);

    const ignore = [
      'walletSimulations',
      'walletTransactionsHistory',
      'redeemUsdcForWarps',
      'setPrimaryAddress',
      'getStepUpMessage',
      'swapTokensForGas',
    ];

    const filesExpectedToHaveKeyBuilders = readdirSync(
      normalize(`${__dirname}/..`),
    ).filter(
      (path) =>
        !path.startsWith('.') && !omitted.has(path) && !ignore.includes(path),
    );

    keys.sort();
    const uniqueKeys = Array.from(new Set(keys));

    expect(keys).toEqual(uniqueKeys);
    expect(uniqueKeys).toEqual(filesExpectedToHaveKeyBuilders);
  });
});
