import {
  ApiAbandonVideoUpload200Response,
  ApiAbandonVideoUploadRequestBody,
  ApiAcceptSpeakerAudioRoom200Response,
  ApiAcceptSpeakerAudioRoomRequestBody,
  ApiAcceptStageInviteAudioRoom200Response,
  ApiAcceptStageInviteAudioRoomRequestBody,
  ApiActivateTokenSubscription200Response,
  ApiActivateTokenSubscriptionRequestBody,
  ApiAddDirectCastKeysByAccount200Response,
  ApiAddDirectCastKeysByAccountRequestBody,
  ApiAddDirectCastUserKey200Response,
  ApiAddDirectCastUserKeyRequestBody,
  ApiAddDiscoveryApp200Response,
  ApiAddDiscoveryAppRequestBody,
  ApiAddDiscoveryFrame200Response,
  ApiAddDiscoveryFrameRequestBody,
  ApiAddFavoriteFeed200Response,
  ApiAddFavoriteFeedRequestBody,
  ApiAddFavoriteFrame200Response,
  ApiAddFavoriteFrameRequestBody,
  ApiAddFeaturedMint200Response,
  ApiAddFeaturedMintRequestBody,
  ApiAddMutedChannel200Response,
  ApiAddMutedChannelRequestBody,
  ApiAddMuteKeyword200Response,
  ApiAddMuteKeywordRequestBody,
  ApiAddTokenToWatchlist200Response,
  ApiAddTokenToWatchlistRequestBody,
  ApiAddUserUsername200Response,
  ApiAddUserUsernameRequestBody,
  ApiAdminAction200Response,
  ApiAdminActionRequestBody,
  ApiAdminAddChannelModerator200Response,
  ApiAdminAddChannelModeratorRequestBody,
  ApiAdminBlockSnapUrl200Response,
  ApiAdminBlockSnapUrlRequestBody,
  ApiAdminChangeChannelOwner200Response,
  ApiAdminChangeChannelOwnerRequestBody,
  ApiAdminListMiniAppPushNotificationConfigs200Response,
  ApiAdminMarkMiniAppHarmful200Response,
  ApiAdminMarkMiniAppHarmfulRequestBody,
  ApiAdminPutMiniAppPushNotificationConfig200Response,
  ApiAdminPutMiniAppPushNotificationConfigRequestBody,
  ApiAdminRemoveMiniAppHarmful200Response,
  ApiAdminRemoveMiniAppHarmfulRequestBody,
  ApiAdminUnblockSnapUrl200Response,
  ApiAdminUnblockSnapUrlRequestBody,
  ApiAdminUpdateChannelsAllThreads200Response,
  ApiAdminUpdateChannelsAllThreadsRequestBody,
  ApiAdminUpdateChannelThreads200Response,
  ApiAdminUpdateChannelThreadsRequestBody,
  ApiAllowSponsoredRegistration200Response,
  ApiAllowSponsoredRegistrationRequestBody,
  ApiAnalyticsMiniAppRequestDownload200Response,
  ApiAnalyticsMiniAppRequestDownloadRequestBody,
  ApiAnalyticsMiniAppRollup200Response,
  ApiAnalyticsMiniAppRollupRequestBody,
  ApiApproveRecovery200Response,
  ApiApproveRecoveryTransaction200Response,
  ApiApproveRecoveryTransactionRequestBody,
  ApiApproveSignedKeyRequest200Response,
  ApiApproveSignedKeyRequestRequestBody,
  ApiAssignQuestForUser200Response,
  ApiAssignQuestForUserRequestBody,
  ApiBanUserFromChannel200Response,
  ApiBanUserFromChannelRequestBody,
  ApiBidOnCastCollectible200Response,
  ApiBidOnCastCollectibleRequestBody,
  ApiBlockToken200Response,
  ApiBlockTokenRequestBody,
  ApiBookmarkCast200Response,
  ApiBookmarkCastRequestBody,
  ApiBoostCast200Response,
  ApiBoostCastRequestBody,
  ApiBuyWarpsCoinbaseCommerce200Response,
  ApiBuyWarpsCoinbaseCommerceInfo200Response,
  ApiBuyWarpsCoinbaseCommerceRequestBody,
  ApiCancelLimitOrder200Response,
  ApiCancelLimitOrderRequestBody,
  ApiCancelStageInviteAudioRoom200Response,
  ApiCancelStageInviteAudioRoomRequestBody,
  ApiClaimQuestReward200Response,
  ApiClaimQuestRewardRequestBody,
  ApiClaimReferral200Response,
  ApiClaimReferralCode200Response,
  ApiClaimReferralCodeRequestBody,
  ApiClaimReferralRequestBody,
  ApiClaimXPRewards200Response,
  ApiClearJobQueue200Response,
  ApiClearJobQueueRequestBody,
  ApiCompleteCampaign200Response,
  ApiCompleteCampaignRequestBody,
  ApiCompleteMagicLink200Response,
  ApiCompleteMagicLinkRequestBody,
  ApiCompleteNuxTask200Response,
  ApiCompleteNuxTaskRequestBody,
  ApiCompletePeerToPeerPayment200Response,
  ApiCompletePeerToPeerPaymentRequestBody,
  ApiCompletePhoneVerification200Response,
  ApiCompletePhoneVerificationRequestBody,
  ApiCompleteRegistration200Response,
  ApiCompleteRegistrationRequestBody,
  ApiConfirmAccountDeleteQueryParams,
  ApiConfirmTaxDocuments200Response,
  ApiConfirmTaxDocumentsRequestBody,
  ApiCreateApiKey200Response,
  ApiCreateApiKeyRequestBody,
  ApiCreateAudioRoom200Response,
  ApiCreateAudioRoomRequestBody,
  ApiCreateCast201Response,
  ApiCreateCastLike200Response,
  ApiCreateCastLikeRequestBody,
  ApiCreateCastRequestBody,
  ApiCreateCastTopics200Response,
  ApiCreateCastTopicsRequestBody,
  ApiCreateChannel200Response,
  ApiCreateChannelRequestBody,
  ApiCreateExternalUserSigner200Response,
  ApiCreateExternalUserSignerRequestBody,
  ApiCreateFeedFollow200Response,
  ApiCreateFeedFollowRequestBody,
  ApiCreateFollow200Response,
  ApiCreateFollowRequestBody,
  ApiCreateInvite200Response,
  ApiCreateInviteRequestBody,
  ApiCreateLimitOrder200Response,
  ApiCreateLimitOrderRequestBody,
  ApiCreateOnboarding200Response,
  ApiCreateOnboardingRequestBody,
  ApiCreatePoll200Response,
  ApiCreatePollRequestBody,
  ApiCreateRecast200Response,
  ApiCreateRecastRequestBody,
  ApiCreateRecovery200Response,
  ApiCreateRecoveryRequestBody,
  ApiCreateRemoteSiwfRequest200Response,
  ApiCreateRemoteSiwfRequestRequestBody,
  ApiCreateSignedAction200Response,
  ApiCreateSignedActionRequestBody,
  ApiCreateSignedKeyRequest200Response,
  ApiCreateSignedKeyRequestRequestBody,
  ApiCreateStarterPack200Response,
  ApiCreateStarterPackRequestBody,
  ApiCreateTokenSubscription200Response,
  ApiCreateTokenSubscriptionRequestBody,
  ApiCreateTotpSecret200Response,
  ApiCreateTraderSubscription200Response,
  ApiCreateTraderSubscriptionRequestBody,
  ApiCreateTrendingTopic200Response,
  ApiCreateTrendingTopicRequestBody,
  ApiCreateWalletLink200Response,
  ApiCreateWalletLinkRequestBody,
  ApiCreateWarpcastSignedKeyRequest200Response,
  ApiCreateWarpcastSponsoredInvite200Response,
  ApiCreatorRewardsFrameWebhook200Response,
  ApiDeactivateTokenSubscription200Response,
  ApiDeactivateTokenSubscriptionRequestBody,
  ApiDeclineStageInviteAudioRoom200Response,
  ApiDeclineStageInviteAudioRoomRequestBody,
  ApiDeleteAccountVerification200Response,
  ApiDeleteAccountVerificationRequestBody,
  ApiDeleteApiKey200Response,
  ApiDeleteApiKeyRequestBody,
  ApiDeleteAuthToken200Response,
  ApiDeleteCampaign200Response,
  ApiDeleteCampaignQueryParams,
  ApiDeleteCast200Response,
  ApiDeleteCastFromTrendingTopic200Response,
  ApiDeleteCastFromTrendingTopicRequestBody,
  ApiDeleteCastLike200Response,
  ApiDeleteCastLikeRequestBody,
  ApiDeleteCastRequestBody,
  ApiDeleteContacts200Response,
  ApiDeleteDirectCastConversationReactionsV3RequestBody,
  ApiDeleteDirectCastConversationReactionsV3200Response,
  ApiDeleteDirectCastKeysByInbox200Response,
  ApiDeleteDirectCastKeysByInboxQueryParams,
  ApiDeleteDirectCastMessage200Response,
  ApiDeleteDirectCastMessageRequestBody,
  ApiDeleteDiscoveryApp200Response,
  ApiDeleteDiscoveryAppRequestBody,
  ApiDeleteDiscoveryFrame200Response,
  ApiDeleteDiscoveryFrameRequestBody,
  ApiDeleteFeaturedMint200Response,
  ApiDeleteFeaturedMintRequestBody,
  ApiDeleteFeedFollow200Response,
  ApiDeleteFeedFollowRequestBody,
  ApiDeleteFollow200Response,
  ApiDeleteFollowRequestBody,
  ApiDeleteQuestsForUser200Response,
  ApiDeleteQuestsForUserRequestBody,
  ApiDeleteRecast200Response,
  ApiDeleteRecastRequestBody,
  ApiDeleteSnapAgentBuild200Response,
  ApiDeleteStarterPack200Response,
  ApiDeleteStarterPackRequestBody,
  ApiDeleteSyncChannel200Response,
  ApiDeleteSyncChannelQueryParams,
  ApiDeleteTokenSubscription200Response,
  ApiDeleteTokenSubscriptionRequestBody,
  ApiDeleteTraderSubscription200Response,
  ApiDeleteTraderSubscriptionRequestBody,
  ApiDeleteTrendingTopic200Response,
  ApiDeleteTrendingTopicRequestBody,
  ApiDeleteVerification200Response,
  ApiDeleteVerificationRequestBody,
  ApiDeleteWalletLink200Response,
  ApiDeleteWalletLinkRequestBody,
  ApiDenyRecoveryTransaction200Response,
  ApiDenyRecoveryTransactionRequestBody,
  ApiDevToolsAddDomainRole200Response,
  ApiDevToolsAddDomainRoleRequestBody,
  ApiDevToolsDebugDomainManifest200Response,
  ApiDevToolsDebugDomainManifestQueryParams,
  ApiDevToolsDecodeAccountAssociation200Response,
  ApiDevToolsDecodeAccountAssociationRequestBody,
  ApiDevToolsDeleteMiniAppManifest200Response,
  ApiDevToolsDeleteMiniAppManifestRequestBody,
  ApiDevToolsDomainRoles200Response,
  ApiDevToolsDomainRolesQueryParams,
  ApiDevToolsDomainsOwned200Response,
  ApiDevToolsDomainsOwnedQueryParams,
  ApiDevToolsExportMiniAppUserDataQueryParams,
  ApiDevToolsFarcasterJsonQueryParams,
  ApiDevToolsForceRefreshCastAttachments200Response,
  ApiDevToolsForceRefreshCastAttachmentsRequestBody,
  ApiDevToolsGetMiniAppManifest200Response,
  ApiDevToolsGetMiniAppManifestQueryParams,
  ApiDevToolsGetOpenGraphMetadata200Response,
  ApiDevToolsGetOpenGraphMetadataQueryParams,
  ApiDevToolsGetRegisteredAccountAssociation200Response,
  ApiDevToolsGetRegisteredAccountAssociationQueryParams,
  ApiDevToolsGetTempAccountAssociation200Response,
  ApiDevToolsGetTempAccountAssociationQueryParams,
  ApiDevToolsInspectImageUrl200Response,
  ApiDevToolsInspectImageUrlQueryParams,
  ApiDevToolsInspectMiniAppUrl200Response,
  ApiDevToolsInspectMiniAppUrlQueryParams,
  ApiDevToolsListMiniAppManifests200Response,
  ApiDevToolsListMiniAppManifestsQueryParams,
  ApiDevToolsManagedApps200Response,
  ApiDevToolsManagedAppsQueryParams,
  ApiDevToolsMetaTagsQueryParams,
  ApiDevToolsRefreshDomainManifest200Response,
  ApiDevToolsRefreshDomainManifestRequestBody,
  ApiDevToolsRefreshOpenGraphMetadata200Response,
  ApiDevToolsRefreshOpenGraphMetadataRequestBody,
  ApiDevToolsRegisterDomain200Response,
  ApiDevToolsRegisterDomainRequestBody,
  ApiDevToolsRemoveDomainRole200Response,
  ApiDevToolsRemoveDomainRoleRequestBody,
  ApiDevToolsStoreMiniAppManifest200Response,
  ApiDevToolsStoreMiniAppManifestRequestBody,
  ApiDevToolsStoreTempAccountAssociation200Response,
  ApiDevToolsStoreTempAccountAssociationRequestBody,
  ApiDevToolsUnregisterDomain200Response,
  ApiDevToolsUnregisterDomainRequestBody,
  ApiDevToolsUpdateMiniAppManifest200Response,
  ApiDevToolsUpdateMiniAppManifestRequestBody,
  ApiDisableChannelNotifications200Response,
  ApiDisableChannelNotificationsRequestBody,
  ApiDisableFrameNotifications200Response,
  ApiDisableFrameNotificationsRequestBody,
  ApiDisableLinkNotifications200Response,
  ApiDisableLinkNotificationsRequestBody,
  ApiDisableTotp200Response,
  ApiDiscardDraftCast200Response,
  ApiDiscardDraftCastRequestBody,
  ApiDiscoverApps200Response,
  ApiDiscoverAppsQueryParams,
  ApiDiscoverChannels200Response,
  ApiDiscoverChannelsQueryParams,
  ApiDiscoverFrames200Response,
  ApiDiscoverFramesQueryParams,
  ApiDismissNewUserFollowInstructions200Response,
  ApiDismissNewUserFollowsBanner200Response,
  ApiDismissNuxTask200Response,
  ApiDismissNuxTaskRequestBody,
  ApiDismissSuggestedUsers200Response,
  ApiDismissSuggestedUsersRequestBody,
  ApiDismissTips200Response,
  ApiDownvoteCast200Response,
  ApiDownvoteCastRequestBody,
  ApiEnableChannelNotifications200Response,
  ApiEnableChannelNotificationsRequestBody,
  ApiEnableFrameNotifications200Response,
  ApiEnableFrameNotificationsRequestBody,
  ApiEnableLinkNotifications200Response,
  ApiEnableLinkNotificationsRequestBody,
  ApiEndAudioRoom200Response,
  ApiEndAudioRoomRequestBody,
  ApiExecuteOnchainTx200Response,
  ApiExecuteOnchainTxRequestBody,
  ApiExecuteWarpsTrade200Response,
  ApiExploreCastCollectibles200Response,
  ApiFarcasterProIsEligibleForLimitedEditionNft200Response,
  ApiFarcasterProIsEligibleForLimitedEditionNftQueryParams,
  ApiFarcasterProSubscribeWithUsdc200Response,
  ApiFarcasterProSubscribeWithUsdcDetails200Response,
  ApiFarcasterProSubscribeWithUsdcDetailsQueryParams,
  ApiFarcasterProSubscribeWithUsdcRequestBody,
  ApiFarcasterProSubscribeWithUsdcStatus200Response,
  ApiFarcasterProSubscribeWithUsdcStatusQueryParams,
  ApiFarcasterProSubscribeWithWarps200Response,
  ApiFarcasterProSubscribeWithWarpsDetails200Response,
  ApiFarcasterProSubscribeWithWarpsDetailsQueryParams,
  ApiFarcasterProSubscribeWithWarpsRequestBody,
  ApiFcBanUserFromChannel200Response,
  ApiFcBanUserFromChannelRequestBody,
  ApiFcBlockUser200Response,
  ApiFcBlockUserRequestBody,
  ApiFcDeleteGroupMembers200Response,
  ApiFcDeleteGroupMembersRequestBody,
  ApiFcDeleteMessage200Response,
  ApiFcDeleteMessageRequestBody,
  ApiFcFollowChannel200Response,
  ApiFcFollowChannelRequestBody,
  ApiFcGetAccountVerifications200Response,
  ApiFcGetAccountVerificationsQueryParams,
  ApiFcGetBlockedUsers200Response,
  ApiFcGetBlockedUsersQueryParams,
  ApiFcGetChannelBannedUsers200Response,
  ApiFcGetChannelBannedUsersQueryParams,
  ApiFcGetChannelEvents200Response,
  ApiFcGetChannelEventsQueryParams,
  ApiFcGetChannelInvites200Response,
  ApiFcGetChannelInvitesQueryParams,
  ApiFcGetChannelMembers200Response,
  ApiFcGetChannelMembersQueryParams,
  ApiFcGetChannelRestrictedUsers200Response,
  ApiFcGetChannelRestrictedUsersQueryParams,
  ApiFcGetConversation200Response,
  ApiFcGetConversationList200Response,
  ApiFcGetConversationListQueryParams,
  ApiFcGetConversationQueryParams,
  ApiFcGetGroup200Response,
  ApiFcGetGroupInvites200Response,
  ApiFcGetGroupInvitesQueryParams,
  ApiFcGetGroupList200Response,
  ApiFcGetGroupListQueryParams,
  ApiFcGetGroupMembers200Response,
  ApiFcGetGroupMembersQueryParams,
  ApiFcGetGroupQueryParams,
  ApiFcGetMessage200Response,
  ApiFcGetMessageList200Response,
  ApiFcGetMessageListQueryParams,
  ApiFcGetMessageQueryParams,
  ApiFcGetModeratedCasts200Response,
  ApiFcGetModeratedCastsQueryParams,
  ApiFcGetPrimaryAddressEvents200Response,
  ApiFcGetPrimaryAddressEventsQueryParams,
  ApiFcGetStarterPackUsers200Response,
  ApiFcGetStarterPackUsersQueryParams,
  ApiFcInviteUserToChannelRole200Response,
  ApiFcInviteUserToChannelRoleRequestBody,
  ApiFcModerateCast200Response,
  ApiFcModerateCastRequestBody,
  ApiFcPinCast200Response,
  ApiFcPinCastRequestBody,
  ApiFcPostConversation200Response,
  ApiFcPostConversationRequestBody,
  ApiFcPostGroup200Response,
  ApiFcPostGroupMembers200Response,
  ApiFcPostGroupMembersRequestBody,
  ApiFcPostGroupRequestBody,
  ApiFcPostMarkConversationAsRead200Response,
  ApiFcPostMarkConversationAsReadRequestBody,
  ApiFcPostMarkMentionsAsRead200Response,
  ApiFcPutConversation200Response,
  ApiFcPutConversationRequestBody,
  ApiFcPutGroup200Response,
  ApiFcPutGroupInvites200Response,
  ApiFcPutGroupInvitesRequestBody,
  ApiFcPutGroupRequestBody,
  ApiFcPutMessage200Response,
  ApiFcPutMessageRequestBody,
  ApiFcRemoveUserFromChannelRole200Response,
  ApiFcRemoveUserFromChannelRoleRequestBody,
  ApiFcRespondToChannelRoleInvite200Response,
  ApiFcRespondToChannelRoleInviteRequestBody,
  ApiFcUnbanUserFromChannel200Response,
  ApiFcUnbanUserFromChannelRequestBody,
  ApiFcUnblockUser200Response,
  ApiFcUnblockUserRequestBody,
  ApiFcUnfollowChannel200Response,
  ApiFcUnfollowChannelRequestBody,
  ApiFcUnpinCast200Response,
  ApiFcUnpinCastRequestBody,
  ApiFeaturedMintFrameWebhook200Response,
  ApiFindLocation200Response,
  ApiFindLocationQueryParams,
  ApiFinishInAppPurchase200Response,
  ApiFinishInAppPurchaseRequestBody,
  ApiFinishInAppPurchaseWithCustody200Response,
  ApiFinishInAppPurchaseWithCustodyRequestBody,
  ApiFollowAllStarterPackUsers200Response,
  ApiFollowAllStarterPackUsersRequestBody,
  ApiFollowAllTwitterFollowing200Response,
  ApiGenerateCastShareableImageQueryParams,
  ApiGenerateChannelImageQueryParams,
  ApiGenerateCoinbaseCommerceHostedUiUrl200Response,
  ApiGenerateCoinbaseCommerceHostedUiUrlRequestBody,
  ApiGenerateExternalUserSignerHash200Response,
  ApiGenerateExternalUserSignerHashRequestBody,
  ApiGenerateImageUploadUrl201Response,
  ApiGenerateInviteOpenGraphImageQueryParams,
  ApiGenerateOpenGraphImageQueryParams,
  ApiGenerateRegistrationHashes200Response,
  ApiGenerateRegistrationHashesRequestBody,
  ApiGenerateTotpToken200Response,
  ApiGenerateTotpTokenForEmail200Response,
  ApiGenerateTotpTokenForEmailRequestBody,
  ApiGenerateTotpTokenRequestBody,
  ApiGetAccountVerifications200Response,
  ApiGetAccountVerificationsV2200Response,
  ApiGetActiveChannelStreak200Response,
  ApiGetActiveChannelStreakQueryParams,
  ApiGetActiveSubscription200Response,
  ApiGetActiveSubscriptionQueryParams,
  ApiGetAdminFeed200Response,
  ApiGetAdminFeedQueryParams,
  ApiGetAllChannelsPublic200Response,
  ApiGetAllRecentCasts200Response,
  ApiGetAllRecentCastsQueryParams,
  ApiGetAllStarterPacks200Response,
  ApiGetAllStarterPacksQueryParams,
  ApiGetAMA200Response,
  ApiGetAMAQueryParams,
  ApiGetApiKeys200Response,
  ApiGetAppBlockedUsers200Response,
  ApiGetAppLauncher200Response,
  ApiGetAppLauncherQueryParams,
  ApiGetAppsByAuthor200Response,
  ApiGetAppsByAuthorQueryParams,
  ApiGetAppsByCategory200Response,
  ApiGetAppsByCategoryQueryParams,
  ApiGetArticle200Response,
  ApiGetArticleQueryParams,
  ApiGetAudioRoom200Response,
  ApiGetAudioRoomChat200Response,
  ApiGetAudioRoomChatQueryParams,
  ApiGetAudioRoomQueryParams,
  ApiGetAuthenticatedUser200Response,
  ApiGetAuthenticatedUserEmail200Response,
  ApiGetAuthSessions200Response,
  ApiGetBlockedUsers200Response,
  ApiGetBlockedUsersQueryParams,
  ApiGetBookmarkedCasts200Response,
  ApiGetBookmarkedCastsQueryParams,
  ApiGetCampaign200Response,
  ApiGetCampaignQueryParams,
  ApiGetCastCollectible200Response,
  ApiGetCastCollectibleArtifactQueryParams,
  ApiGetCastCollectibleBackgroundImageQueryParams,
  ApiGetCastCollectibleBidHistory200Response,
  ApiGetCastCollectibleBidHistoryQueryParams,
  ApiGetCastCollectibleImageQueryParams,
  ApiGetCastCollectibleQueryParams,
  ApiGetCastCollectibles200Response,
  ApiGetCastCollectiblesIndex200Response,
  ApiGetCastCollectiblesIndexQueryParams,
  ApiGetCastCollectiblesMetadataQueryParams,
  ApiGetCastCollectiblesRequestBody,
  ApiGetCastCollectibleThumbnailQueryParams,
  ApiGetCastLikes200Response,
  ApiGetCastLikesQueryParams,
  ApiGetCastQuotes200Response,
  ApiGetCastQuotesQueryParams,
  ApiGetCastReactions200Response,
  ApiGetCastReactionsQueryParams,
  ApiGetCastRecasters200Response,
  ApiGetCastRecastersQueryParams,
  ApiGetChannel200Response,
  ApiGetChannelBannedUsers200Response,
  ApiGetChannelBannedUsersQueryParams,
  ApiGetChannelCreationInfo200Response,
  ApiGetChannelDetails200Response,
  ApiGetChannelDetailsQueryParams,
  ApiGetChannelFollowers200Response,
  ApiGetChannelFollowersPublic200Response,
  ApiGetChannelFollowersPublicQueryParams,
  ApiGetChannelFollowersQueryParams,
  ApiGetChannelFollowersYouKnow200Response,
  ApiGetChannelFollowersYouKnowQueryParams,
  ApiGetChannelHosts200Response,
  ApiGetChannelHostsQueryParams,
  ApiGetChannelPublic200Response,
  ApiGetChannelPublicQueryParams,
  ApiGetChannelQueryParams,
  ApiGetChannelRecsForCast200Response,
  ApiGetChannelRecsForCastQueryParams,
  ApiGetChannelSettings200Response,
  ApiGetChannelSettingsQueryParams,
  ApiGetChannelTopCasters200Response,
  ApiGetChannelTopCastersQueryParams,
  ApiGetChannelUsers200Response,
  ApiGetChannelUsersForInvite200Response,
  ApiGetChannelUsersForInviteQueryParams,
  ApiGetChannelUsersForManagement200Response,
  ApiGetChannelUsersForManagementQueryParams,
  ApiGetChannelUsersQueryParams,
  ApiGetClaimedReferralCode200Response,
  ApiGetClientConfig200Response,
  ApiGetCoinbaseOnrampLimit200Response,
  ApiGetCoinbaseOnrampLimitQueryParams,
  ApiGetConnectedAccounts200Response,
  ApiGetConnectedAccountsQueryParams,
  ApiGetConnectedApp200Response,
  ApiGetConnectedAppQueryParams,
  ApiGetConnectedApps200Response,
  ApiGetConnectedAppsQueryParams,
  ApiGetContactsUsers200Response,
  ApiGetContactsUsersQueryParams,
  ApiGetConversationCastReplies200Response,
  ApiGetConversationCastRepliesObsolete200Response,
  ApiGetConversationCastRepliesObsoleteQueryParams,
  ApiGetConversationCastRepliesQueryParams,
  ApiGetCreatorRewardsEarningsHistory200Response,
  ApiGetCreatorRewardsEarningsHistoryQueryParams,
  ApiGetCreatorRewardsForUser200Response,
  ApiGetCreatorRewardsForUserQueryParams,
  ApiGetCreatorRewardsLeaderboard200Response,
  ApiGetCreatorRewardsLeaderboardQueryParams,
  ApiGetCreatorRewardsMetadata200Response,
  ApiGetCreatorRewardsPayoutEligibilityForUser200Response,
  ApiGetCreatorRewardsPayoutEligibilityForUserQueryParams,
  ApiGetCreatorRewardsPeriodSummary200Response,
  ApiGetCreatorRewardsPeriodSummaryQueryParams,
  ApiGetCreatorRewardsWinnerHistory200Response,
  ApiGetCreatorRewardsWinnerHistoryQueryParams,
  ApiGetCrossmintEligible200Response,
  ApiGetCrossmintEligibleQueryParams,
  ApiGetCustodyAddress200Response,
  ApiGetCustodyAddressQueryParams,
  ApiGetDCAuthToken200Response,
  ApiGetDCAuthTokenQueryParams,
  ApiGetDCNonce200Response,
  ApiGetDefiLinksShim200Response,
  ApiGetDirectCastConversation200Response,
  ApiGetDirectCastConversationMessages200Response,
  ApiGetDirectCastConversationMessagesQueryParams,
  ApiGetDirectCastConversationQueryParams,
  ApiGetDirectCastConversationReactionsV3QueryParams,
  ApiGetDirectCastConversationReactionsV3200Response,
  ApiGetDirectCastConversationRecentMessages200Response,
  ApiGetDirectCastConversationRecentMessagesQueryParams,
  ApiGetDirectCastConversationsV3QueryParams,
  ApiGetDirectCastConversationsV3200Response,
  ApiGetDirectCastConversationV3QueryParams,
  ApiGetDirectCastConversationV3200Response,
  ApiGetDirectCastGroupInvites200Response,
  ApiGetDirectCastGroupInvitesQueryParams,
  ApiGetDirectCastGroupInviteV3QueryParams,
  ApiGetDirectCastGroupInviteV3200Response,
  ApiGetDirectCastInbox200Response,
  ApiGetDirectCastInboxQueryParams,
  ApiGetDirectCastKeys200Response,
  ApiGetDirectCastKeysByAccount200Response,
  ApiGetDirectCastKeysByAccountQueryParams,
  ApiGetDirectCastKeysQueryParams,
  ApiGetDirectCastTTLs200Response,
  ApiGetDirectCastUsers200Response,
  ApiGetDirectCastUsersQueryParams,
  ApiGetDiscordAuthLink200Response,
  ApiGetDiscoveryApp200Response,
  ApiGetDiscoveryAppQueryParams,
  ApiGetDiscoveryFrame200Response,
  ApiGetDiscoveryFrameQueryParams,
  ApiGetDomainManifestState200Response,
  ApiGetDomainManifestStateQueryParams,
  ApiGetDraftCasts200Response,
  ApiGetDraftCastsQueryParams,
  ApiGetDraftCaststorms200Response,
  ApiGetDraftCaststormsQueryParams,
  ApiGetDynamicConfigs200Response,
  ApiGetEngagementRingCandidates200Response,
  ApiGetEngagementRingCandidatesQueryParams,
  ApiGetExploreFeed200Response,
  ApiGetFarcasterEarnings200Response,
  ApiGetFarcasterEarningsQueryParams,
  ApiGetFarcasterTipsStatus200Response,
  ApiGetFavoriteFrames200Response,
  ApiGetFavoriteFramesQueryParams,
  ApiGetFeaturedHeroApps200Response,
  ApiGetFeaturedHeroAppsQueryParams,
  ApiGetFeaturedMint200Response,
  ApiGetFeaturedMintQueryParams,
  ApiGetFeaturedMintTransaction200Response,
  ApiGetFeaturedMintTransactionQueryParams,
  ApiGetFeedItems200Response,
  ApiGetFeedItemsRequestBody,
  ApiGetFeedSummaries200Response,
  ApiGetFname200Response,
  ApiGetFnameQueryParams,
  ApiGetFollowedUsersAffinityScore200Response,
  ApiGetFollowedUsersAffinityScoreQueryParams,
  ApiGetFollowers200Response,
  ApiGetFollowersQueryParams,
  ApiGetFollowersYouKnow200Response,
  ApiGetFollowersYouKnowQueryParams,
  ApiGetFollowing200Response,
  ApiGetFollowingQueryParams,
  ApiGetFrameBlocklist200Response,
  ApiGetFrameDetails200Response,
  ApiGetFrameDetailsQueryParams,
  ApiGetGaslessStatus200Response,
  ApiGetGaslessStatusQueryParams,
  ApiGetGitHubAuthLink200Response,
  ApiGetGlobalFrameAnalytics200Response,
  ApiGetGlobalFrameAnalyticsQueryParams,
  ApiGetHealth200Response,
  ApiGetHighlightedChannels200Response,
  ApiGetHomeFeedGenerationHistory200Response,
  ApiGetHomeFeedGenerationHistoryQueryParams,
  ApiGetInvite200Response,
  ApiGetInviteQueryParams,
  ApiGetInvitersLeaderboard200Response,
  ApiGetInvitesAvailable200Response,
  ApiGetInvitesViewed200Response,
  ApiGetInviteWithWarpsOffering200Response,
  ApiGetIpInfo200Response,
  ApiGetIsUserInvited200Response,
  ApiGetIsUserInvitedQueryParams,
  ApiGetKeyTransaction200Response,
  ApiGetKeyTransactionQueryParams,
  ApiGetLeastInteractedWithFollowing200Response,
  ApiGetLeastInteractedWithFollowingQueryParams,
  ApiGetLimitOrderById200Response,
  ApiGetLimitOrderFills200Response,
  ApiGetLimitOrderFillsQueryParams,
  ApiGetLimitOrders200Response,
  ApiGetLimitOrdersQueryParams,
  ApiGetLinkedInAuthLink200Response,
  ApiGetMiniAppHomeEmbed200Response,
  ApiGetMiniAppHomeEmbedQueryParams,
  ApiGetMorphoFarcasterVault200Response,
  ApiGetMutedChannels200Response,
  ApiGetMutedKeyword200Response,
  ApiGetMutedKeywordQueryParams,
  ApiGetMutedKeywords200Response,
  ApiGetMutedUsers200Response,
  ApiGetMutedUsersQueryParams,
  ApiGetNewFrames200Response,
  ApiGetNewFramesQueryParams,
  ApiGetNews200Response,
  ApiGetNewsQueryParams,
  ApiGetNextNuxTask200Response,
  ApiGetNotificationActorsInGroup200Response,
  ApiGetNotificationActorsInGroupQueryParams,
  ApiGetNotificationGroupsAdmin200Response,
  ApiGetNotificationGroupsAdminQueryParams,
  ApiGetNotificationsForTab200Response,
  ApiGetNotificationsForTabQueryParams,
  ApiGetNotificationsInGroup200Response,
  ApiGetNotificationsInGroupQueryParams,
  ApiGetOffering200Response,
  ApiGetOfferingQueryParams,
  ApiGetOgFeedItems200Response,
  ApiGetOgFeedItemsQueryParams,
  ApiGetOnboardingInterestCategories200Response,
  ApiGetOnboardingInterestCategoriesQueryParams,
  ApiGetOnboardingInterests200Response,
  ApiGetOnboardingInterestsQueryParams,
  ApiGetOnboardingState200Response,
  ApiGetOnboardingStateAndAuthToken200Response,
  ApiGetOnboardingStateAndAuthTokenRequestBody,
  ApiGetOnchainAction200Response,
  ApiGetOnchainActionQueryParams,
  ApiGetOnchainSwapFeeUsdValue200Response,
  ApiGetOnchainSwapFeeUsdValueQueryParams,
  ApiGetOnchainSwapQuote200Response,
  ApiGetOnchainSwapQuoteRequestBody,
  ApiGetOnchainToken200Response,
  ApiGetOnchainTokenCandlestickChart200Response,
  ApiGetOnchainTokenCandlestickChartQueryParams,
  ApiGetOnchainTokenLineChart200Response,
  ApiGetOnchainTokenLineChartQueryParams,
  ApiGetOnchainTokenQueryParams,
  ApiGetOnchainYieldDeposit200Response,
  ApiGetOnchainYieldDepositQueryParams,
  ApiGetOnchainYieldOverview200Response,
  ApiGetOnchainYieldOverviewQueryParams,
  ApiGetOnchainYieldWithdraw200Response,
  ApiGetOnchainYieldWithdrawQueryParams,
  ApiGetOrCreateReferralCode200Response,
  ApiGetPendingAdminReviews200Response,
  ApiGetPendingAdminReviewsQueryParams,
  ApiGetPhoneVerificationStatus200Response,
  ApiGetPollResults200Response,
  ApiGetPollResultsQueryParams,
  ApiGetPredictionEvents200Response,
  ApiGetPredictionEventsQueryParams,
  ApiGetPredictionMarket200Response,
  ApiGetPredictionMarketQueryParams,
  ApiGetPredictionPositions200Response,
  ApiGetPredictionPositionsQueryParams,
  ApiGetPredictionPriceHistory200Response,
  ApiGetPredictionPriceHistoryEvent200Response,
  ApiGetPredictionPriceHistoryEventQueryParams,
  ApiGetPredictionPriceHistoryMarket200Response,
  ApiGetPredictionPriceHistoryMarketQueryParams,
  ApiGetPredictionPriceHistoryQueryParams,
  ApiGetPrimaryAddress200Response,
  ApiGetPrimaryAddressQueryParams,
  ApiGetProductCatalog200Response,
  ApiGetProductLaunchCasts200Response,
  ApiGetProductLaunchCastsQueryParams,
  ApiGetProfileSnapCasts200Response,
  ApiGetProfileSnapCastsQueryParams,
  ApiGetPublicDeveloperRewardsWinnerHistory200Response,
  ApiGetPublicDeveloperRewardsWinnerHistoryQueryParams,
  ApiGetQuest200Response,
  ApiGetQuestQueryParams,
  ApiGetQuests200Response,
  ApiGetRecentlyLaunchedFrames200Response,
  ApiGetRecentlyLaunchedFramesQueryParams,
  ApiGetRecentlyUsedApps200Response,
  ApiGetRecentlyUsedAppsByUserAffinity200Response,
  ApiGetRecentlyUsedAppsByUserAffinityQueryParams,
  ApiGetRecentlyUsedAppsQueryParams,
  ApiGetRecommendedTraders200Response,
  ApiGetRecoverHash200Response,
  ApiGetRecoverHashQueryParams,
  ApiGetRecovery200Response,
  ApiGetRecoveryAddress200Response,
  ApiGetRecoveryAddressChange200Response,
  ApiGetRecoveryAddressChangeHash200Response,
  ApiGetRecoveryAddressChangeHashQueryParams,
  ApiGetRecoveryAddressChangeQueryParams,
  ApiGetRecoveryQueryParams,
  ApiGetReferralCodeByUsername200Response,
  ApiGetReferralCodeByUsernameQueryParams,
  ApiGetReferralCodeCount200Response,
  ApiGetReferralCodeInfo200Response,
  ApiGetReferralCodeInfoRequestBody,
  ApiGetReferralCodeJoinInfo200Response,
  ApiGetReferralCodeJoinInfoRequestBody,
  ApiGetReferrals200Response,
  ApiGetReferralsQueryParams,
  ApiGetRemoteSiwfRequest200Response,
  ApiGetRemoteSiwfRequestQueryParams,
  ApiGetRentStorageOfferings200Response,
  ApiGetReportedTokens200Response,
  ApiGetReportedTokensQueryParams,
  ApiGetRewardsEarningsHistory200Response,
  ApiGetRewardsEarningsHistoryQueryParams,
  ApiGetRewardsLeaderboard200Response,
  ApiGetRewardsLeaderboardQueryParams,
  ApiGetRewardsMetadata200Response,
  ApiGetRewardsMetadataQueryParams,
  ApiGetRewardsPayoutEligibility200Response,
  ApiGetRewardsPeriodSummary200Response,
  ApiGetRewardsPeriodSummaryQueryParams,
  ApiGetRewardsScoresForUser200Response,
  ApiGetRewardsScoresForUserQueryParams,
  ApiGetRewardsWinnerHistory200Response,
  ApiGetRewardsWinnerHistoryQueryParams,
  ApiGetSavedDeferredDeepLink200Response,
  ApiGetSavedDeferredDeepLinkRequestBody,
  ApiGetSignedKeyRequest200Response,
  ApiGetSignedKeyRequestQueryParams,
  ApiGetSigner200Response,
  ApiGetSignerQueryParams,
  ApiGetSignerRemoveHash200Response,
  ApiGetSignerRemoveHashQueryParams,
  ApiGetSigners200Response,
  ApiGetSignersQueryParams,
  ApiGetSiweNonce200Response,
  ApiGetSnapAgentBuildAssets200Response,
  ApiGetSnapAgentBuildConversation200Response,
  ApiGetSnapAgentBuildKv200Response,
  ApiGetSnapAgentBuildKvQueryParams,
  ApiGetSnapAgentBuilds200Response,
  ApiGetSnapAgentBuildSource200Response,
  ApiGetSnapAgentBuildsQueryParams,
  ApiGetSnapBlocklist200Response,
  ApiGetStarterPack200Response,
  ApiGetStarterPackFeed200Response,
  ApiGetStarterPackFeedQueryParams,
  ApiGetStarterPackQueryParams,
  ApiGetStarterPacks200Response,
  ApiGetStarterPacksQueryParams,
  ApiGetStarterPackUsers200Response,
  ApiGetStarterPackUsersQueryParams,
  ApiGetStepUpMessage200Response,
  ApiGetStorageUtilization200Response,
  ApiGetSuggestedStarterPacks200Response,
  ApiGetSuggestedStarterPacksQueryParams,
  ApiGetSuggestedTips200Response,
  ApiGetSuggestedTipsQueryParams,
  ApiGetSuggestedUsers200Response,
  ApiGetSuggestedUsersQueryParams,
  ApiGetSuggestedUsersToFollow200Response,
  ApiGetSuggestedUsersToFollowQueryParams,
  ApiGetSwapGaslessTokens200Response,
  ApiGetSwapGaslessTokensQueryParams,
  ApiGetSwapQuoteForGasSwap200Response,
  ApiGetSwapQuoteForGasSwapQueryParams,
  ApiGetSyncChannel200Response,
  ApiGetSyncChannelQueryParams,
  ApiGetThread200Response,
  ApiGetThreadQueryParams,
  ApiGetTipsWeekSummary200Response,
  ApiGetToken200Response,
  ApiGetTokenChart200Response,
  ApiGetTokenChartQueryParams,
  ApiGetTokenEmbedFeed200Response,
  ApiGetTokenEmbedFeedQueryParams,
  ApiGetTokenHolders200Response,
  ApiGetTokenHoldersQueryParams,
  ApiGetTokenLinks200Response,
  ApiGetTokenLinksQueryParams,
  ApiGetTokenPnl200Response,
  ApiGetTokenPnlQueryParams,
  ApiGetTokenQueryParams,
  ApiGetTokenReports200Response,
  ApiGetTokenReportsQueryParams,
  ApiGetTokenReportsSummary200Response,
  ApiGetTokenReportsSummaryQueryParams,
  ApiGetTokens200Response,
  ApiGetTokensInWatchlist200Response,
  ApiGetTokensInWatchlistQueryParams,
  ApiGetTokensQueryParams,
  ApiGetTokenSubscriptions200Response,
  ApiGetTokenWalletContext200Response,
  ApiGetTokenWalletContextQueryParams,
  ApiGetTopFrames200Response,
  ApiGetTopFramesQueryParams,
  ApiGetTopMiniApps200Response,
  ApiGetTopMiniAppsQueryParams,
  ApiGetTotpEnabled200Response,
  ApiGetTotpEnabledForEmail200Response,
  ApiGetTotpEnabledForEmailQueryParams,
  ApiGetTraderSubscriptions200Response,
  ApiGetTrendingTokens200Response,
  ApiGetTrendingTokensQueryParams,
  ApiGetTrendingTopicCasts200Response,
  ApiGetTrendingTopicCastsQueryParams,
  ApiGetTrendingTopics200Response,
  ApiGetTrendingTopicsForAdmin200Response,
  ApiGetTwitterFollowing200Response,
  ApiGetTwitterFollowingQueryParams,
  ApiGetUnseen200Response,
  ApiGetUser200Response,
  ApiGetUserAppContext200Response,
  ApiGetUserAuthAddress200Response,
  ApiGetUserByFID200Response,
  ApiGetUserByFIDForOG200Response,
  ApiGetUserByFIDForOGQueryParams,
  ApiGetUserByFIDQueryParams,
  ApiGetUserByUsername200Response,
  ApiGetUserByUsernameForOG200Response,
  ApiGetUserByUsernameForOGQueryParams,
  ApiGetUserByUsernameQueryParams,
  ApiGetUserByVerification200Response,
  ApiGetUserByVerificationQueryParams,
  ApiGetUserCast200Response,
  ApiGetUserCastableChannels200Response,
  ApiGetUserCastableChannelsQueryParams,
  ApiGetUserCastCollectibles200Response,
  ApiGetUserCastCollectiblesQueryParams,
  ApiGetUserCastQueryParams,
  ApiGetUserCasts200Response,
  ApiGetUserCastsAndReplies200Response,
  ApiGetUserCastsAndRepliesQueryParams,
  ApiGetUserCastsQueryParams,
  ApiGetUserChannelPublic200Response,
  ApiGetUserChannelPublicQueryParams,
  ApiGetUserChannels200Response,
  ApiGetUserChannelsQueryParams,
  ApiGetUserConnectedAddresses200Response,
  ApiGetUserConnectedAddressesQueryParams,
  ApiGetUserFollowingChannelsPublic200Response,
  ApiGetUserFollowingChannelsPublicQueryParams,
  ApiGetUserLikedCasts200Response,
  ApiGetUserLikedCastsQueryParams,
  ApiGetUserPreferences200Response,
  ApiGetUserQueryParams,
  ApiGetUsersByLocation200Response,
  ApiGetUsersByLocationQueryParams,
  ApiGetUsersForQualityAnnotation200Response,
  ApiGetUsersForQualityAnnotationQueryParams,
  ApiGetUserThreadCasts200Response,
  ApiGetUserThreadCastsQueryParams,
  ApiGetUserThreadHiddenReplies200Response,
  ApiGetUserThreadHiddenRepliesQueryParams,
  ApiGetUserTopCasts200Response,
  ApiGetUserTopCastsQueryParams,
  ApiGetUserUsernames200Response,
  ApiGetUserViewedCasts200Response,
  ApiGetUserViewedCastsQueryParams,
  ApiGetVerifications200Response,
  ApiGetVerificationsQueryParams,
  ApiGetVideoState200Response,
  ApiGetVideoStateQueryParams,
  ApiGetWalletActivity200Response,
  ApiGetWalletActivityQueryParams,
  ApiGetWalletChainNativeAsset200Response,
  ApiGetWalletChainNativeAssetQueryParams,
  ApiGetWalletLinks200Response,
  ApiGetWalletLinksQueryParams,
  ApiGetWalletNfts200Response,
  ApiGetWalletNftsQueryParams,
  ApiGetWalletPositions200Response,
  ApiGetWalletPositionsClosed200Response,
  ApiGetWalletPositionsClosedQueryParams,
  ApiGetWalletPositionsOpen200Response,
  ApiGetWalletPositionsOpenQueryParams,
  ApiGetWalletPositionsQueryParams,
  ApiGetWarpcastSponsoredInvites200Response,
  ApiGetWarpsBalance200Response,
  ApiGetWarpsBalanceQueryParams,
  ApiGetWarpsOffering200Response,
  ApiGetWarpsOfferingQueryParams,
  ApiGetWarpsTradeStatus200Response,
  ApiGetWarpTransactions200Response,
  ApiGetWarpTransactionsQueryParams,
  ApiGetXAuthLink200Response,
  ApiGetXPRewards200Response,
  ApiGetXPRewardsQueryParams,
  ApiGiveMiniAppWebhook200Response,
  ApiGlobalSearchForMessages200Response,
  ApiGlobalSearchForMessagesQueryParams,
  ApiHandleCoinbaseCommerceCallback200Response,
  ApiHeartbeatAudioRoom200Response,
  ApiHeartbeatAudioRoomRequestBody,
  ApiHideToken200Response,
  ApiHideTokenRequestBody,
  ApiIngestNotificationFeedback200Response,
  ApiIngestNotificationFeedbackRequestBody,
  ApiInitiateMagicLink200Response,
  ApiInitiateMagicLinkDirect200Response,
  ApiInitiateMagicLinkRequestBody,
  ApiInitiateRecovery200Response,
  ApiInitiateRecoveryRequestBody,
  ApiInsertFeaturedApp200Response,
  ApiInsertFeaturedAppRequestBody,
  ApiInsertHiddenFeaturedApp200Response,
  ApiInsertHiddenFeaturedAppRequestBody,
  ApiInviteChannelUserToRole200Response,
  ApiInviteChannelUserToRoleRequestBody,
  ApiIsInReferralCodePromo200Response,
  ApiJoinAudioRoom200Response,
  ApiJoinAudioRoomRequestBody,
  ApiJoinChannelViaCode200Response,
  ApiJoinChannelViaCodeRequestBody,
  ApiLeaveAudioRoom200Response,
  ApiLeaveAudioRoomRequestBody,
  ApiLimitVisibility200Response,
  ApiLimitVisibilityRequestBody,
  ApiListAudioRoomParticipants200Response,
  ApiListAudioRoomParticipantsQueryParams,
  ApiListEmbeddedWallets200Response,
  ApiListEmbeddedWalletsQueryParams,
  ApiListHiddenFeaturedApps200Response,
  ApiListLiveAudioRooms200Response,
  ApiListLiveAudioRoomsQueryParams,
  ApiListScheduledAudioRooms200Response,
  ApiListScheduledAudioRoomsQueryParams,
  ApiLivekitWebhook200Response,
  ApiLookupOnboardingState200Response,
  ApiLookupOnboardingStateQueryParams,
  ApiManuallyMarkConversationUnread200Response,
  ApiManuallyMarkConversationUnreadRequestBody,
  ApiMarkAllNotificationsRead200Response,
  ApiMarkAllTabNotificationsSeen200Response,
  ApiMarkAllTabNotificationsSeenRequestBody,
  ApiMarkAllWarpTransactionsRead200Response,
  ApiMarkDirectCastKeyAsDead200Response,
  ApiMarkDirectCastKeyAsDeadRequestBody,
  ApiMarkNudgedForInterests200Response,
  ApiMarkNudgedForPushNotifications200Response,
  ApiMarkPromptedFor200Response,
  ApiMarkPromptedForRequestBody,
  ApiMarkSyncChannelMessageRead200Response,
  ApiMarkSyncChannelMessageReadRequestBody,
  ApiMarkVerificationsStart200Response,
  ApiModerateParticipantRoleAudioRoom200Response,
  ApiModerateParticipantRoleAudioRoomRequestBody,
  ApiNotifyUsersAboutCampaign200Response,
  ApiNotifyUsersAboutCampaignRequestBody,
  ApiPayWarpsAndConnectApp200Response,
  ApiPayWarpsAndConnectAppRequestBody,
  ApiPayWarpsAndDisconnectApp200Response,
  ApiPayWarpsAndDisconnectAppRequestBody,
  ApiPinCastOnUserProfile200Response,
  ApiPinCastOnUserProfileRequestBody,
  ApiPinDirectCastConversation200Response,
  ApiPinDirectCastConversationRequestBody,
  ApiPinDirectCastMessage200Response,
  ApiPinDirectCastMessageRequestBody,
  ApiPostDirectCastAcceptGroupInviteV3RequestBody,
  ApiPostDirectCastAcceptGroupInviteV3200Response,
  ApiPostDirectCastConversationCategorizationBulkV3RequestBody,
  ApiPostDirectCastConversationCategorizationBulkV3200Response,
  ApiPostDirectCastConversationCategorizationV3RequestBody,
  ApiPostDirectCastConversationCategorizationV3200Response,
  ApiPostDirectCastConversationMessageTTL200Response,
  ApiPostDirectCastConversationMessageTTLRequestBody,
  ApiPostDirectCastConversationNotificationsV3RequestBody,
  ApiPostDirectCastConversationNotificationsV3200Response,
  ApiPostDirectCastDeclineGroupInviteV3RequestBody,
  ApiPostDirectCastDeclineGroupInviteV3200Response,
  ApiPostDirectCastGroupMembershipV3RequestBody,
  ApiPostDirectCastGroupMembershipV3200Response,
  ApiPostDirectCastGroupNameV3RequestBody,
  ApiPostDirectCastGroupNameV3200Response,
  ApiPostDirectCastGroupPhotoUrlV3RequestBody,
  ApiPostDirectCastGroupPhotoUrlV3200Response,
  ApiPostDirectCastReadV3RequestBody,
  ApiPostDirectCastReadV3200Response,
  ApiPostSnapAgentBuildAsset200Response,
  ApiPostSnapAgentBuildFork200Response,
  ApiPostSnapAgentBuildRequestBody,
  ApiPostSnapAgentPrewarm200Response,
  ApiPostSnapAgentPrewarmRequestBody,
  ApiPostSnapAgentPublish200Response,
  ApiPostSnapAgentPublishRequestBody,
  ApiPostSnapClassify200Response,
  ApiPostSnapClassifyRequestBody,
  ApiPostStepUpMessage200Response,
  ApiPostStepUpMessageRequestBody,
  ApiPostSwapQuoteForGasSwap200Response,
  ApiPostSwapQuoteForGasSwapRequestBody,
  ApiPrepareLimitOrder200Response,
  ApiPrepareLimitOrderRequestBody,
  ApiPrepareVideoUpload200Response,
  ApiPrepareVideoUploadRequestBody,
  ApiProcessCastAttachments200Response,
  ApiProcessCastAttachmentsRequestBody,
  ApiProcessDirectCastMessageMetadata200Response,
  ApiProcessDirectCastMessageMetadataRequestBody,
  ApiPublicGetPrimaryAddress200Response,
  ApiPublicGetPrimaryAddresses200Response,
  ApiPublicGetPrimaryAddressesQueryParams,
  ApiPublicGetPrimaryAddressQueryParams,
  ApiPutDirectCastConversationReactionsV3RequestBody,
  ApiPutDirectCastConversationReactionsV3200Response,
  ApiPutDirectCastGroupInviteV3RequestBody,
  ApiPutDirectCastGroupInviteV3200Response,
  ApiPutDirectCastGroupV3RequestBody,
  ApiPutDirectCastGroupV3200Response,
  ApiPutDirectCastV3RequestBody,
  ApiPutDirectCastV3200Response,
  ApiPutExtSendDirectCast200Response,
  ApiPutExtSendDirectCastRequestBody,
  ApiPutFrameEvent200Response,
  ApiPutFrameEventRequestBody,
  ApiPutMiniAppEvent200Response,
  ApiPutMiniAppEventRequestBody,
  ApiPutPrimaryVerification200Response,
  ApiPutPrimaryVerificationRequestBody,
  ApiPutTransactionSafetyAllowlist200Response,
  ApiPutTransactionSafetyAllowlistRequestBody,
  ApiPutUserAuthAddress200Response,
  ApiPutUserAuthAddressRequestBody,
  ApiPutVerification200Response,
  ApiPutVerificationRequestBody,
  ApiPutWarpcastWalletAddress200Response,
  ApiPutWarpcastWalletAddressRequestBody,
  ApiRaiseHandAudioRoom200Response,
  ApiRaiseHandAudioRoomRequestBody,
  ApiReceiveAppStoreServerNotification200Response,
  ApiReceiveAppStoreServerNotificationRequestBody,
  ApiReceiveAppStoreServerNotificationSandbox200Response,
  ApiReceiveAppStoreServerNotificationSandboxRequestBody,
  ApiReceiveCoinbaseCommerceWebhookEvent200Response,
  ApiRecommendedChannels200Response,
  ApiRecommendedChannelsQueryParams,
  ApiRecordAnalyticsEvents200Response,
  ApiRecordAnalyticsEventsRequestBody,
  ApiRecordArticleSeen200Response,
  ApiRecordArticleSeenRequestBody,
  ApiRecordAudioRoomSpeakerActivity200Response,
  ApiRecordAudioRoomSpeakerActivityRequestBody,
  ApiRecordCastFeedback200Response,
  ApiRecordCastFeedbackRequestBody,
  ApiRecordExploreFeedSeen200Response,
  ApiRecordPollVote200Response,
  ApiRecordPollVoteRequestBody,
  ApiRecordWalletTransaction200Response,
  ApiRecordWalletTransactionRequestBody,
  ApiRedirectToLinkQueryParams,
  ApiRedirectToLinkV2QueryParams,
  ApiRefreshDomainManifestState200Response,
  ApiRefreshDomainManifestStateRequestBody,
  ApiRefreshOnchainToken200Response,
  ApiRefreshOnchainTokenQueryParams,
  ApiRegisterDevice200Response,
  ApiRegisterDeviceRequestBody,
  ApiRegisterEmbeddedWallet200Response,
  ApiRegisterEmbeddedWalletRequestBody,
  ApiRegisterFid200Response,
  ApiRegisterFidRequestBody,
  ApiRegisterTip200Response,
  ApiRegisterTipRequestBody,
  ApiRegisterTipShareCast200Response,
  ApiRegisterTipShareCastRequestBody,
  ApiRejectRecovery200Response,
  ApiRemoveCastBookmark200Response,
  ApiRemoveCastBookmarkRequestBody,
  ApiRemoveCastBoost200Response,
  ApiRemoveCastBoostRequestBody,
  ApiRemoveChannelUserFromRole200Response,
  ApiRemoveChannelUserFromRoleRequestBody,
  ApiRemoveConnectedAccount200Response,
  ApiRemoveConnectedAccountRequestBody,
  ApiRemoveCreatorLabel200Response,
  ApiRemoveCreatorLabelRequestBody,
  ApiRemoveFavoriteFeed200Response,
  ApiRemoveFavoriteFeedRequestBody,
  ApiRemoveFavoriteFrame200Response,
  ApiRemoveFavoriteFrameRequestBody,
  ApiRemoveFeaturedApp200Response,
  ApiRemoveFeaturedAppRequestBody,
  ApiRemoveHiddenFeaturedApp200Response,
  ApiRemoveHiddenFeaturedAppRequestBody,
  ApiRemoveMutedChannel200Response,
  ApiRemoveMutedChannelRequestBody,
  ApiRemoveMuteKeyword200Response,
  ApiRemoveMuteKeywordRequestBody,
  ApiRemoveParticipantAudioRoom200Response,
  ApiRemoveParticipantAudioRoomRequestBody,
  ApiRemovePhoneVerificationForUser200Response,
  ApiRemovePhoneVerificationForUserRequestBody,
  ApiRemoveSigner200Response,
  ApiRemoveSignerRequestBody,
  ApiRemoveSpeakerAudioRoom200Response,
  ApiRemoveSpeakerAudioRoomRequestBody,
  ApiRemoveTip200Response,
  ApiRemoveTipRequestBody,
  ApiRemoveTokenFromWatchlist200Response,
  ApiRemoveTokenFromWatchlistRequestBody,
  ApiRemoveVisibilityRestrictions200Response,
  ApiRemoveVisibilityRestrictionsRequestBody,
  ApiRentStorage201Response,
  ApiRentStorageRequestBody,
  ApiRentTransactionDataQueryParams,
  ApiReportCast200Response,
  ApiReportCastRequestBody,
  ApiReportProfileActivity200Response,
  ApiReportProfileActivityRequestBody,
  ApiReportToken200Response,
  ApiReportTokenRequestBody,
  ApiReportUser200Response,
  ApiReportUserRequestBody,
  ApiRequestAccountDelete200Response,
  ApiResetAccountCircuitBreaker200Response,
  ApiResetAccountCircuitBreakerRequestBody,
  ApiResetChannelInviteCode200Response,
  ApiResetChannelInviteCodeRequestBody,
  ApiResetDismissedTips200Response,
  ApiResetDismissedTipsRequestBody,
  ApiResetDynamicConfig200Response,
  ApiResetDynamicConfigRequestBody,
  ApiResetNuxTasks200Response,
  ApiResetNuxTasksRequestBody,
  ApiResetOnboardingState200Response,
  ApiResetOnboardingStateRequestBody,
  ApiResetToNewUserExperience200Response,
  ApiRespondToChannelInvite200Response,
  ApiRespondToChannelInviteRequestBody,
  ApiRetoolAddNoFeeAllowlistEntry200Response,
  ApiRetoolAddNoFeeAllowlistEntryRequestBody,
  ApiRetoolAllocateInvites200Response,
  ApiRetoolAllocateInvitesRequestBody,
  ApiRetoolCreateArticle200Response,
  ApiRetoolCreateArticleRequestBody,
  ApiRetoolCreateDefiLinkShim200Response,
  ApiRetoolCreateDefiLinkShimRequestBody,
  ApiRetoolDeleteArticle200Response,
  ApiRetoolDeleteArticleRequestBody,
  ApiRetoolDeleteDefiLinkShim200Response,
  ApiRetoolDeleteDefiLinkShimRequestBody,
  ApiRetoolDeleteNoFeeAllowlistEntry200Response,
  ApiRetoolDeleteNoFeeAllowlistEntryRequestBody,
  ApiRetoolGetEnvSecretAddresses200Response,
  ApiRetoolGetNoFeeAllowlist200Response,
  ApiRetoolListAllDefiLinksShim200Response,
  ApiRetoolResetExploreFeedCache200Response,
  ApiRetoolUpdateArticle200Response,
  ApiRetoolUpdateArticleRequestBody,
  ApiRetoolUpdateDefiLinkShim200Response,
  ApiRetoolUpdateDefiLinkShimRequestBody,
  ApiRevokeApiKey200Response,
  ApiRevokeApiKeyRequestBody,
  ApiRevokeAuthSession200Response,
  ApiRevokeAuthSessionRequestBody,
  ApiRsvpAudioRoom200Response,
  ApiRsvpAudioRoomRequestBody,
  ApiSaveDeferredDeepLink200Response,
  ApiSaveDeferredDeepLinkRequestBody,
  ApiScrapeContractAddress200Response,
  ApiScrapeContractAddressQueryParams,
  ApiScrapeEmbed200Response,
  ApiScrapeEmbedRequestBody,
  ApiSearchCasts200Response,
  ApiSearchCastsQueryParams,
  ApiSearchChannels200Response,
  ApiSearchChannelsQueryParams,
  ApiSearchDirectCastInbox200Response,
  ApiSearchDirectCastInboxQueryParams,
  ApiSearchDirectCasts200Response,
  ApiSearchDirectCastsQueryParams,
  ApiSearchMiniapps200Response,
  ApiSearchMiniappsAutocomplete200Response,
  ApiSearchMiniappsAutocompleteQueryParams,
  ApiSearchMiniappsQueryParams,
  ApiSearchSummary200Response,
  ApiSearchSummaryQueryParams,
  ApiSearchUsers200Response,
  ApiSearchUsersForStarterPacks200Response,
  ApiSearchUsersForStarterPacksQueryParams,
  ApiSearchUsersQueryParams,
  ApiSearchWalletSendTargets200Response,
  ApiSearchWalletSendTargetsQueryParams,
  ApiSendAudioRoomReaction200Response,
  ApiSendAudioRoomReactionRequestBody,
  ApiSendBuyWarpsInfoEmail200Response,
  ApiSendConnectAddressLinkEmail200Response,
  ApiSendFrameNotification200Response,
  ApiSendFrameNotificationRequestBody,
  ApiSendPushNotification200Response,
  ApiSendPushNotificationRequestBody,
  ApiSendTestFollowRecommendationNotification200Response,
  ApiSendTestFollowRecommendationNotificationRequestBody,
  ApiSendVerificationEmail200Response,
  ApiSendVerificationEmailRequestBody,
  ApiSetAppBlockedUsers200Response,
  ApiSetAppBlockedUsersRequestBody,
  ApiSetBulkAutoUserQuality200Response,
  ApiSetBulkAutoUserQualityRequestBody,
  ApiSetBulkUserQuality200Response,
  ApiSetBulkUserQualityRequestBody,
  ApiSetChannelDistribution200Response,
  ApiSetChannelDistributionRequestBody,
  ApiSetContactsDeviceState200Response,
  ApiSetContactsDeviceStateRequestBody,
  ApiSetCreatorLabel200Response,
  ApiSetCreatorLabelRequestBody,
  ApiSetDynamicConfig200Response,
  ApiSetDynamicConfigRequestBody,
  ApiSetFavoriteFeedPosition200Response,
  ApiSetFavoriteFeedPositionRequestBody,
  ApiSetFeedSeen200Response,
  ApiSetFeedSeenRequestBody,
  ApiSetInvitesViewed200Response,
  ApiSetLastCheckedTimestamp200Response,
  ApiSetLowQualityUserBadness200Response,
  ApiSetLowQualityUserBadnessRequestBody,
  ApiSetMiniAppQuality200Response,
  ApiSetMiniAppQualityRequestBody,
  ApiSetNeynarScoreOverride200Response,
  ApiSetNeynarScoreOverrideRequestBody,
  ApiSetOnboardingInterestCategories200Response,
  ApiSetOnboardingInterestCategoriesRequestBody,
  ApiSetSuggestedUsersAsSeen200Response,
  ApiSetSuggestedUsersAsSeenRequestBody,
  ApiSetTurnstileChallengeState200Response,
  ApiSetTurnstileChallengeStateRequestBody,
  ApiSetupAdvancedProtection200Response,
  ApiSetupAdvancedProtectionRequestBody,
  ApiSetUserPreferences200Response,
  ApiSetUserPreferencesRequestBody,
  ApiSetUserQuality200Response,
  ApiSetUserQualityRequestBody,
  ApiSetUserReferrer200Response,
  ApiSetUserReferrerRequestBody,
  ApiSetUserUsername200Response,
  ApiSetUserUsernameRequestBody,
  ApiShareCast200Response,
  ApiShareCastQueryParams,
  ApiShareViaDC200Response,
  ApiShareViaDCQueryParams,
  ApiSignInWithFarcaster200Response,
  ApiSignInWithFarcasterRequestBody,
  ApiSignRecoveryTransactionHashQueryParams,
  ApiSignupForInvite200Response,
  ApiSignupForInviteRequestBody,
  ApiSimulateCreateSignedKeyRequest200Response,
  ApiSimulateCreateSignedKeyRequestRequestBody,
  ApiSimulateRegisterFid200Response,
  ApiSimulateRegisterFidRequestBody,
  ApiSimulateRemoveSignedKeyRequest200Response,
  ApiSimulateRemoveSignedKeyRequestRequestBody,
  ApiSimulateRentStorage200Response,
  ApiSimulateRentStorageQueryParams,
  ApiSnapRequest200Response,
  ApiSnapRequestRequestBody,
  ApiStartChannelStreak200Response,
  ApiStartChannelStreakRequestBody,
  ApiStartInAppPurchase200Response,
  ApiStartInAppPurchaseRequestBody,
  ApiStartInAppPurchaseWithCustody200Response,
  ApiStartInAppPurchaseWithCustodyRequestBody,
  ApiStartOnboardingXAuthLink200Response,
  ApiStartOnboardingXAuthLinkRequestBody,
  ApiStartPhoneVerification200Response,
  ApiStartPhoneVerificationRequestBody,
  ApiStartScheduledAudioRoom200Response,
  ApiStartScheduledAudioRoomRequestBody,
  ApiStartVerification200Response,
  ApiStopActiveChannelStreaks200Response,
  ApiStoreDraftCast200Response,
  ApiStoreDraftCastRequestBody,
  ApiStoreDraftCaststorm200Response,
  ApiStoreDraftCaststormRequestBody,
  ApiSubmitSelectedOnboardingInterests200Response,
  ApiSubmitSelectedOnboardingInterestsRequestBody,
  ApiSubmitSignedMessageData200Response,
  ApiSubmitSignedMessageDataRequestBody,
  ApiTipCast200Response,
  ApiTipCastRequestBody,
  ApiUnbanUserFromChannel200Response,
  ApiUnbanUserFromChannelRequestBody,
  ApiUnblockToken200Response,
  ApiUnblockTokenRequestBody,
  ApiUnfollowLeastInteractedWithFollowing200Response,
  ApiUnhideToken200Response,
  ApiUnhideTokenRequestBody,
  ApiUnpinCastOnUserProfile200Response,
  ApiUnpinCastOnUserProfileRequestBody,
  ApiUnpinDirectCastConversation200Response,
  ApiUnpinDirectCastConversationRequestBody,
  ApiUnpinDirectCastMessage200Response,
  ApiUnpinDirectCastMessageRequestBody,
  ApiUnregisterDevice200Response,
  ApiUnregisterDeviceRequestBody,
  ApiUnsubscribeEmailOneClickQueryParams,
  ApiUnsubscribeEmailQueryParams,
  ApiUnsubscribeFidOneClickQueryParams,
  ApiUnsubscribeFidQueryParams,
  ApiUnwatchCastCollectible200Response,
  ApiUnwatchCastCollectibleRequestBody,
  ApiUpdateAudioRoom200Response,
  ApiUpdateAudioRoomRequestBody,
  ApiUpdateChannel200Response,
  ApiUpdateChannelRequestBody,
  ApiUpdateDirectCastGroupPreferences200Response,
  ApiUpdateDirectCastGroupPreferencesRequestBody,
  ApiUpdateEmbeddedWallet200Response,
  ApiUpdateEmbeddedWalletRequestBody,
  ApiUpdateFarcasterTipsStatus200Response,
  ApiUpdateFarcasterTipsStatusRequestBody,
  ApiUpdateFavoriteFrame200Response,
  ApiUpdateFavoriteFrameRequestBody,
  ApiUpdateFeaturedApp200Response,
  ApiUpdateFeaturedAppRequestBody,
  ApiUpdateJobQueue200Response,
  ApiUpdateJobQueueRequestBody,
  ApiUpdatePaidInvite200Response,
  ApiUpdatePaidInviteRequestBody,
  ApiUpdatePendingAdminReview200Response,
  ApiUpdatePendingAdminReviewRequestBody,
  ApiUpdateRecoveryAddress200Response,
  ApiUpdateRecoveryAddressRequestBody,
  ApiUpdateRemoteSiwfRequest200Response,
  ApiUpdateRemoteSiwfRequestRequestBody,
  ApiUpdateStarterPack200Response,
  ApiUpdateStarterPackRequestBody,
  ApiUpdateSyncChannel200Response,
  ApiUpdateSyncChannelRequestBody,
  ApiUpdateTokenSummary200Response,
  ApiUpdateTokenSummaryRequestBody,
  ApiUpdateTrendingTopic200Response,
  ApiUpdateTrendingTopicRequestBody,
  ApiUpdateUser200Response,
  ApiUpdateUserLocation200Response,
  ApiUpdateUserLocationRequestBody,
  ApiUpdateUserRequestBody,
  ApiUpdateWalletLink200Response,
  ApiUpdateWalletLinkRequestBody,
  ApiUploadContacts200Response,
  ApiUploadContactsRequestBody,
  ApiUploadTwitterFollowing200Response,
  ApiUploadTwitterFollowingRequestBody,
  ApiUploadVideoWithTusQueryParams,
  ApiUpsertCampaign200Response,
  ApiUpsertCampaignRequestBody,
  ApiValidateApiKey200Response,
  ApiValidateDCAuthToken200Response,
  ApiValidateFrameEmbedV2RequestBody,
  ApiValidateFrameEmbedV2200Response,
  ApiValidateNewChannelKey200Response,
  ApiValidateNewChannelKeyQueryParams,
  ApiVerifyEmailQueryParams,
  ApiVerifyEmailWithCode200Response,
  ApiVerifyEmailWithCodeRequestBody,
  ApiVerifyToken200Response,
  ApiVerifyTokenRequestBody,
  ApiVerifyTotpCode200Response,
  ApiVerifyTotpCodeForEmail200Response,
  ApiVerifyTotpCodeForEmailRequestBody,
  ApiVerifyTotpCodeRequestBody,
  ApiWalletEvmScanAction200Response,
  ApiWalletEvmScanActionRequestBody,
  ApiWalletResource200Response,
  ApiWalletResourceRequestBody,
  ApiWalletSendSuggestions200Response,
  ApiWalletSendSuggestionsQueryParams,
  ApiWalletSolScanAction200Response,
  ApiWalletSolScanActionRequestBody,
  ApiWatchCastCollectible200Response,
  ApiWatchCastCollectibleRequestBody,
  ApiXpClaimableSummary200Response,
  ApiXpQuickView200Response,
  RequestHeaders,
  RequestParams,
} from '../types';
import { AbstractFarcasterApiClient } from './AbstractFarcasterApiClient';

export class FarcasterApiClient extends AbstractFarcasterApiClient {
  /**
   * Accept a pending invite to the stage.
   */
  acceptStageInviteAudioRoom(
    body: ApiAcceptStageInviteAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAcceptStageInviteAudioRoom200Response>(
      '/v1/audio-room/accept-stage-invite',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'acceptStageInviteAudioRoom',
        body,
      },
    );
  }

  /**
   * Accept or decline an outstanding channel member or moderator invite
   */
  fcRespondToChannelRoleInvite(
    body: ApiFcRespondToChannelRoleInviteRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiFcRespondToChannelRoleInvite200Response>(
      '/fc/channel-invites',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'fcRespondToChannelRoleInvite',
        body,
      },
    );
  }

  /**
   * Accept or decline an outstanding channel member or moderator invite
   */
  respondToChannelInvite(
    body: ApiRespondToChannelInviteRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiRespondToChannelInvite200Response>(
      '/v1/manage-channel-users',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'respondToChannelInvite',
        body,
      },
    );
  }

  /**
   * Accepts an invite to a direct cast group.
   */
  postDirectCastAcceptGroupInviteV3(
    body: ApiPostDirectCastAcceptGroupInviteV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastAcceptGroupInviteV3200Response>(
      '/v2/direct-cast-accept-group-invite',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastAcceptGroupInviteV3',
        body,
      },
    );
  }

  /**
   * Activate a token subscription
   */
  activateTokenSubscription(
    body: ApiActivateTokenSubscriptionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiActivateTokenSubscription200Response>(
      '/v1/onchain/tokens/subscriptions/activate',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'activateTokenSubscription',
        body,
      },
    );
  }

  /**
   * Add a channel to a user's mute list
   */
  addMutedChannel(
    body: ApiAddMutedChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAddMutedChannel200Response>('/v2/mute-channel', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addMutedChannel',
      body,
    });
  }

  /**
   * Add a domain to the transaction safety allowlist
   */
  putTransactionSafetyAllowlist(
    body: ApiPutTransactionSafetyAllowlistRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutTransactionSafetyAllowlist200Response>(
      '/v2/transaction-safety-allowlist',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'putTransactionSafetyAllowlist',
        body,
      },
    );
  }

  /**
   * Add a keyword to a user's mute list
   */
  addMuteKeyword(
    body: ApiAddMuteKeywordRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAddMuteKeyword200Response>('/v2/mute-keyword', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addMuteKeyword',
      body,
    });
  }

  /**
   * Add a public key for direct cast conversations (deprecated).
   */
  addDirectCastUserKey(
    body: ApiAddDirectCastUserKeyRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAddDirectCastUserKey200Response>(
      '/v2/direct-cast-keys',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'addDirectCastUserKey',
        body,
      },
    );
  }

  /**
   * Add a public key for direct cast conversations. (deprecated)
   */
  addDirectCastKeysByAccount(
    body: ApiAddDirectCastKeysByAccountRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAddDirectCastKeysByAccount200Response>(
      '/v2/direct-cast-device-keys',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'addDirectCastKeysByAccount',
        body,
      },
    );
  }

  /**
   * Add a role to a domain
   */
  devToolsAddDomainRole(
    body: ApiDevToolsAddDomainRoleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiDevToolsAddDomainRole200Response>(
      '/v1/dev-tools/domain-roles',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsAddDomainRole',
        body,
      },
    );
  }

  /**
   * Add a usename to the authenticated user
   */
  addUserUsername(
    body: ApiAddUserUsernameRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAddUserUsername200Response>('/v2/user-usernames', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addUserUsername',
      body,
    });
  }

  /**
   * Add fid to the no-fee allowlist (internal)
   */
  retoolAddNoFeeAllowlistEntry(
    body: ApiRetoolAddNoFeeAllowlistEntryRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRetoolAddNoFeeAllowlistEntry200Response>(
      '/v2/retool-no-fee-allowlist',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'retoolAddNoFeeAllowlistEntry',
        body,
      },
    );
  }

  /**
   * Add token to watchlist.
   */
  addTokenToWatchlist(
    body: ApiAddTokenToWatchlistRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAddTokenToWatchlist200Response>('/v2/token-watchlists', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addTokenToWatchlist',
      body,
    });
  }

  /**
   * Add topics for a cast
   */
  createCastTopics(
    body: ApiCreateCastTopicsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateCastTopics200Response>('/v1/create-cast-topics', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createCastTopics',
      body,
    });
  }

  /**
   * Allocate invites as an admin
   */
  retoolAllocateInvites(
    body: ApiRetoolAllocateInvitesRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiRetoolAllocateInvites200Response>(
      '/v2/retool-allocate-invites',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'retoolAllocateInvites',
        body,
      },
    );
  }

  /**
   * Allowlist an email for sponsored registration
   */
  allowSponsoredRegistration(
    body: ApiAllowSponsoredRegistrationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAllowSponsoredRegistration200Response>(
      '/v2/allow-sponsored-registration',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'allowSponsoredRegistration',
        body,
      },
    );
  }

  /**
   * Allows admins to delete campaigns
   */
  deleteCampaign(
    params: ApiDeleteCampaignQueryParams,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteCampaign200Response>('/v2/campaign-admin', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteCampaign',
      params,
    });
  }

  /**
   * Allows admins to fetch all or a single notification for a user, used for,  * troubleshooting issues
   */
  getNotificationGroupsAdmin(
    params: ApiGetNotificationGroupsAdminQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetNotificationGroupsAdmin200Response>(
      '/v2/notification-groups-admin',
      {
        headers,
        timeout,
        endpointName: 'getNotificationGroupsAdmin',
        params,
      },
    );
  }

  /**
   * Allows admins to pin a message in conversation.
   */
  pinDirectCastMessage(
    body: ApiPinDirectCastMessageRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPinDirectCastMessage200Response>(
      '/v2/direct-cast-pin-message',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'pinDirectCastMessage',
        body,
      },
    );
  }

  /**
   * Allows admins to unpint a message in conversation.
   */
  unpinDirectCastMessage(
    body: ApiUnpinDirectCastMessageRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiUnpinDirectCastMessage200Response>(
      '/v2/direct-cast-pin-message',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'unpinDirectCastMessage',
        body,
      },
    );
  }

  /**
   * Allows admins to upsert campaigns
   */
  upsertCampaign(
    body: ApiUpsertCampaignRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUpsertCampaign200Response>('/v2/campaign-admin', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'upsertCampaign',
      body,
    });
  }

  /**
   * Allows user pay in warps and connect app (create a signer).
   */
  payWarpsAndConnectApp(
    body: ApiPayWarpsAndConnectAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPayWarpsAndConnectApp200Response>(
      '/v2/pay-warps-and-connect-app',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'payWarpsAndConnectApp',
        body,
      },
    );
  }

  /**
   * Allows user pay in warps and disconnect app (create a signer).
   */
  payWarpsAndDisconnectApp(
    body: ApiPayWarpsAndDisconnectAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPayWarpsAndDisconnectApp200Response>(
      '/v2/pay-warps-and-disconnect-app',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'payWarpsAndDisconnectApp',
        body,
      },
    );
  }

  /**
   * Allows users to manually mark a conversation unread.
   */
  manuallyMarkConversationUnread(
    body: ApiManuallyMarkConversationUnreadRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiManuallyMarkConversationUnread200Response>(
      '/v2/direct-cast-manually-mark-unread',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'manuallyMarkConversationUnread',
        body,
      },
    );
  }

  /**
   * Alters a direct cast conversation categorization.
   */
  postDirectCastConversationCategorizationV3(
    body: ApiPostDirectCastConversationCategorizationV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastConversationCategorizationV3200Response>(
      '/v2/direct-cast-conversation-categorization',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastConversationCategorizationV3',
        body,
      },
    );
  }

  /**
   * Alters a direct cast conversation's message ttl.
   */
  postDirectCastConversationMessageTTL(
    body: ApiPostDirectCastConversationMessageTTLRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastConversationMessageTTL200Response>(
      '/v2/direct-cast-conversation-message-ttl',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastConversationMessageTTL',
        body,
      },
    );
  }

  /**
   * Alters a direct cast conversation's notification behavior.
   */
  postDirectCastConversationNotificationsV3(
    body: ApiPostDirectCastConversationNotificationsV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastConversationNotificationsV3200Response>(
      '/v2/direct-cast-conversation-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastConversationNotificationsV3',
        body,
      },
    );
  }

  /**
   * Alters a direct cast conversations categorization in bulk.
   */
  postDirectCastConversationCategorizationBulkV3(
    body: ApiPostDirectCastConversationCategorizationBulkV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastConversationCategorizationBulkV3200Response>(
      '/v2/direct-cast-conversation-categorization-all',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastConversationCategorizationBulkV3',
        body,
      },
    );
  }

  /**
   * Alters a direct cast group's membership.
   */
  postDirectCastGroupMembershipV3(
    body: ApiPostDirectCastGroupMembershipV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastGroupMembershipV3200Response>(
      '/v2/direct-cast-group-membership',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastGroupMembershipV3',
        body,
      },
    );
  }

  /**
   * Alters a direct cast group's name.
   */
  postDirectCastGroupNameV3(
    body: ApiPostDirectCastGroupNameV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastGroupNameV3200Response>(
      '/v2/direct-cast-group',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastGroupNameV3',
        body,
      },
    );
  }

  /**
   * Alters a direct cast group's photo url.
   */
  postDirectCastGroupPhotoUrlV3(
    body: ApiPostDirectCastGroupPhotoUrlV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastGroupPhotoUrlV3200Response>(
      '/v2/direct-cast-group-photo',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastGroupPhotoUrlV3',
        body,
      },
    );
  }

  /**
   * Applies a reaction to the specified message.
   */
  putDirectCastConversationReactionsV3(
    body: ApiPutDirectCastConversationReactionsV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutDirectCastConversationReactionsV3200Response>(
      '/v2/direct-cast-message-reaction',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'putDirectCastConversationReactionsV3',
        body,
      },
    );
  }

  /**
   * Approve a recovery
   */
  approveRecovery({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiApproveRecovery200Response>('/v2/approve-recovery', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'approveRecovery',
      body: {},
    });
  }

  /**
   * Approve a signed key request.
   */
  approveSignedKeyRequest(
    body: ApiApproveSignedKeyRequestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiApproveSignedKeyRequest200Response>(
      '/v2/approve-signed-key-requests',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'approveSignedKeyRequest',
        body,
      },
    );
  }

  /**
   * Approve or reject a pending admin review
   */
  updatePendingAdminReview(
    body: ApiUpdatePendingAdminReviewRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdatePendingAdminReview200Response>(
      '/v2/pending-admin-reviews',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updatePendingAdminReview',
        body,
      },
    );
  }

  /**
   * Assign a quest to a user
   */
  assignQuestForUser(
    body: ApiAssignQuestForUserRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAssignQuestForUser200Response>(
      '/v2/quests/debug/quests',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'assignQuestForUser',
        body,
      },
    );
  }

  /**
   * Ban a user from a channel
   */
  banUserFromChannel(
    body: ApiBanUserFromChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiBanUserFromChannel200Response>(
      '/v1/channel-banned-users',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'banUserFromChannel',
        body,
      },
    );
  }

  /**
   * Ban a user from a channel
   */
  fcBanUserFromChannel(
    body: ApiFcBanUserFromChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcBanUserFromChannel200Response>('/fc/channel-bans', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcBanUserFromChannel',
      body,
    });
  }

  /**
   * Bid on a cast collectible.
   */
  bidOnCastCollectible(
    body: ApiBidOnCastCollectibleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiBidOnCastCollectible200Response>(
      '/v2/cast-collectibles/place-bid',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'bidOnCastCollectible',
        body,
      },
    );
  }

  /**
   * Block a Snap URL by exact normalized URL (origin + pathname, no query string or hash).
   */
  adminBlockSnapUrl(
    body: ApiAdminBlockSnapUrlRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAdminBlockSnapUrl200Response>(
      '/v2/admin-snap-blocklist',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminBlockSnapUrl',
        body,
      },
    );
  }

  /**
   * Block a token from appearing in the app
   */
  blockToken(
    body: ApiBlockTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiBlockToken200Response>('/v2/block-token', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'blockToken',
      body,
    });
  }

  /**
   * Block a user
   */
  fcBlockUser(
    body: ApiFcBlockUserRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcBlockUser200Response>('/fc/blocked-users', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcBlockUser',
      body,
    });
  }

  /**
   * Block users from using the app
   */
  setAppBlockedUsers(
    body: ApiSetAppBlockedUsersRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetAppBlockedUsers200Response>('/v1/app-blocked-users', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setAppBlockedUsers',
      body,
    });
  }

  /**
   * Bookmark a cast.
   */
  bookmarkCast(
    body: ApiBookmarkCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiBookmarkCast200Response>('/v2/bookmarked-casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'bookmarkCast',
      body,
    });
  }

  /**
   * Boost a cast in a channel
   */
  boostCast(
    body: ApiBoostCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiBoostCast200Response>('/v2/boost-cast', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'boostCast',
      body,
    });
  }

  /**
   * Broadcast an emoji reaction to all participants in the room.
   */
  sendAudioRoomReaction(
    body: ApiSendAudioRoomReactionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSendAudioRoomReaction200Response>(
      '/v1/audio-room/reaction',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'sendAudioRoomReaction',
        body,
      },
    );
  }

  /**
   * Browse different lists of apps
   */
  discoverApps(
    params: ApiDiscoverAppsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDiscoverApps200Response>('/v2/discover-apps', {
      headers,
      timeout,
      endpointName: 'discoverApps',
      params,
    });
  }

  /**
   * Browse different lists of frames
   */
  discoverFrames(
    params: ApiDiscoverFramesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDiscoverFrames200Response>('/v2/discover-frames', {
      headers,
      timeout,
      endpointName: 'discoverFrames',
      params,
    });
  }

  /**
   * Buy Warps with Coinbase Commerce.
   */
  buyWarpsCoinbaseCommerce(
    body: ApiBuyWarpsCoinbaseCommerceRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiBuyWarpsCoinbaseCommerce200Response>(
      '/v2/buy-warps-coinbase-commerce',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'buyWarpsCoinbaseCommerce',
        body,
      },
    );
  }

  /**
   * Cancel an onchain limit order
   */
  cancelLimitOrder(
    body: ApiCancelLimitOrderRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCancelLimitOrder200Response>(
      '/v1/onchain/limit-orders/cancel',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'cancelLimitOrder',
        body,
      },
    );
  }

  /**
   * Check and confirm the receipt to finalize in-app purchase for authenticated user.
   */
  finishInAppPurchase(
    body: ApiFinishInAppPurchaseRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFinishInAppPurchase200Response>(
      '/v2/finish-in-app-purchase',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'finishInAppPurchase',
        body,
      },
    );
  }

  /**
   * Check if a token is eligible to buy with fiat via Crossmint
   */
  getCrossmintEligible(
    params: ApiGetCrossmintEligibleQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCrossmintEligible200Response>(
      '/v2/crossmint/eligible',
      {
        headers,
        timeout,
        endpointName: 'getCrossmintEligible',
        params,
      },
    );
  }

  /**
   * Check if a user has TOTP enabled
   */
  getTotpEnabled({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetTotpEnabled200Response>('/v2/totp/enabled', {
      headers,
      timeout,
      endpointName: 'getTotpEnabled',
    });
  }

  /**
   * Check if a user has TOTP enabled for email
   */
  getTotpEnabledForEmail(
    params: ApiGetTotpEnabledForEmailQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTotpEnabledForEmail200Response>(
      '/v2/totp/enabled-for-email',
      {
        headers,
        timeout,
        endpointName: 'getTotpEnabledForEmail',
        params,
      },
    );
  }

  /**
   * Check if a user is eligible for a limited edition NFT
   */
  farcasterProIsEligibleForLimitedEditionNft(
    params: ApiFarcasterProIsEligibleForLimitedEditionNftQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFarcasterProIsEligibleForLimitedEditionNft200Response>(
      '/v1/farcaster-pro/is-eligible-for-limited-edition-nft',
      {
        headers,
        timeout,
        endpointName: 'farcasterProIsEligibleForLimitedEditionNft',
        params,
      },
    );
  }

  /**
   * Check if the current user is in the referral code promo
   */
  isInReferralCodePromo({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiIsInReferralCodePromo200Response>(
      '/v2/get-is-referral-code-promo',
      {
        headers,
        timeout,
        endpointName: 'isInReferralCodePromo',
      },
    );
  }

  /**
   * Check if the desired key for a channel is valid and free
   */
  validateNewChannelKey(
    params: ApiValidateNewChannelKeyQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiValidateNewChannelKey200Response>(
      '/v2/validate-new-channel-key',
      {
        headers,
        timeout,
        endpointName: 'validateNewChannelKey',
        params,
      },
    );
  }

  /**
   * Check if tips are available
   */
  getFarcasterTipsStatus({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetFarcasterTipsStatus200Response>(
      '/v2/farcaster-tips/tip-status',
      {
        headers,
        timeout,
        endpointName: 'getFarcasterTipsStatus',
      },
    );
  }

  /**
   * Claim XP rewards for a user
   */
  claimXPRewards({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiClaimXPRewards200Response>('/v2/claim-xp-rewards', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'claimXPRewards',
      body: {},
    });
  }

  /**
   * Claim a quest reward
   */
  claimQuestReward(
    body: ApiClaimQuestRewardRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiClaimQuestReward200Response>(
      '/v2/quests/claim-reward',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'claimQuestReward',
        body,
      },
    );
  }

  /**
   * Claim a referral code for the current user
   */
  claimReferralCode(
    body: ApiClaimReferralCodeRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiClaimReferralCode200Response>(
      '/v2/claim-referral-code',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'claimReferralCode',
        body,
      },
    );
  }

  /**
   * Claim referral for an email address
   */
  claimReferral(
    body: ApiClaimReferralRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiClaimReferral200Response>('/v2/claim-referral', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'claimReferral',
      body,
    });
  }

  /**
   * Classify whether cast text is a good Snap candidate
   */
  postSnapClassify(
    body: ApiPostSnapClassifyRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostSnapClassify200Response>('/v2/snap/classify', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'postSnapClassify',
      body,
    });
  }

  /**
   * Clear job queue or queue shart
   */
  clearJobQueue(
    body: ApiClearJobQueueRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiClearJobQueue200Response>('/v1/job-queue', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'clearJobQueue',
      body,
    });
  }

  /**
   * Complete a campaign
   */
  completeCampaign(
    body: ApiCompleteCampaignRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCompleteCampaign200Response>('/v2/campaign', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'completeCampaign',
      body,
    });
  }

  /**
   * Complete a phone verification
   */
  completePhoneVerification(
    body: ApiCompletePhoneVerificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCompletePhoneVerification200Response>(
      '/v2/complete-phone-verification',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'completePhoneVerification',
        body,
      },
    );
  }

  /**
   * Complete registration for an FID by submitting a username and delegating a signer.
   */
  completeRegistration(
    body: ApiCompleteRegistrationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCompleteRegistration200Response>(
      '/v2/complete-registration',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'completeRegistration',
        body,
      },
    );
  }

  /**
   * Confirm a magic link
   */
  completeMagicLink(
    body: ApiCompleteMagicLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCompleteMagicLink200Response>(
      '/v2/magic-link-complete',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'completeMagicLink',
        body,
      },
    );
  }

  /**
   * Confirm creator has tax documents and make them eligibile for rewards
   */
  confirmTaxDocuments(
    body: ApiConfirmTaxDocumentsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiConfirmTaxDocuments200Response>(
      '/v2/confirm-tax-documents',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'confirmTaxDocuments',
        body,
      },
    );
  }

  /**
   * Confirms account deletion. Intended to be loaded via browser.
   */
  confirmAccountDelete(
    params: ApiConfirmAccountDeleteQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/confirm-account-delete', {
      headers,
      timeout,
      endpointName: 'confirmAccountDelete',
      params,
    });
  }

  /**
   * Connected apps for a user
   */
  getConnectedApps(
    params: ApiGetConnectedAppsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetConnectedApps200Response>(
      '/v1/connected-apps',
      {
        headers,
        timeout,
        endpointName: 'getConnectedApps',
        params,
      },
    );
  }

  /**
   * Create a TOTP secret for a user
   */
  createTotpSecret({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiCreateTotpSecret200Response>('/v2/totp/create', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createTotpSecret',
      body: {},
    });
  }

  /**
   * Create a direct cast conversation.
   */
  fcPutConversation(
    body: ApiFcPutConversationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiFcPutConversation200Response>('/fc/conversation', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPutConversation',
      body,
    });
  }

  /**
   * Create a direct cast group.
   */
  fcPutGroup(
    body: ApiFcPutGroupRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiFcPutGroup200Response>('/fc/group', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPutGroup',
      body,
    });
  }

  /**
   * Create a featured mint
   */
  addFeaturedMint(
    body: ApiAddFeaturedMintRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAddFeaturedMint200Response>('/v1/featured-mint', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addFeaturedMint',
      body,
    });
  }

  /**
   * Create a frame event.
   */
  putFrameEvent(
    body: ApiPutFrameEventRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutFrameEvent200Response>('/v2/frame-event', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'putFrameEvent',
      body,
    });
  }

  /**
   * Create a like reaction for a cast.
   */
  createCastLike(
    body: ApiCreateCastLikeRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateCastLike200Response>('/v2/cast-likes', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createCastLike',
      body,
    });
  }

  /**
   * Create a new channel
   */
  createChannel(
    body: ApiCreateChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateChannel200Response>('/v2/channels-owned', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createChannel',
      body,
    });
  }

  /**
   * Create a new curated wallet link (admin only). If any of `name` / `description` / `imageUrl` are omitted, the server crawls the URL via `OpenGraphService` and populates the missing fields from og:title / og:description / og:image. Admin-provided values always win over the crawler. Crawl failures are non-fatal — the row is created with whatever fields the admin supplied plus an `ogCrawlError` note that the admin can inspect in Retool.
   */
  createWalletLink(
    body: ApiCreateWalletLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateWalletLink200Response>('/v2/wallet-links', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createWalletLink',
      body,
    });
  }

  /**
   * Create a new invite.
   */
  createInvite(
    body: ApiCreateInviteRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateInvite200Response>('/v2/invite', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createInvite',
      body,
    });
  }

  /**
   * Create a new live audio room with the authenticated user as host (admin-only v1).
   */
  createAudioRoom(
    body: ApiCreateAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateAudioRoom200Response>('/v1/audio-rooms', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createAudioRoom',
      body,
    });
  }

  /**
   * Create a new recovery
   */
  createRecovery(
    body: ApiCreateRecoveryRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateRecovery200Response>('/v2/recoveries', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createRecovery',
      body,
    });
  }

  /**
   * Create a new starter pack
   */
  createStarterPack(
    body: ApiCreateStarterPackRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateStarterPack200Response>('/v2/starter-pack', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createStarterPack',
      body,
    });
  }

  /**
   * Create a news article (internal)
   */
  retoolCreateArticle(
    body: ApiRetoolCreateArticleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRetoolCreateArticle200Response>('/v2/retool-news', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'retoolCreateArticle',
      body,
    });
  }

  /**
   * Create a poll
   */
  createPoll(
    body: ApiCreatePollRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreatePoll200Response>('/v2/create-poll', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createPoll',
      body,
    });
  }

  /**
   * Create a remote SIWF request
   */
  createRemoteSiwfRequest(
    body: ApiCreateRemoteSiwfRequestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateRemoteSiwfRequest200Response>('/v1/remote-siwf', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createRemoteSiwfRequest',
      body,
    });
  }

  /**
   * Create a signed key request.
   */
  createSignedKeyRequest(
    body: ApiCreateSignedKeyRequestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateSignedKeyRequest200Response>(
      '/v2/signed-key-requests',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createSignedKeyRequest',
        body,
      },
    );
  }

  /**
   * Create a tip share cast without a transaction hash
   */
  registerTipShareCast(
    body: ApiRegisterTipShareCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRegisterTipShareCast200Response>(
      '/v2/farcaster-tips/register-tip-share-cast',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'registerTipShareCast',
        body,
      },
    );
  }

  /**
   * Create a tip without a transaction hash
   */
  registerTip(
    body: ApiRegisterTipRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRegisterTip200Response>(
      '/v2/farcaster-tips/register-tip',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'registerTip',
        body,
      },
    );
  }

  /**
   * Create a trending topic
   */
  createTrendingTopic(
    body: ApiCreateTrendingTopicRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateTrendingTopic200Response>(
      '/v1/admin-trending-topics',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createTrendingTopic',
        body,
      },
    );
  }

  /**
   * Create a warpcast sponsored invite.
   */
  createWarpcastSponsoredInvite({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiCreateWarpcastSponsoredInvite200Response>(
      '/v2/warpcast-sponsored-invites',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createWarpcastSponsoredInvite',
        body: {},
      },
    );
  }

  /**
   * Create an onchain limit order
   */
  createLimitOrder(
    body: ApiCreateLimitOrderRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateLimitOrder200Response>(
      '/v1/onchain/limit-orders',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createLimitOrder',
        body,
      },
    );
  }

  /**
   * Create or update a mini app push notification configuration (admin only).
   */
  adminPutMiniAppPushNotificationConfig(
    body: ApiAdminPutMiniAppPushNotificationConfigRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAdminPutMiniAppPushNotificationConfig200Response>(
      '/v2/admin-mini-app-push-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminPutMiniAppPushNotificationConfig',
        body,
      },
    );
  }

  /**
   * Creates a cast for the currently authenticated user.
   */
  createCast(
    body: ApiCreateCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateCast201Response>('/v2/casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createCast',
      body,
    });
  }

  /**
   * Creates a group for direct casts.
   */
  putDirectCastGroupV3(
    body: ApiPutDirectCastGroupV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutDirectCastGroupV3200Response>(
      '/v2/direct-cast-group',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'putDirectCastGroupV3',
        body,
      },
    );
  }

  /**
   * Creates an invite to a direct cast group, removing the old one if present.
   */
  putDirectCastGroupInviteV3(
    body: ApiPutDirectCastGroupInviteV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPutDirectCastGroupInviteV3200Response>(
      '/v2/direct-cast-group-invite',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'putDirectCastGroupInviteV3',
        body,
      },
    );
  }

  /**
   * Creates an onboarding for an Ethereum account
   */
  createOnboarding(
    body: ApiCreateOnboardingRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateOnboarding200Response>('/v2/onboarding', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createOnboarding',
      body,
    });
  }

  /**
   * Deactivate a token subscription
   */
  deactivateTokenSubscription(
    body: ApiDeactivateTokenSubscriptionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeactivateTokenSubscription200Response>(
      '/v1/onchain/tokens/subscriptions/activate',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deactivateTokenSubscription',
        body,
      },
    );
  }

  /**
   * Debug a domain manifest
   */
  devToolsDebugDomainManifest(
    params: ApiDevToolsDebugDomainManifestQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsDebugDomainManifest200Response>(
      '/v1/dev-tools/debug-domain-manifest',
      {
        headers,
        timeout,
        endpointName: 'devToolsDebugDomainManifest',
        params,
      },
    );
  }

  /**
   * Decline a pending invite to the stage.
   */
  declineStageInviteAudioRoom(
    body: ApiDeclineStageInviteAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDeclineStageInviteAudioRoom200Response>(
      '/v1/audio-room/decline-stage-invite',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'declineStageInviteAudioRoom',
        body,
      },
    );
  }

  /**
   * Declines an invite to a direct cast group.
   */
  postDirectCastDeclineGroupInviteV3(
    body: ApiPostDirectCastDeclineGroupInviteV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastDeclineGroupInviteV3200Response>(
      '/v2/direct-cast-decline-group-invite',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastDeclineGroupInviteV3',
        body,
      },
    );
  }

  /**
   * Decode an account association
   */
  devToolsDecodeAccountAssociation(
    body: ApiDevToolsDecodeAccountAssociationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsDecodeAccountAssociation200Response>(
      '/v1/dev-tools/decode-account-association',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsDecodeAccountAssociation',
        body,
      },
    );
  }

  /**
   * Deeplink to clients.
   */
  redirectToCastDeepLink({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<void>('/casts/*', {
      headers,
      timeout,
      endpointName: 'redirectToCastDeepLink',
    });
  }

  /**
   * Delete a cast from a trending topic
   */
  deleteCastFromTrendingTopic(
    body: ApiDeleteCastFromTrendingTopicRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteCastFromTrendingTopic200Response>(
      '/v1/delete-cast-from-trending-topic',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteCastFromTrendingTopic',
        body,
      },
    );
  }

  /**
   * Delete a curated wallet link (admin only)
   */
  deleteWalletLink(
    body: ApiDeleteWalletLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteWalletLink200Response>('/v2/wallet-links', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteWalletLink',
      body,
    });
  }

  /**
   * Delete a direct cast message.
   */
  fcDeleteMessage(
    body: ApiFcDeleteMessageRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiFcDeleteMessage200Response>('/fc/message', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcDeleteMessage',
      body,
    });
  }

  /**
   * Delete a discovery app
   */
  deleteDiscoveryApp(
    body: ApiDeleteDiscoveryAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteDiscoveryApp200Response>('/v2/discovery-app', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteDiscoveryApp',
      body,
    });
  }

  /**
   * Delete a discovery frame
   */
  deleteDiscoveryFrame(
    body: ApiDeleteDiscoveryFrameRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteDiscoveryFrame200Response>(
      '/v2/discovery-frame',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteDiscoveryFrame',
        body,
      },
    );
  }

  /**
   * Delete a featured mint
   */
  deleteFeaturedMint(
    body: ApiDeleteFeaturedMintRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteFeaturedMint200Response>('/v1/featured-mint', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteFeaturedMint',
      body,
    });
  }

  /**
   * Delete a miniapp manifest
   */
  devToolsDeleteMiniAppManifest(
    body: ApiDevToolsDeleteMiniAppManifestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDevToolsDeleteMiniAppManifest200Response>(
      '/v1/dev-tools/delete-manifest',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsDeleteMiniAppManifest',
        body,
      },
    );
  }

  /**
   * Delete a news article
   */
  retoolDeleteArticle(
    body: ApiRetoolDeleteArticleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRetoolDeleteArticle200Response>('/v2/retool-news', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'retoolDeleteArticle',
      body,
    });
  }

  /**
   * Delete a recast.
   */
  deleteRecast(
    body: ApiDeleteRecastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteRecast200Response>('/v2/recasts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteRecast',
      body,
    });
  }

  /**
   * Delete a snap build
   */
  deleteSnapAgentBuild(
    params: { buildId: string },
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteSnapAgentBuild200Response>(
      `/v2/snap/agent/builds/${encodeURIComponent(params.buildId)}`,
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteSnapAgentBuild',
        body: {},
      },
    );
  }

  /**
   * Delete a trending topic
   */
  deleteTrendingTopic(
    body: ApiDeleteTrendingTopicRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteTrendingTopic200Response>(
      '/v1/admin-trending-topics',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteTrendingTopic',
        body,
      },
    );
  }

  /**
   * Delete all quests for the user
   */
  deleteQuestsForUser(
    body: ApiDeleteQuestsForUserRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteQuestsForUser200Response>(
      '/v2/quests/debug/quests',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteQuestsForUser',
        body,
      },
    );
  }

  /**
   * Delete an account verification for a user
   */
  deleteAccountVerification(
    body: ApiDeleteAccountVerificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteAccountVerification200Response>(
      '/v2/account-verifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteAccountVerification',
        body,
      },
    );
  }

  /**
   * Delete direct cast message
   */
  deleteDirectCastMessage(
    body: ApiDeleteDirectCastMessageRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteDirectCastMessage200Response>(
      '/v2/delete-message',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteDirectCastMessage',
        body,
      },
    );
  }

  /**
   * Delete information about the specified device.
   */
  unregisterDevice(
    body: ApiUnregisterDeviceRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiUnregisterDevice200Response>('/v2/devices', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'unregisterDevice',
      body,
    });
  }

  /**
   * Delete starter pack
   */
  deleteStarterPack(
    body: ApiDeleteStarterPackRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteStarterPack200Response>('/v2/starter-pack', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteStarterPack',
      body,
    });
  }

  /**
   * Delete uploaded video
   */
  abandonVideoUpload(
    body: ApiAbandonVideoUploadRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiAbandonVideoUpload200Response>('/v1/uploaded-video', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'abandonVideoUpload',
      body,
    });
  }

  /**
   * Deletes a cast.
   */
  deleteCast(
    body: ApiDeleteCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteCast200Response>('/v2/casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteCast',
      body,
    });
  }

  /**
   * Deletes a user's contacts.
   */
  deleteContacts({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.delete<ApiDeleteContacts200Response>('/v2/contacts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteContacts',
      body: {},
    });
  }

  /**
   * Deletes an API key.
   */
  deleteApiKey(
    body: ApiDeleteApiKeyRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteApiKey200Response>('/v2/api-keys', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteApiKey',
      body,
    });
  }

  /**
   * Deletes the synchronization channel.
   */
  deleteSyncChannel(
    params: ApiDeleteSyncChannelQueryParams,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteSyncChannel200Response>('/v2/sync-channel', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteSyncChannel',
      params,
    });
  }

  /**
   * Deny a recovery, providing a signature representing an admin's rejection of the recovery.
   */
  denyRecoveryTransaction(
    body: ApiDenyRecoveryTransactionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiDenyRecoveryTransaction200Response>(
      '/v2/deny-recovery-transaction',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'denyRecoveryTransaction',
        body,
      },
    );
  }

  /**
   * Deprecated alias for DELETE /v2/wallet-links.
   */
  retoolDeleteDefiLinkShim(
    body: ApiRetoolDeleteDefiLinkShimRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRetoolDeleteDefiLinkShim200Response>(
      '/v2/retool-defi-links',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'retoolDeleteDefiLinkShim',
        body,
      },
    );
  }

  /**
   * Deprecated alias for GET /v2/wallet-links (admin shape).
   */
  retoolListAllDefiLinksShim({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiRetoolListAllDefiLinksShim200Response>(
      '/v2/retool-defi-links',
      {
        headers,
        timeout,
        endpointName: 'retoolListAllDefiLinksShim',
      },
    );
  }

  /**
   * Deprecated alias for GET /v2/wallet-links, kept for pre-rename mobile clients. Only returns rows with both `name` and `description` populated.
   */
  getDefiLinksShim({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetDefiLinksShim200Response>('/v2/defi-links', {
      headers,
      timeout,
      endpointName: 'getDefiLinksShim',
    });
  }

  /**
   * Deprecated alias for POST /v2/wallet-links.
   */
  retoolCreateDefiLinkShim(
    body: ApiRetoolCreateDefiLinkShimRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRetoolCreateDefiLinkShim200Response>(
      '/v2/retool-defi-links',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'retoolCreateDefiLinkShim',
        body,
      },
    );
  }

  /**
   * Deprecated alias for PUT /v2/wallet-links.
   */
  retoolUpdateDefiLinkShim(
    body: ApiRetoolUpdateDefiLinkShimRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiRetoolUpdateDefiLinkShim200Response>(
      '/v2/retool-defi-links',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'retoolUpdateDefiLinkShim',
        body,
      },
    );
  }

  /**
   * Diagnose the state of a domain manifest
   */
  getDomainManifestState(
    params: ApiGetDomainManifestStateQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDomainManifestState200Response>(
      '/v1/domain-manifest',
      {
        headers,
        timeout,
        endpointName: 'getDomainManifestState',
        params,
      },
    );
  }

  /**
   * Disable TOTP for a user
   */
  disableTotp({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiDisableTotp200Response>('/v2/totp/disable', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'disableTotp',
      body: {},
    });
  }

  /**
   * Disable frame notifications
   */
  disableFrameNotifications(
    body: ApiDisableFrameNotificationsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDisableFrameNotifications200Response>(
      '/v1/frame-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'disableFrameNotifications',
        body,
      },
    );
  }

  /**
   * Disable notifications on link cast activity.
   */
  disableChannelNotifications(
    body: ApiDisableChannelNotificationsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDisableChannelNotifications200Response>(
      '/v2/channel-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'disableChannelNotifications',
        body,
      },
    );
  }

  /**
   * Disable notifications on link cast activity.
   */
  disableLinkNotifications(
    body: ApiDisableLinkNotificationsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDisableLinkNotifications200Response>(
      '/v2/link-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'disableLinkNotifications',
        body,
      },
    );
  }

  /**
   * Discards a draft cast or caststorm
   */
  discardDraftCast(
    body: ApiDiscardDraftCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDiscardDraftCast200Response>('/v2/draft-casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'discardDraftCast',
      body,
    });
  }

  /**
   * Discord auth callbacks
   */
  authenticateDiscord({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<void>('/auth/discord', {
      headers,
      timeout,
      endpointName: 'authenticateDiscord',
    });
  }

  /**
   * Dismiss suggested users
   */
  dismissSuggestedUsers(
    body: ApiDismissSuggestedUsersRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiDismissSuggestedUsers200Response>(
      '/v1/dismiss-suggested-users',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'dismissSuggestedUsers',
        body,
      },
    );
  }

  /**
   * Dismiss the current nux task for 24h
   */
  dismissNuxTask(
    body: ApiDismissNuxTaskRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDismissNuxTask200Response>('/v2/nux/task/dismiss', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'dismissNuxTask',
      body,
    });
  }

  /**
   * Downvote casts
   */
  downvoteCast(
    body: ApiDownvoteCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiDownvoteCast200Response>('/v2/debug-cast-embeds', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'downvoteCast',
      body,
    });
  }

  /**
   * Enable frame notifications
   */
  enableFrameNotifications(
    body: ApiEnableFrameNotificationsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiEnableFrameNotifications200Response>(
      '/v1/frame-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'enableFrameNotifications',
        body,
      },
    );
  }

  /**
   * Enable notifications on link cast activity.
   */
  enableChannelNotifications(
    body: ApiEnableChannelNotificationsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiEnableChannelNotifications200Response>(
      '/v2/channel-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'enableChannelNotifications',
        body,
      },
    );
  }

  /**
   * Enable notifications on link cast activity.
   */
  enableLinkNotifications(
    body: ApiEnableLinkNotificationsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiEnableLinkNotifications200Response>(
      '/v2/link-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'enableLinkNotifications',
        body,
      },
    );
  }

  /**
   * End an audio room. Allowed for the room's host, an active cohost when the host has left, or a Farcaster internal team admin — disconnects all participants via LiveKit.
   */
  endAudioRoom(
    body: ApiEndAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiEndAudioRoom200Response>('/v1/audio-room/end', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'endAudioRoom',
      body,
    });
  }

  /**
   * Establish or update an E2EE synchronization channel between devices.
   */
  updateSyncChannel(
    body: ApiUpdateSyncChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUpdateSyncChannel200Response>('/v2/sync-channel', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateSyncChannel',
      body,
    });
  }

  /**
   * Execute an exchange of warps for USDC.
   */
  executeWarpsTrade({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiExecuteWarpsTrade200Response>(
      '/v2/warps/exchange/execute',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'executeWarpsTrade',
        body: {},
      },
    );
  }

  /**
   * Execute an onchain transaction
   */
  executeOnchainTx(
    body: ApiExecuteOnchainTxRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiExecuteOnchainTx200Response>('/v1/onchain/tx/execute', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'executeOnchainTx',
      body,
    });
  }

  /**
   * Execute the gasless swap
   */
  postSwapQuoteForGasSwap(
    body: ApiPostSwapQuoteForGasSwapRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostSwapQuoteForGasSwap200Response>(
      '/v2/swaps/gasless/execute',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postSwapQuoteForGasSwap',
        body,
      },
    );
  }

  /**
   * Explore bid on cast collectibles for a user.
   */
  exploreCastCollectibles({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiExploreCastCollectibles200Response>(
      '/v2/explore-cast-collectibles',
      {
        headers,
        timeout,
        endpointName: 'exploreCastCollectibles',
      },
    );
  }

  /**
   * Export miniapp user data
   */
  devToolsExportMiniAppUserData(
    params: ApiDevToolsExportMiniAppUserDataQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v1/dev-tools/export/miniapp-user-data', {
      headers,
      timeout,
      endpointName: 'devToolsExportMiniAppUserData',
      params,
    });
  }

  /**
   * Favorite a feed
   */
  addFavoriteFeed(
    body: ApiAddFavoriteFeedRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAddFavoriteFeed200Response>('/v2/favorite-feeds', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addFavoriteFeed',
      body,
    });
  }

  /**
   * Favorite a frame
   */
  addFavoriteFrame(
    body: ApiAddFavoriteFrameRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAddFavoriteFrame200Response>('/v1/favorite-frames', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addFavoriteFrame',
      body,
    });
  }

  /**
   * Feedback from user for a notification
   */
  ingestNotificationFeedback(
    body: ApiIngestNotificationFeedbackRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiIngestNotificationFeedback200Response>(
      '/v2/notification-feedback',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'ingestNotificationFeedback',
        body,
      },
    );
  }

  /**
   * Fetch chat messages — replies posted under the host's anchor cast for this Space (rootCastHash). Returns an empty list until the Space goes live and the anchor cast exists.
   */
  getAudioRoomChat(
    params: ApiGetAudioRoomChatQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAudioRoomChat200Response>(
      '/v1/audio-room/chat',
      {
        headers,
        timeout,
        endpointName: 'getAudioRoomChat',
        params,
      },
    );
  }

  /**
   * Fetch information about a key transaction
   */
  getKeyTransaction(
    params: ApiGetKeyTransactionQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetKeyTransaction200Response>(
      '/v2/key-transaction',
      {
        headers,
        timeout,
        endpointName: 'getKeyTransaction',
        params,
      },
    );
  }

  /**
   * Fetch possible metadata for direct cast message.
   */
  processDirectCastMessageMetadata(
    body: ApiProcessDirectCastMessageMetadataRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiProcessDirectCastMessageMetadata200Response>(
      '/v2/direct-cast-message-metadata',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'processDirectCastMessageMetadata',
        body,
      },
    );
  }

  /**
   * Fetch price data for native chain asset
   */
  getWalletChainNativeAsset(
    params: ApiGetWalletChainNativeAssetQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWalletChainNativeAsset200Response>(
      '/v2/wallet/chain-native-asset',
      {
        headers,
        timeout,
        endpointName: 'getWalletChainNativeAsset',
        params,
      },
    );
  }

  /**
   * Finalize in-app purchase flow for custody-token auth user.
   */
  finishInAppPurchaseWithCustody(
    body: ApiFinishInAppPurchaseWithCustodyRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFinishInAppPurchaseWithCustody200Response>(
      '/v2/finish-in-app-purchase-with-custody',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'finishInAppPurchaseWithCustody',
        body,
      },
    );
  }

  /**
   * Follow a channel
   */
  fcFollowChannel(
    body: ApiFcFollowChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcFollowChannel200Response>('/fc/channel-follows', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcFollowChannel',
      body,
    });
  }

  /**
   * Follow a feed.
   */
  createFeedFollow(
    body: ApiCreateFeedFollowRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateFeedFollow200Response>('/v2/feed-follows', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createFeedFollow',
      body,
    });
  }

  /**
   * Follow a user.
   */
  createFollow(
    body: ApiCreateFollowRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateFollow200Response>('/v2/follows', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createFollow',
      body,
    });
  }

  /**
   * Follow all starter pack users
   */
  followAllStarterPackUsers(
    body: ApiFollowAllStarterPackUsersRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiFollowAllStarterPackUsers200Response>(
      '/v2/follow-all-starter-pack-users',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'followAllStarterPackUsers',
        body,
      },
    );
  }

  /**
   * Follow all twitter following
   */
  followAllTwitterFollowing({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiFollowAllTwitterFollowing200Response>(
      '/v2/follow-all-twitter-following',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'followAllTwitterFollowing',
        body: {},
      },
    );
  }

  /**
   * Force add a moderator to a channel as an admin (skips invites)
   */
  adminAddChannelModerator(
    body: ApiAdminAddChannelModeratorRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAdminAddChannelModerator200Response>(
      '/v1/admin-add-channel-moderator',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminAddChannelModerator',
        body,
      },
    );
  }

  /**
   * Force change channel owner as an admin (skips invites)
   */
  adminChangeChannelOwner(
    body: ApiAdminChangeChannelOwnerRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAdminChangeChannelOwner200Response>(
      '/v1/admin-transfer-channel-ownership',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminChangeChannelOwner',
        body,
      },
    );
  }

  /**
   * Fork a published snap build into a new editable draft
   */
  postSnapAgentBuildFork(
    params: { buildId: string },
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostSnapAgentBuildFork200Response>(
      `/v2/snap/agent/builds/${encodeURIComponent(params.buildId)}/fork`,
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postSnapAgentBuildFork',
        body: {},
      },
    );
  }

  /**
   * Full text search through the contents of all DC messages the user has access to.
   */
  globalSearchForMessages(
    params: ApiGlobalSearchForMessagesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGlobalSearchForMessages200Response>(
      '/v2/direct-cast-message-search',
      {
        headers,
        timeout,
        endpointName: 'globalSearchForMessages',
        params,
      },
    );
  }

  /**
   * Generate a Coinbase Commerce URL for opening a webview
   */
  generateCoinbaseCommerceHostedUiUrl(
    body: ApiGenerateCoinbaseCommerceHostedUiUrlRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGenerateCoinbaseCommerceHostedUiUrl200Response>(
      '/v2/onramp/coinbase/hosted-ui',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'generateCoinbaseCommerceHostedUiUrl',
        body,
      },
    );
  }

  /**
   * Generate a SIWE nonce to be used for registration
   */
  getSiweNonce({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetSiweNonce200Response>('/v2/get-siwe-nonce', {
      headers,
      timeout,
      endpointName: 'getSiweNonce',
    });
  }

  /**
   * Generate a TOTP token
   */
  generateTotpToken(
    body: ApiGenerateTotpTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGenerateTotpToken200Response>(
      '/v2/totp/generate-token',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'generateTotpToken',
        body,
      },
    );
  }

  /**
   * Generate a TOTP token for email
   */
  generateTotpTokenForEmail(
    body: ApiGenerateTotpTokenForEmailRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGenerateTotpTokenForEmail200Response>(
      '/v2/totp/generate-token-for-email',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'generateTotpTokenForEmail',
        body,
      },
    );
  }

  /**
   * Generate a nonce to be used for get-dc-auth-token
   */
  getDCNonce({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetDCNonce200Response>('/v2/get-dc-nonce', {
      headers,
      timeout,
      endpointName: 'getDCNonce',
    });
  }

  /**
   * Generate a unique URL that can be used to upload an image directly to Cloudflare.
   */
  generateImageUploadUrl({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiGenerateImageUploadUrl201Response>(
      '/v1/generate-image-upload-url',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'generateImageUploadUrl',
        body: {},
      },
    );
  }

  /**
   * Generate an EIP-712 hash to add a Warpcast app signer for an external FID user.
   */
  generateExternalUserSignerHash(
    body: ApiGenerateExternalUserSignerHashRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiGenerateExternalUserSignerHash200Response>(
      '/v2/external-user-signer-hash',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'generateExternalUserSignerHash',
        body,
      },
    );
  }

  /**
   * Generates a SIWE nonce
   */
  getStepUpMessage({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetStepUpMessage200Response>('/v2/auth/step-up', {
      headers,
      timeout,
      endpointName: 'getStepUpMessage',
    });
  }

  /**
   * Generates a cast collectible artifact image
   */
  getCastCollectibleArtifact(
    params: ApiGetCastCollectibleArtifactQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/cast-collectibles/artifact', {
      headers,
      timeout,
      endpointName: 'getCastCollectibleArtifact',
      params,
    });
  }

  /**
   * Generates an API key.
   */
  createApiKey(
    body: ApiCreateApiKeyRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateApiKey200Response>('/v2/api-keys', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createApiKey',
      body,
    });
  }

  /**
   * Generates an OpenGraph image
   */
  generateOpenGraphImage(
    params: ApiGenerateOpenGraphImageQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/og-image', {
      headers,
      timeout,
      endpointName: 'generateOpenGraphImage',
      params,
    });
  }

  /**
   * Generates an collectible cast background image
   */
  getCastCollectibleBackgroundImage(
    params: ApiGetCastCollectibleBackgroundImageQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/cast-collectibles/background-image', {
      headers,
      timeout,
      endpointName: 'getCastCollectibleBackgroundImage',
      params,
    });
  }

  /**
   * Generates an default image for a channel
   */
  generateChannelImage(
    params: ApiGenerateChannelImageQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/channel-image', {
      headers,
      timeout,
      endpointName: 'generateChannelImage',
      params,
    });
  }

  /**
   * Generates an niceley formatted cast image for sharing
   */
  generateCastShareableImage(
    params: ApiGenerateCastShareableImageQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/cast-image', {
      headers,
      timeout,
      endpointName: 'generateCastShareableImage',
      params,
    });
  }

  /**
   * Generates an nicely formatted image for invite links
   */
  generateInviteOpenGraphImage(
    params: ApiGenerateInviteOpenGraphImageQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/invite-image', {
      headers,
      timeout,
      endpointName: 'generateInviteOpenGraphImage',
      params,
    });
  }

  /**
   * Get Discord auth link to redirect authenticated user
   */
  getDiscordAuthLink({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetDiscordAuthLink200Response>(
      '/v2/get-discord-auth-link',
      {
        headers,
        timeout,
        endpointName: 'getDiscordAuthLink',
      },
    );
  }

  /**
   * Get Farcaster Pro details for subscribing with USDC
   */
  farcasterProSubscribeWithUsdcDetails(
    params: ApiFarcasterProSubscribeWithUsdcDetailsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFarcasterProSubscribeWithUsdcDetails200Response>(
      '/v1/farcaster-pro/subscribe-with-usdc-details',
      {
        headers,
        timeout,
        endpointName: 'farcasterProSubscribeWithUsdcDetails',
        params,
      },
    );
  }

  /**
   * Get Farcaster Pro details for subscribing with warps
   */
  farcasterProSubscribeWithWarpsDetails(
    params: ApiFarcasterProSubscribeWithWarpsDetailsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFarcasterProSubscribeWithWarpsDetails200Response>(
      '/v1/farcaster-pro/subscribe-with-warps-details',
      {
        headers,
        timeout,
        endpointName: 'farcasterProSubscribeWithWarpsDetails',
        params,
      },
    );
  }

  /**
   * Get Farcaster morpho vault data
   */
  getMorphoFarcasterVault({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetMorphoFarcasterVault200Response>(
      '/v1/onchain/morpho/farcaster-vault',
      {
        headers,
        timeout,
        endpointName: 'getMorphoFarcasterVault',
      },
    );
  }

  /**
   * Get Farcasters matched through uploaded contacts
   */
  getContactsUsers(
    params: ApiGetContactsUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetContactsUsers200Response>(
      '/v2/contacts-users',
      {
        headers,
        timeout,
        endpointName: 'getContactsUsers',
        params,
      },
    );
  }

  /**
   * Get GitHub auth link to redirect authenticated user
   */
  getGitHubAuthLink({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetGitHubAuthLink200Response>(
      '/v2/get-gh-auth-link',
      {
        headers,
        timeout,
        endpointName: 'getGitHubAuthLink',
      },
    );
  }

  /**
   * Get LinkedIn auth link to redirect authenticated user
   */
  getLinkedInAuthLink({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetLinkedInAuthLink200Response>(
      '/v2/get-linkedin-auth-link',
      {
        headers,
        timeout,
        endpointName: 'getLinkedInAuthLink',
      },
    );
  }

  /**
   * Get TTL for direct casts authenticated user is a part of. (deprecated)
   */
  getDirectCastTTLs({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetDirectCastTTLs200Response>(
      '/v2/direct-cast-ttls',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastTTLs',
      },
    );
  }

  /**
   * Get Users that used the current user's referral code
   */
  getReferrals(
    params: ApiGetReferralsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetReferrals200Response>('/v2/referrals', {
      headers,
      timeout,
      endpointName: 'getReferrals',
      params,
    });
  }

  /**
   * Get Warpcast SKU offering for various onchain transactions.
   */
  getOffering(
    params: ApiGetOfferingQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOffering200Response>('/v2/offering', {
      headers,
      timeout,
      endpointName: 'getOffering',
      params,
    });
  }

  /**
   * Get Warpcast product catalog and all offerings.
   */
  getProductCatalog({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetProductCatalog200Response>(
      '/v2/product-catalog',
      {
        headers,
        timeout,
        endpointName: 'getProductCatalog',
      },
    );
  }

  /**
   * Get Warpcast rent storage offering SKUs
   */
  getRentStorageOfferings({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetRentStorageOfferings200Response>(
      '/v2/rent-storage-offerings',
      {
        headers,
        timeout,
        endpointName: 'getRentStorageOfferings',
      },
    );
  }

  /**
   * Get Warpcast warps offering for signers feature specifically.
   */
  getWarpsOffering(
    params: ApiGetWarpsOfferingQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWarpsOffering200Response>(
      '/v2/warps-offering',
      {
        headers,
        timeout,
        endpointName: 'getWarpsOffering',
        params,
      },
    );
  }

  /**
   * Get X auth link to redirect authenticated user
   */
  getXAuthLink({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetXAuthLink200Response>('/v2/get-x-auth-link', {
      headers,
      timeout,
      endpointName: 'getXAuthLink',
    });
  }

  /**
   * Get X auth link to redirect authenticated user
   */
  startOnboardingXAuthLink(
    body: ApiStartOnboardingXAuthLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiStartOnboardingXAuthLink200Response>(
      '/v2/start-onboarding-x-auth-link',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'startOnboardingXAuthLink',
        body,
      },
    );
  }

  /**
   * Get XP quick view for a user
   */
  xpClaimableSummary({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiXpClaimableSummary200Response>(
      '/v2/xp-claimable-summary',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'xpClaimableSummary',
        body: {},
      },
    );
  }

  /**
   * Get XP quick view for a user
   */
  xpQuickView({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiXpQuickView200Response>('/v2/xp-quick-view', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'xpQuickView',
      body: {},
    });
  }

  /**
   * Get XP rewards for a user
   */
  getXPRewards(
    params: ApiGetXPRewardsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetXPRewards200Response>('/v2/xp-rewards', {
      headers,
      timeout,
      endpointName: 'getXPRewards',
      params,
    });
  }

  /**
   * Get a batch of tokens by ids
   */
  getTokens(
    params: ApiGetTokensQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokens200Response>('/v2/tokens', {
      headers,
      timeout,
      endpointName: 'getTokens',
      params,
    });
  }

  /**
   * Get a direct cast conversation.
   */
  fcGetConversation(
    params: ApiFcGetConversationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetConversation200Response>('/fc/conversation', {
      headers,
      timeout,
      endpointName: 'fcGetConversation',
      params,
    });
  }

  /**
   * Get a direct cast group's invites.
   */
  fcGetGroupInvites(
    params: ApiFcGetGroupInvitesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetGroupInvites200Response>(
      '/fc/group-invites',
      {
        headers,
        timeout,
        endpointName: 'fcGetGroupInvites',
        params,
      },
    );
  }

  /**
   * Get a direct cast group's members.
   */
  fcGetGroupMembers(
    params: ApiFcGetGroupMembersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetGroupMembers200Response>(
      '/fc/group-members',
      {
        headers,
        timeout,
        endpointName: 'fcGetGroupMembers',
        params,
      },
    );
  }

  /**
   * Get a direct cast group.
   */
  fcGetGroup(
    params: ApiFcGetGroupQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetGroup200Response>('/fc/group', {
      headers,
      timeout,
      endpointName: 'fcGetGroup',
      params,
    });
  }

  /**
   * Get a direct cast message.
   */
  fcGetMessage(
    params: ApiFcGetMessageQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetMessage200Response>('/fc/message', {
      headers,
      timeout,
      endpointName: 'fcGetMessage',
      params,
    });
  }

  /**
   * Get a list of direct cast conversations.
   */
  fcGetConversationList(
    params: ApiFcGetConversationListQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetConversationList200Response>(
      '/fc/conversation-list',
      {
        headers,
        timeout,
        endpointName: 'fcGetConversationList',
        params,
      },
    );
  }

  /**
   * Get a list of direct cast groups.
   */
  fcGetGroupList(
    params: ApiFcGetGroupListQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetGroupList200Response>('/fc/group-list', {
      headers,
      timeout,
      endpointName: 'fcGetGroupList',
      params,
    });
  }

  /**
   * Get a list of direct cast messages.
   */
  fcGetMessageList(
    params: ApiFcGetMessageListQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetMessageList200Response>('/fc/message-list', {
      headers,
      timeout,
      endpointName: 'fcGetMessageList',
      params,
    });
  }

  /**
   * Get a list of prediction events
   */
  getPredictionEvents(
    params: ApiGetPredictionEventsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPredictionEvents200Response>(
      '/v1/predictions/events',
      {
        headers,
        timeout,
        endpointName: 'getPredictionEvents',
        params,
      },
    );
  }

  /**
   * Get a list of the actors for a specified notification group.
   */
  getNotificationActorsInGroup(
    params: ApiGetNotificationActorsInGroupQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetNotificationActorsInGroup200Response>(
      '/v2/notification-group-actors',
      {
        headers,
        timeout,
        endpointName: 'getNotificationActorsInGroup',
        params,
      },
    );
  }

  /**
   * Get a miniapp manifest
   */
  devToolsGetMiniAppManifest(
    params: ApiDevToolsGetMiniAppManifestQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsGetMiniAppManifest200Response>(
      '/v1/dev-tools/get-manifest',
      {
        headers,
        timeout,
        endpointName: 'devToolsGetMiniAppManifest',
        params,
      },
    );
  }

  /**
   * Get a quote for an onchain swap
   */
  getOnchainSwapQuote(
    body: ApiGetOnchainSwapQuoteRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGetOnchainSwapQuote200Response>(
      '/v1/onchain/swaps/quote',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getOnchainSwapQuote',
        body,
      },
    );
  }

  /**
   * Get a recovery
   */
  getRecovery(
    params: ApiGetRecoveryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRecovery200Response>('/v2/recoveries', {
      headers,
      timeout,
      endpointName: 'getRecovery',
      params,
    });
  }

  /**
   * Get a signed key request.
   */
  getSignedKeyRequest(
    params: ApiGetSignedKeyRequestQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSignedKeyRequest200Response>(
      '/v2/signed-key-request',
      {
        headers,
        timeout,
        endpointName: 'getSignedKeyRequest',
        params,
      },
    );
  }

  /**
   * Get a small quote to enable gas on a chain
   */
  getSwapQuoteForGasSwap(
    params: ApiGetSwapQuoteForGasSwapQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSwapQuoteForGasSwap200Response>(
      '/v2/swaps/get-gas-bootstrap',
      {
        headers,
        timeout,
        endpointName: 'getSwapQuoteForGasSwap',
        params,
      },
    );
  }

  /**
   * Get a temporary account association
   */
  devToolsGetTempAccountAssociation(
    params: ApiDevToolsGetTempAccountAssociationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsGetTempAccountAssociation200Response>(
      '/v1/dev-tools/temp-account-association',
      {
        headers,
        timeout,
        endpointName: 'devToolsGetTempAccountAssociation',
        params,
      },
    );
  }

  /**
   * Get a user's collection of casts.
   */
  getUserCastCollectibles(
    params: ApiGetUserCastCollectiblesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserCastCollectibles200Response>(
      '/v2/cast-collectibles/collection',
      {
        headers,
        timeout,
        endpointName: 'getUserCastCollectibles',
        params,
      },
    );
  }

  /**
   * Get a user's warpcast wallet resource
   */
  walletResource(
    body: ApiWalletResourceRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiWalletResource200Response>('/v2/wallet/resource', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'walletResource',
      body,
    });
  }

  /**
   * Get a video
   */
  getVideo(
    params: { uid: string },
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>(
      `/v1/video/${encodeURIComponent(params.uid)}.m3u8`,
      {
        headers,
        timeout,
        endpointName: 'getVideo',
      },
    );
  }

  /**
   * Get active article
   */
  getArticle(
    params: ApiGetArticleQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetArticle200Response>('/v2/article', {
      headers,
      timeout,
      endpointName: 'getArticle',
      params,
    });
  }

  /**
   * Get activity for a wallet
   */
  getWalletActivity(
    params: ApiGetWalletActivityQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWalletActivity200Response>(
      '/v2/wallet/activity',
      {
        headers,
        timeout,
        endpointName: 'getWalletActivity',
        params,
      },
    );
  }

  /**
   * Get all API keys for a user.
   */
  getApiKeys({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetApiKeys200Response>('/v2/api-keys', {
      headers,
      timeout,
      endpointName: 'getApiKeys',
    });
  }

  /**
   * Get all account verifications for a user
   */
  getAccountVerifications({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetAccountVerifications200Response>(
      '/v2/account-verifications',
      {
        headers,
        timeout,
        endpointName: 'getAccountVerifications',
      },
    );
  }

  /**
   * Get all account verifications for a user V2
   */
  getAccountVerificationsV2({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetAccountVerificationsV2200Response>(
      '/v2/account-verifications-v2',
      {
        headers,
        timeout,
        endpointName: 'getAccountVerificationsV2',
      },
    );
  }

  /**
   * Get all active news
   */
  getNews(
    params: ApiGetNewsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetNews200Response>('/v2/news', {
      headers,
      timeout,
      endpointName: 'getNews',
      params,
    });
  }

  /**
   * Get all available usernames for the authenticated user
   */
  getUserUsernames({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetUserUsernames200Response>(
      '/v2/user-usernames',
      {
        headers,
        timeout,
        endpointName: 'getUserUsernames',
      },
    );
  }

  /**
   * Get all bookmarked casts.
   */
  getBookmarkedCasts(
    params: ApiGetBookmarkedCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetBookmarkedCasts200Response>(
      '/v2/bookmarked-casts',
      {
        headers,
        timeout,
        endpointName: 'getBookmarkedCasts',
        params,
      },
    );
  }

  /**
   * Get all casts in reverse chronological order.
   */
  getAllRecentCasts(
    params: ApiGetAllRecentCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAllRecentCasts200Response>('/v2/recent-casts', {
      headers,
      timeout,
      endpointName: 'getAllRecentCasts',
      params,
    });
  }

  /**
   * Get all connected accounts for authenticated user
   */
  getConnectedAccounts(
    params: ApiGetConnectedAccountsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetConnectedAccounts200Response>(
      '/v2/connected-accounts',
      {
        headers,
        timeout,
        endpointName: 'getConnectedAccounts',
        params,
      },
    );
  }

  /**
   * Get all direct cast users the authenticated user can start a conversation with.
   */
  getDirectCastUsers(
    params: ApiGetDirectCastUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastUsers200Response>(
      '/v2/direct-cast-users',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastUsers',
        params,
      },
    );
  }

  /**
   * Get all like reactions for a cast.
   */
  getCastLikes(
    params: ApiGetCastLikesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCastLikes200Response>('/v2/cast-likes', {
      headers,
      timeout,
      endpointName: 'getCastLikes',
      params,
    });
  }

  /**
   * Get all members of a starter pack
   */
  fcGetStarterPackUsers(
    params: ApiFcGetStarterPackUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetStarterPackUsers200Response>(
      '/fc/starter-pack-members',
      {
        headers,
        timeout,
        endpointName: 'fcGetStarterPackUsers',
        params,
      },
    );
  }

  /**
   * Get all no-fee allowlist entries (internal)
   */
  retoolGetNoFeeAllowlist({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiRetoolGetNoFeeAllowlist200Response>(
      '/v2/retool-no-fee-allowlist',
      {
        headers,
        timeout,
        endpointName: 'retoolGetNoFeeAllowlist',
      },
    );
  }

  /**
   * Get all of casts liked by user.
   */
  getUserLikedCasts(
    params: ApiGetUserLikedCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserLikedCasts200Response>(
      '/v2/user-liked-casts',
      {
        headers,
        timeout,
        endpointName: 'getUserLikedCasts',
        params,
      },
    );
  }

  /**
   * Get all possible interests to showcase to user during onboarding
   */
  getOnboardingInterests(
    params: ApiGetOnboardingInterestsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnboardingInterests200Response>(
      '/v2/onboarding-interests',
      {
        headers,
        timeout,
        endpointName: 'getOnboardingInterests',
        params,
      },
    );
  }

  /**
   * Get all preferences for the authenticated user.
   */
  getUserPreferences({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetUserPreferences200Response>(
      '/v2/user-preferences',
      {
        headers,
        timeout,
        endpointName: 'getUserPreferences',
      },
    );
  }

  /**
   * Get all quotes of a cast.
   */
  getCastQuotes(
    params: ApiGetCastQuotesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCastQuotes200Response>('/v2/cast-quotes', {
      headers,
      timeout,
      endpointName: 'getCastQuotes',
      params,
    });
  }

  /**
   * Get all reactions (both likes and recasts) for a cast.
   */
  getCastReactions(
    params: ApiGetCastReactionsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCastReactions200Response>(
      '/v2/cast-reactions',
      {
        headers,
        timeout,
        endpointName: 'getCastReactions',
        params,
      },
    );
  }

  /**
   * Get all signers for a user.
   */
  getSigners(
    params: ApiGetSignersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSigners200Response>('/v2/signers', {
      headers,
      timeout,
      endpointName: 'getSigners',
      params,
    });
  }

  /**
   * Get all starter packs on the network
   */
  getAllStarterPacks(
    params: ApiGetAllStarterPacksQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAllStarterPacks200Response>(
      '/v2/starter-packs/all',
      {
        headers,
        timeout,
        endpointName: 'getAllStarterPacks',
        params,
      },
    );
  }

  /**
   * Get all the viewed casts for a user that are stored in Redis.
   */
  getUserViewedCasts(
    params: ApiGetUserViewedCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserViewedCasts200Response>(
      '/v2/user-viewed-casts',
      {
        headers,
        timeout,
        endpointName: 'getUserViewedCasts',
        params,
      },
    );
  }

  /**
   * Get all users blocked from using the app
   */
  getAppBlockedUsers({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetAppBlockedUsers200Response>(
      '/v1/app-blocked-users',
      {
        headers,
        timeout,
        endpointName: 'getAppBlockedUsers',
      },
    );
  }

  /**
   * Get all users that follow the specified channel that the viewer follows.
   */
  getChannelFollowersYouKnow(
    params: ApiGetChannelFollowersYouKnowQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelFollowersYouKnow200Response>(
      '/v2/channel-followers-you-know',
      {
        headers,
        timeout,
        endpointName: 'getChannelFollowersYouKnow',
        params,
      },
    );
  }

  /**
   * Get all users that follow the specified channel.
   */
  getChannelFollowers(
    params: ApiGetChannelFollowersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelFollowers200Response>(
      '/v2/channel-followers',
      {
        headers,
        timeout,
        endpointName: 'getChannelFollowers',
        params,
      },
    );
  }

  /**
   * Get all users that follow the specified user that viewer knows.
   */
  getFollowersYouKnow(
    params: ApiGetFollowersYouKnowQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFollowersYouKnow200Response>(
      '/v2/followers-you-know',
      {
        headers,
        timeout,
        endpointName: 'getFollowersYouKnow',
        params,
      },
    );
  }

  /**
   * Get all users that follow the specified user.
   */
  getFollowers(
    params: ApiGetFollowersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFollowers200Response>('/v2/followers', {
      headers,
      timeout,
      endpointName: 'getFollowers',
      params,
    });
  }

  /**
   * Get all users the specified user is following.
   */
  getFollowing(
    params: ApiGetFollowingQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFollowing200Response>('/v2/following', {
      headers,
      timeout,
      endpointName: 'getFollowing',
      params,
    });
  }

  /**
   * Get all users who recasted a cast.
   */
  getCastRecasters(
    params: ApiGetCastRecastersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCastRecasters200Response>(
      '/v2/cast-recasters',
      {
        headers,
        timeout,
        endpointName: 'getCastRecasters',
        params,
      },
    );
  }

  /**
   * Get all users with a particular profile location.
   */
  getUsersByLocation(
    params: ApiGetUsersByLocationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUsersByLocation200Response>(
      '/v2/location-users',
      {
        headers,
        timeout,
        endpointName: 'getUsersByLocation',
        params,
      },
    );
  }

  /**
   * Get all verifications for the specified user.
   */
  getVerifications(
    params: ApiGetVerificationsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetVerifications200Response>('/v2/verifications', {
      headers,
      timeout,
      endpointName: 'getVerifications',
      params,
    });
  }

  /**
   * Get an active campaign
   */
  getCampaign(
    params: ApiGetCampaignQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCampaign200Response>('/v2/campaign', {
      headers,
      timeout,
      endpointName: 'getCampaign',
      params,
    });
  }

  /**
   * Get an auth token for calling direct cast APIs
   */
  getDCAuthToken(
    params: ApiGetDCAuthTokenQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDCAuthToken200Response>(
      '/v2/get-dc-auth-token',
      {
        headers,
        timeout,
        endpointName: 'getDCAuthToken',
        params,
      },
    );
  }

  /**
   * Get an explore feed for users
   */
  getExploreFeed({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetExploreFeed200Response>('/v2/explore-feed', {
      headers,
      timeout,
      endpointName: 'getExploreFeed',
    });
  }

  /**
   * Get an onchain limit order by ID
   */
  getLimitOrderById(
    params: { orderId: string },
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetLimitOrderById200Response>(
      `/v1/onchain/limit-orders/${encodeURIComponent(params.orderId)}`,
      {
        headers,
        timeout,
        endpointName: 'getLimitOrderById',
      },
    );
  }

  /**
   * Get an onchain token
   */
  getOnchainToken(
    params: ApiGetOnchainTokenQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainToken200Response>('/v1/onchain/tokens', {
      headers,
      timeout,
      endpointName: 'getOnchainToken',
      params,
    });
  }

  /**
   * Get an onchain token candlestick chart
   */
  getOnchainTokenCandlestickChart(
    params: ApiGetOnchainTokenCandlestickChartQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainTokenCandlestickChart200Response>(
      '/v1/onchain/tokens/candlestick-chart',
      {
        headers,
        timeout,
        endpointName: 'getOnchainTokenCandlestickChart',
        params,
      },
    );
  }

  /**
   * Get an onchain token line chart
   */
  getOnchainTokenLineChart(
    params: ApiGetOnchainTokenLineChartQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainTokenLineChart200Response>(
      '/v1/onchain/tokens/line-chart',
      {
        headers,
        timeout,
        endpointName: 'getOnchainTokenLineChart',
        params,
      },
    );
  }

  /**
   * Get and claim a saved deferred deep link by ip and user agent.
   */
  getSavedDeferredDeepLink(
    body: ApiGetSavedDeferredDeepLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGetSavedDeferredDeepLink200Response>(
      '/deferred-deep-links/claim',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getSavedDeferredDeepLink',
        body,
      },
    );
  }

  /**
   * Get app launcher
   */
  getAppLauncher(
    params: ApiGetAppLauncherQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAppLauncher200Response>('/v1/app-launcher', {
      headers,
      timeout,
      endpointName: 'getAppLauncher',
      params,
    });
  }

  /**
   * Get application context for the current user.
   */
  getUserAppContext({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetUserAppContext200Response>(
      '/v2/user-app-context',
      {
        headers,
        timeout,
        endpointName: 'getUserAppContext',
      },
    );
  }

  /**
   * Get apps by author
   */
  getAppsByAuthor(
    params: ApiGetAppsByAuthorQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAppsByAuthor200Response>('/v1/apps-by-author', {
      headers,
      timeout,
      endpointName: 'getAppsByAuthor',
      params,
    });
  }

  /**
   * Get apps by category
   */
  getAppsByCategory(
    params: ApiGetAppsByCategoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAppsByCategory200Response>(
      '/v1/apps-by-category',
      {
        headers,
        timeout,
        endpointName: 'getAppsByCategory',
        params,
      },
    );
  }

  /**
   * Get autocomplete predictions for a location query.
   */
  findLocation(
    params: ApiFindLocationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFindLocation200Response>('/v2/find-location', {
      headers,
      timeout,
      endpointName: 'findLocation',
      params,
    });
  }

  /**
   * Get balance of warps
   */
  getWarpsBalance(
    params: ApiGetWarpsBalanceQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWarpsBalance200Response>('/v2/warps-balance', {
      headers,
      timeout,
      endpointName: 'getWarpsBalance',
      params,
    });
  }

  /**
   * Get bid history for a cast collectible.
   */
  getCastCollectibleBidHistory(
    params: ApiGetCastCollectibleBidHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCastCollectibleBidHistory200Response>(
      '/v2/cast-collectibles/bid-history',
      {
        headers,
        timeout,
        endpointName: 'getCastCollectibleBidHistory',
        params,
      },
    );
  }

  /**
   * Get blocked Snap URLs, normalized to origin + pathname without query string or hash.
   */
  getSnapBlocklist({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetSnapBlocklist200Response>(
      '/v2/snap/blocklist',
      {
        headers,
        timeout,
        endpointName: 'getSnapBlocklist',
      },
    );
  }

  /**
   * Get blocked users for a user
   */
  getBlockedUsers(
    params: ApiGetBlockedUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetBlockedUsers200Response>(
      '/v2/get-blocked-users',
      {
        headers,
        timeout,
        endpointName: 'getBlockedUsers',
        params,
      },
    );
  }

  /**
   * Get cast moderations
   */
  fcGetModeratedCasts(
    params: ApiFcGetModeratedCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetModeratedCasts200Response>(
      '/fc/moderated-casts',
      {
        headers,
        timeout,
        endpointName: 'fcGetModeratedCasts',
        params,
      },
    );
  }

  /**
   * Get casts corresponding to the specified thread given by the cast hash prefix and username, filtered for relevancy.
   */
  getUserThreadCasts(
    params: ApiGetUserThreadCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserThreadCasts200Response>(
      '/v2/user-thread-casts',
      {
        headers,
        timeout,
        endpointName: 'getUserThreadCasts',
        params,
      },
    );
  }

  /**
   * Get casts corresponding to the specified thread, filtered for relevancy.
   */
  getThread(
    params: ApiGetThreadQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetThread200Response>('/v2/thread-casts', {
      headers,
      timeout,
      endpointName: 'getThread',
      params,
    });
  }

  /**
   * Get casts that embed a specific token
   */
  getTokenEmbedFeed(
    params: ApiGetTokenEmbedFeedQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenEmbedFeed200Response>(
      '/v2/token-embed-feed',
      {
        headers,
        timeout,
        endpointName: 'getTokenEmbedFeed',
        params,
      },
    );
  }

  /**
   * Get combined unseen counts for notifications, direct casts, warps & invites.
   */
  getUnseen({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetUnseen200Response>('/v2/unseen', {
      headers,
      timeout,
      endpointName: 'getUnseen',
    });
  }

  /**
   * Get creator rewards earnings history
   */
  getCreatorRewardsEarningsHistory(
    params: ApiGetCreatorRewardsEarningsHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCreatorRewardsEarningsHistory200Response>(
      '/v1/creator-rewards-earnings-history',
      {
        headers,
        timeout,
        endpointName: 'getCreatorRewardsEarningsHistory',
        params,
      },
    );
  }

  /**
   * Get creator rewards leaderboard
   */
  getCreatorRewardsLeaderboard(
    params: ApiGetCreatorRewardsLeaderboardQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCreatorRewardsLeaderboard200Response>(
      '/v1/creator-rewards-leaderboard',
      {
        headers,
        timeout,
        endpointName: 'getCreatorRewardsLeaderboard',
        params,
      },
    );
  }

  /**
   * Get creator rewards metadata
   */
  getCreatorRewardsMetadata({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetCreatorRewardsMetadata200Response>(
      '/v1/creator-rewards-metadata',
      {
        headers,
        timeout,
        endpointName: 'getCreatorRewardsMetadata',
      },
    );
  }

  /**
   * Get creator rewards payout eligibility for a user
   */
  getCreatorRewardsPayoutEligibilityForUser(
    params: ApiGetCreatorRewardsPayoutEligibilityForUserQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCreatorRewardsPayoutEligibilityForUser200Response>(
      '/v1/creator-rewards-payout-eligibility-for-user',
      {
        headers,
        timeout,
        endpointName: 'getCreatorRewardsPayoutEligibilityForUser',
        params,
      },
    );
  }

  /**
   * Get creator rewards period summary
   */
  getCreatorRewardsPeriodSummary(
    params: ApiGetCreatorRewardsPeriodSummaryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCreatorRewardsPeriodSummary200Response>(
      '/v1/creator-rewards-period-summary',
      {
        headers,
        timeout,
        endpointName: 'getCreatorRewardsPeriodSummary',
        params,
      },
    );
  }

  /**
   * Get creator rewards scores for a user
   */
  getCreatorRewardsForUser(
    params: ApiGetCreatorRewardsForUserQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCreatorRewardsForUser200Response>(
      '/v1/creator-rewards-scores-for-user',
      {
        headers,
        timeout,
        endpointName: 'getCreatorRewardsForUser',
        params,
      },
    );
  }

  /**
   * Get creator rewards winner history
   */
  getCreatorRewardsWinnerHistory(
    params: ApiGetCreatorRewardsWinnerHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCreatorRewardsWinnerHistory200Response>(
      '/v1/creator-rewards-winner-history',
      {
        headers,
        timeout,
        endpointName: 'getCreatorRewardsWinnerHistory',
        params,
      },
    );
  }

  /**
   * Get detailed properties for the muted keyword
   */
  getMutedKeyword(
    params: ApiGetMutedKeywordQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetMutedKeyword200Response>('/v2/muted-keyword', {
      headers,
      timeout,
      endpointName: 'getMutedKeyword',
      params,
    });
  }

  /**
   * Get details about a connected app
   */
  getConnectedApp(
    params: ApiGetConnectedAppQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetConnectedApp200Response>('/v1/connected-app', {
      headers,
      timeout,
      endpointName: 'getConnectedApp',
      params,
    });
  }

  /**
   * Get details about a frame based on a domain
   */
  getFrameDetails(
    params: ApiGetFrameDetailsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFrameDetails200Response>('/v1/frame', {
      headers,
      timeout,
      endpointName: 'getFrameDetails',
      params,
    });
  }

  /**
   * Get details about all non-following channels, and include a summary of the followed ones.
   */
  discoverChannels(
    params: ApiDiscoverChannelsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDiscoverChannels200Response>(
      '/v2/discover-channels',
      {
        headers,
        timeout,
        endpointName: 'discoverChannels',
        params,
      },
    );
  }

  /**
   * Get details for an existing invite.
   */
  getInvite(
    params: ApiGetInviteQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetInvite200Response>('/v2/invite', {
      headers,
      timeout,
      endpointName: 'getInvite',
      params,
    });
  }

  /**
   * Get developer rewards winner history (public)
   */
  getPublicDeveloperRewardsWinnerHistory(
    params: ApiGetPublicDeveloperRewardsWinnerHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPublicDeveloperRewardsWinnerHistory200Response>(
      '/v1/developer-rewards-winner-history',
      {
        headers,
        timeout,
        endpointName: 'getPublicDeveloperRewardsWinnerHistory',
        params,
      },
    );
  }

  /**
   * Get direct cast conversation (if authed user has access)
   */
  getDirectCastConversation(
    params: ApiGetDirectCastConversationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastConversation200Response>(
      '/v2/direct-cast-conversation',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastConversation',
        params,
      },
    );
  }

  /**
   * Get earnings for the authenticated Farcaster user
   */
  getFarcasterEarnings(
    params: ApiGetFarcasterEarningsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFarcasterEarnings200Response>(
      '/v2/farcaster-earnings',
      {
        headers,
        timeout,
        endpointName: 'getFarcasterEarnings',
        params,
      },
    );
  }

  /**
   * Get extra details about a channel
   */
  getChannelDetails(
    params: ApiGetChannelDetailsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelDetails200Response>(
      '/v1/channel-details',
      {
        headers,
        timeout,
        endpointName: 'getChannelDetails',
        params,
      },
    );
  }

  /**
   * Get favorite frames
   */
  getFavoriteFrames(
    params: ApiGetFavoriteFramesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFavoriteFrames200Response>(
      '/v1/favorite-frames',
      {
        headers,
        timeout,
        endpointName: 'getFavoriteFrames',
        params,
      },
    );
  }

  /**
   * Get featured mint information
   */
  getFeaturedMint(
    params: ApiGetFeaturedMintQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFeaturedMint200Response>('/v1/featured-mint', {
      headers,
      timeout,
      endpointName: 'getFeaturedMint',
      params,
    });
  }

  /**
   * Get featured mint transaction data
   */
  getFeaturedMintTransaction(
    params: ApiGetFeaturedMintTransactionQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFeaturedMintTransaction200Response>(
      '/v1/featured-mint-transaction',
      {
        headers,
        timeout,
        endpointName: 'getFeaturedMintTransaction',
        params,
      },
    );
  }

  /**
   * Get feed items for OpenGraph
   */
  getOgFeedItems(
    params: ApiGetOgFeedItemsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOgFeedItems200Response>('/v2/og-feed-items', {
      headers,
      timeout,
      endpointName: 'getOgFeedItems',
      params,
    });
  }

  /**
   * Get feed items, excluding ones the client already has
   */
  getFeedItems(
    body: ApiGetFeedItemsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGetFeedItems200Response>('/v2/feed-items', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'getFeedItems',
      body,
    });
  }

  /**
   * Get flag indicating whether invites page has been viewed since nudge indicator shown
   */
  getInvitesViewed({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetInvitesViewed200Response>(
      '/v2/invites-viewed',
      {
        headers,
        timeout,
        endpointName: 'getInvitesViewed',
      },
    );
  }

  /**
   * Get flag indicating whether invites page has been viewed since nudge indicator shown
   */
  setInvitesViewed({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiSetInvitesViewed200Response>('/v2/invites-viewed', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setInvitesViewed',
      body: {},
    });
  }

  /**
   * Get global frame analytics data
   */
  getGlobalFrameAnalytics(
    params: ApiGetGlobalFrameAnalyticsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetGlobalFrameAnalytics200Response>(
      '/v2/global-frame-analytics',
      {
        headers,
        timeout,
        endpointName: 'getGlobalFrameAnalytics',
        params,
      },
    );
  }

  /**
   * Get hidden replies for a thread of a focused cast
   */
  getUserThreadHiddenReplies(
    params: ApiGetUserThreadHiddenRepliesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserThreadHiddenReplies200Response>(
      '/v1/user-thread-hidden-replies',
      {
        headers,
        timeout,
        endpointName: 'getUserThreadHiddenReplies',
        params,
      },
    );
  }

  /**
   * Get hosts for a channel
   */
  getChannelHosts(
    params: ApiGetChannelHostsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelHosts200Response>(
      '/v2/get-channel-hosts',
      {
        headers,
        timeout,
        endpointName: 'getChannelHosts',
        params,
      },
    );
  }

  /**
   * Get individual reports for a specific token
   */
  getTokenReports(
    params: ApiGetTokenReportsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenReports200Response>(
      '/v2/get-token-reports',
      {
        headers,
        timeout,
        endpointName: 'getTokenReports',
        params,
      },
    );
  }

  /**
   * Get infomation about the user's auth address state.
   */
  getUserAuthAddress({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetUserAuthAddress200Response>(
      '/v2/user-auth-address',
      {
        headers,
        timeout,
        endpointName: 'getUserAuthAddress',
      },
    );
  }

  /**
   * Get information about Starter Pack
   */
  getStarterPack(
    params: ApiGetStarterPackQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetStarterPack200Response>('/v2/starter-pack', {
      headers,
      timeout,
      endpointName: 'getStarterPack',
      params,
    });
  }

  /**
   * Get information about a Farcaster username (fname).
   */
  getFname(
    params: ApiGetFnameQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFname200Response>('/v2/fname', {
      headers,
      timeout,
      endpointName: 'getFname',
      params,
    });
  }

  /**
   * Get information about a discovery app
   */
  getDiscoveryApp(
    params: ApiGetDiscoveryAppQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDiscoveryApp200Response>('/v2/discovery-app', {
      headers,
      timeout,
      endpointName: 'getDiscoveryApp',
      params,
    });
  }

  /**
   * Get information about a discovery frame
   */
  getDiscoveryFrame(
    params: ApiGetDiscoveryFrameQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDiscoveryFrame200Response>(
      '/v2/discovery-frame',
      {
        headers,
        timeout,
        endpointName: 'getDiscoveryFrame',
        params,
      },
    );
  }

  /**
   * Get information about a user's eligibility to exchange warps for USDC.
   */
  getWarpsTradeStatus({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetWarpsTradeStatus200Response>(
      '/v2/warps/exchange/status',
      {
        headers,
        timeout,
        endpointName: 'getWarpsTradeStatus',
      },
    );
  }

  /**
   * Get information about creating a channel, including cost
   */
  getChannelCreationInfo({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetChannelCreationInfo200Response>(
      '/v2/channel-creation-info',
      {
        headers,
        timeout,
        endpointName: 'getChannelCreationInfo',
      },
    );
  }

  /**
   * Get information about the AMA
   */
  getAMA(
    params: ApiGetAMAQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAMA200Response>('/v2/ama', {
      headers,
      timeout,
      endpointName: 'getAMA',
      params,
    });
  }

  /**
   * Get interests for specified onboarding categories
   */
  getOnboardingInterestCategories(
    params: ApiGetOnboardingInterestCategoriesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnboardingInterestCategories200Response>(
      '/v2/onboarding-interest-categories',
      {
        headers,
        timeout,
        endpointName: 'getOnboardingInterestCategories',
        params,
      },
    );
  }

  /**
   * Get invites for a channel
   */
  fcGetChannelInvites(
    params: ApiFcGetChannelInvitesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetChannelInvites200Response>(
      '/fc/channel-invites',
      {
        headers,
        timeout,
        endpointName: 'fcGetChannelInvites',
        params,
      },
    );
  }

  /**
   * Get least interacted with users, user is following.
   */
  getLeastInteractedWithFollowing(
    params: ApiGetLeastInteractedWithFollowingQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetLeastInteractedWithFollowing200Response>(
      '/v2/least-interacted-with-following',
      {
        headers,
        timeout,
        endpointName: 'getLeastInteractedWithFollowing',
        params,
      },
    );
  }

  /**
   * Get list of channel in which the user can cast a root cast
   */
  getUserCastableChannels(
    params: ApiGetUserCastableChannelsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserCastableChannels200Response>(
      '/v2/user-following-channels',
      {
        headers,
        timeout,
        endpointName: 'getUserCastableChannels',
        params,
      },
    );
  }

  /**
   * Get list of channels user follow, is a member or moderate.
   */
  getUserChannels(
    params: ApiGetUserChannelsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserChannels200Response>('/v2/user-channels', {
      headers,
      timeout,
      endpointName: 'getUserChannels',
      params,
    });
  }

  /**
   * Get live featured hero apps
   */
  getFeaturedHeroApps(
    params: ApiGetFeaturedHeroAppsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFeaturedHeroApps200Response>(
      '/v1/featured-hero-apps',
      {
        headers,
        timeout,
        endpointName: 'getFeaturedHeroApps',
        params,
      },
    );
  }

  /**
   * Get live state of a cast collectible.
   */
  getCastCollectible(
    params: ApiGetCastCollectibleQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCastCollectible200Response>(
      '/v2/cast-collectibles',
      {
        headers,
        timeout,
        endpointName: 'getCastCollectible',
        params,
      },
    );
  }

  /**
   * Get live state of cast collectibles.
   */
  getCastCollectibles(
    body: ApiGetCastCollectiblesRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGetCastCollectibles200Response>(
      '/v2/cast-collectibles',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getCastCollectibles',
        body,
      },
    );
  }

  /**
   * Get matching tokens for a linked ticker
   */
  getTokenLinks(
    params: ApiGetTokenLinksQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenLinks200Response>('/v2/token-links', {
      headers,
      timeout,
      endpointName: 'getTokenLinks',
      params,
    });
  }

  /**
   * Get members of a channel
   */
  fcGetChannelMembers(
    params: ApiFcGetChannelMembersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetChannelMembers200Response>(
      '/fc/channel-members',
      {
        headers,
        timeout,
        endpointName: 'fcGetChannelMembers',
        params,
      },
    );
  }

  /**
   * Get message hashes needed to perform a registration on behalf an address.
   */
  generateRegistrationHashes(
    body: ApiGenerateRegistrationHashesRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiGenerateRegistrationHashes200Response>(
      '/v2/registration-hashes',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'generateRegistrationHashes',
        body,
      },
    );
  }

  /**
   * Get metadata about a channel when editing it
   */
  getChannelSettings(
    params: ApiGetChannelSettingsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelSettings200Response>(
      '/v2/channels-owned',
      {
        headers,
        timeout,
        endpointName: 'getChannelSettings',
        params,
      },
    );
  }

  /**
   * Get metadata about a single audio room.
   */
  getAudioRoom(
    params: ApiGetAudioRoomQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAudioRoom200Response>('/v1/audio-room', {
      headers,
      timeout,
      endpointName: 'getAudioRoom',
      params,
    });
  }

  /**
   * Get metadata about channel.
   */
  getChannel(
    params: ApiGetChannelQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannel200Response>('/v2/channel', {
      headers,
      timeout,
      endpointName: 'getChannel',
      params,
    });
  }

  /**
   * Get metadata for cast collectibles. Use id="contract" for contract metadata or a tokenId for token metadata.
   */
  getCastCollectiblesMetadata(
    params: ApiGetCastCollectiblesMetadataQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/cast-collectibles/metadata', {
      headers,
      timeout,
      endpointName: 'getCastCollectiblesMetadata',
      params,
    });
  }

  /**
   * Get miniapp analytics rollup
   */
  analyticsMiniAppRollup(
    body: ApiAnalyticsMiniAppRollupRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAnalyticsMiniAppRollup200Response>(
      '/v1/analytics/miniapps/rollup',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'analyticsMiniAppRollup',
        body,
      },
    );
  }

  /**
   * Get muted channels for a user
   */
  getMutedChannels({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetMutedChannels200Response>(
      '/v2/get-muted-channels',
      {
        headers,
        timeout,
        endpointName: 'getMutedChannels',
      },
    );
  }

  /**
   * Get muted keywords for a user
   */
  getMutedKeywords({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetMutedKeywords200Response>(
      '/v2/get-muted-keywords',
      {
        headers,
        timeout,
        endpointName: 'getMutedKeywords',
      },
    );
  }

  /**
   * Get muted users for a user
   */
  getMutedUsers(
    params: ApiGetMutedUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetMutedUsers200Response>('/v2/get-muted-users', {
      headers,
      timeout,
      endpointName: 'getMutedUsers',
      params,
    });
  }

  /**
   * Get new Frames
   */
  getNewFrames(
    params: ApiGetNewFramesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetNewFrames200Response>('/v1/new-frameapps', {
      headers,
      timeout,
      endpointName: 'getNewFrames',
      params,
    });
  }

  /**
   * Get notifications for a given tab
   */
  getNotificationsForTab(
    params: ApiGetNotificationsForTabQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetNotificationsForTab200Response>(
      '/v1/notifications-for-tab',
      {
        headers,
        timeout,
        endpointName: 'getNotificationsForTab',
        params,
      },
    );
  }

  /**
   * Get notifications within the specified group.
   */
  getNotificationsInGroup(
    params: ApiGetNotificationsInGroupQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetNotificationsInGroup200Response>(
      '/v2/notification-group',
      {
        headers,
        timeout,
        endpointName: 'getNotificationsInGroup',
        params,
      },
    );
  }

  /**
   * Get onchain limit orders
   */
  getLimitOrders(
    params: ApiGetLimitOrdersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetLimitOrders200Response>(
      '/v1/onchain/limit-orders',
      {
        headers,
        timeout,
        endpointName: 'getLimitOrders',
        params,
      },
    );
  }

  /**
   * Get onchain token price notifications
   */
  getTokenSubscriptions({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetTokenSubscriptions200Response>(
      '/v1/onchain/tokens/subscriptions',
      {
        headers,
        timeout,
        endpointName: 'getTokenSubscriptions',
      },
    );
  }

  /**
   * Get onchain trader notifications
   */
  getTraderSubscriptions({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetTraderSubscriptions200Response>(
      '/v1/onchain/traders/subscriptions',
      {
        headers,
        timeout,
        endpointName: 'getTraderSubscriptions',
      },
    );
  }

  /**
   * Get onramp USD limit for authenticated user
   */
  getCoinbaseOnrampLimit(
    params: ApiGetCoinbaseOnrampLimitQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCoinbaseOnrampLimit200Response>(
      '/v2/onramp/coinbase/limit',
      {
        headers,
        timeout,
        endpointName: 'getCoinbaseOnrampLimit',
        params,
      },
    );
  }

  /**
   * Get or create a referral code for the current user
   */
  getOrCreateReferralCode({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiGetOrCreateReferralCode200Response>(
      '/v2/get-or-create-referral-code',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getOrCreateReferralCode',
        body: {},
      },
    );
  }

  /**
   * Get paid invite warps offering.
   */
  getInviteWithWarpsOffering({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetInviteWithWarpsOffering200Response>(
      '/v2/invite-with-warps-offering',
      {
        headers,
        timeout,
        endpointName: 'getInviteWithWarpsOffering',
      },
    );
  }

  /**
   * Get pending admin reviews
   */
  getPendingAdminReviews(
    params: ApiGetPendingAdminReviewsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPendingAdminReviews200Response>(
      '/v2/pending-admin-reviews',
      {
        headers,
        timeout,
        endpointName: 'getPendingAdminReviews',
        params,
      },
    );
  }

  /**
   * Get pending invites for a direct cast group.
   */
  getDirectCastGroupInvites(
    params: ApiGetDirectCastGroupInvitesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastGroupInvites200Response>(
      '/v2/direct-cast-group-invites',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastGroupInvites',
        params,
      },
    );
  }

  /**
   * Get phone verification status
   */
  getPhoneVerificationStatus({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetPhoneVerificationStatus200Response>(
      '/v2/quests/phone-verification',
      {
        headers,
        timeout,
        endpointName: 'getPhoneVerificationStatus',
      },
    );
  }

  /**
   * Get poll results
   */
  getPollResults(
    params: ApiGetPollResultsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPollResults200Response>(
      '/v2/get-poll-results',
      {
        headers,
        timeout,
        endpointName: 'getPollResults',
        params,
      },
    );
  }

  /**
   * Get primary address for a user
   */
  getPrimaryAddress(
    params: ApiGetPrimaryAddressQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPrimaryAddress200Response>(
      '/v2/get-primary-address',
      {
        headers,
        timeout,
        endpointName: 'getPrimaryAddress',
        params,
      },
    );
  }

  /**
   * Get product launch casts sorted by reverse chronological or algorithmic ranking.
   */
  getProductLaunchCasts(
    params: ApiGetProductLaunchCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetProductLaunchCasts200Response>(
      '/v2/product-launch-casts',
      {
        headers,
        timeout,
        endpointName: 'getProductLaunchCasts',
        params,
      },
    );
  }

  /**
   * Get profile referral
   */
  getReferralCodeByUsername(
    params: ApiGetReferralCodeByUsernameQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetReferralCodeByUsername200Response>(
      '/v1/profile-referral',
      {
        headers,
        timeout,
        endpointName: 'getReferralCodeByUsername',
        params,
      },
    );
  }

  /**
   * Get public keys related to direct cast conversations (deprecated).
   */
  getDirectCastKeys(
    params: ApiGetDirectCastKeysQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastKeys200Response>(
      '/v2/direct-cast-keys',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastKeys',
        params,
      },
    );
  }

  /**
   * Get public keys related to direct cast conversations. (deprecated)
   */
  getDirectCastKeysByAccount(
    params: ApiGetDirectCastKeysByAccountQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastKeysByAccount200Response>(
      '/v2/direct-cast-device-keys',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastKeysByAccount',
        params,
      },
    );
  }

  /**
   * Get quest for a user
   */
  getQuest(
    params: ApiGetQuestQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetQuest200Response>('/v2/quest', {
      headers,
      timeout,
      endpointName: 'getQuest',
      params,
    });
  }

  /**
   * Get quests for a user
   */
  getQuests({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetQuests200Response>('/v2/quests', {
      headers,
      timeout,
      endpointName: 'getQuests',
    });
  }

  /**
   * Get ranked pnls for a token
   */
  getTokenPnl(
    params: ApiGetTokenPnlQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenPnl200Response>('/v2/token/pnl', {
      headers,
      timeout,
      endpointName: 'getTokenPnl',
      params,
    });
  }

  /**
   * Get recently launched frames
   */
  getRecentlyLaunchedFrames(
    params: ApiGetRecentlyLaunchedFramesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRecentlyLaunchedFrames200Response>(
      '/v1/recently-launched-frames',
      {
        headers,
        timeout,
        endpointName: 'getRecentlyLaunchedFrames',
        params,
      },
    );
  }

  /**
   * Get recently used apps
   */
  getRecentlyUsedApps(
    params: ApiGetRecentlyUsedAppsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRecentlyUsedApps200Response>(
      '/v1/recently-used-apps',
      {
        headers,
        timeout,
        endpointName: 'getRecentlyUsedApps',
        params,
      },
    );
  }

  /**
   * Get recently used apps by user affinity
   */
  getRecentlyUsedAppsByUserAffinity(
    params: ApiGetRecentlyUsedAppsByUserAffinityQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRecentlyUsedAppsByUserAffinity200Response>(
      '/v1/apps-by-affinity',
      {
        headers,
        timeout,
        endpointName: 'getRecentlyUsedAppsByUserAffinity',
        params,
      },
    );
  }

  /**
   * Get recommendations for channels to follow, and include a summary of the followed ones.
   */
  recommendedChannels(
    params: ApiRecommendedChannelsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiRecommendedChannels200Response>(
      '/v2/channel-recommendations',
      {
        headers,
        timeout,
        endpointName: 'recommendedChannels',
        params,
      },
    );
  }

  /**
   * Get recommended channels based on cast text
   */
  getChannelRecsForCast(
    params: ApiGetChannelRecsForCastQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelRecsForCast200Response>(
      '/v2/get-channel-recs-for-cast',
      {
        headers,
        timeout,
        endpointName: 'getChannelRecsForCast',
        params,
      },
    );
  }

  /**
   * Get recommended traders
   */
  getRecommendedTraders({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetRecommendedTraders200Response>(
      '/v1/onchain/traders/recommendations',
      {
        headers,
        timeout,
        endpointName: 'getRecommendedTraders',
      },
    );
  }

  /**
   * Get recover EIP-712 message hash
   */
  getRecoverHash(
    params: ApiGetRecoverHashQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRecoverHash200Response>('/v2/recover-hash', {
      headers,
      timeout,
      endpointName: 'getRecoverHash',
      params,
    });
  }

  /**
   * Get referral code information by code (returns creator details)
   */
  getReferralCodeInfo(
    body: ApiGetReferralCodeInfoRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGetReferralCodeInfo200Response>(
      '/v2/get-referral-code-info',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getReferralCodeInfo',
        body,
      },
    );
  }

  /**
   * Get referral code information by code (returns creator details) and if the user has already joined with a referral code
   */
  getReferralCodeJoinInfo(
    body: ApiGetReferralCodeJoinInfoRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiGetReferralCodeJoinInfo200Response>(
      '/v2/get-referral-code-join-info',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getReferralCodeJoinInfo',
        body,
      },
    );
  }

  /**
   * Get report summary for a specific token
   */
  getTokenReportsSummary(
    params: ApiGetTokenReportsSummaryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenReportsSummary200Response>(
      '/v2/get-token-reports-summary',
      {
        headers,
        timeout,
        endpointName: 'getTokenReportsSummary',
        params,
      },
    );
  }

  /**
   * Get reported tokens aggregated by count
   */
  getReportedTokens(
    params: ApiGetReportedTokensQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetReportedTokens200Response>(
      '/v2/get-reported-tokens',
      {
        headers,
        timeout,
        endpointName: 'getReportedTokens',
        params,
      },
    );
  }

  /**
   * Get restricted users in a channel
   */
  fcGetChannelRestrictedUsers(
    params: ApiFcGetChannelRestrictedUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetChannelRestrictedUsers200Response>(
      '/fc/channel-restricted-users',
      {
        headers,
        timeout,
        endpointName: 'fcGetChannelRestrictedUsers',
        params,
      },
    );
  }

  /**
   * Get rewards earnings history
   */
  getRewardsEarningsHistory(
    params: ApiGetRewardsEarningsHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRewardsEarningsHistory200Response>(
      '/v2/rewards-earnings-history',
      {
        headers,
        timeout,
        endpointName: 'getRewardsEarningsHistory',
        params,
      },
    );
  }

  /**
   * Get rewards leaderboard
   */
  getRewardsLeaderboard(
    params: ApiGetRewardsLeaderboardQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRewardsLeaderboard200Response>(
      '/v2/rewards-leaderboard',
      {
        headers,
        timeout,
        endpointName: 'getRewardsLeaderboard',
        params,
      },
    );
  }

  /**
   * Get rewards metadata
   */
  getRewardsMetadata(
    params: ApiGetRewardsMetadataQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRewardsMetadata200Response>(
      '/v2/rewards-metadata',
      {
        headers,
        timeout,
        endpointName: 'getRewardsMetadata',
        params,
      },
    );
  }

  /**
   * Get rewards payout eligibility for the authed user
   */
  getRewardsPayoutEligibility({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetRewardsPayoutEligibility200Response>(
      '/v2/rewards-payout-eligibility',
      {
        headers,
        timeout,
        endpointName: 'getRewardsPayoutEligibility',
      },
    );
  }

  /**
   * Get rewards period summary
   */
  getRewardsPeriodSummary(
    params: ApiGetRewardsPeriodSummaryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRewardsPeriodSummary200Response>(
      '/v2/rewards-period-summary',
      {
        headers,
        timeout,
        endpointName: 'getRewardsPeriodSummary',
        params,
      },
    );
  }

  /**
   * Get rewards scores for a user
   */
  getRewardsScoresForUser(
    params: ApiGetRewardsScoresForUserQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRewardsScoresForUser200Response>(
      '/v2/rewards-scores-for-user',
      {
        headers,
        timeout,
        endpointName: 'getRewardsScoresForUser',
        params,
      },
    );
  }

  /**
   * Get rewards winner history
   */
  getRewardsWinnerHistory(
    params: ApiGetRewardsWinnerHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRewardsWinnerHistory200Response>(
      '/v2/rewards-winner-history',
      {
        headers,
        timeout,
        endpointName: 'getRewardsWinnerHistory',
        params,
      },
    );
  }

  /**
   * Get settlement transactions for an onchain limit order
   */
  getLimitOrderFills(
    params: ApiGetLimitOrderFillsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetLimitOrderFills200Response>(
      '/v1/onchain/limit-orders/fills',
      {
        headers,
        timeout,
        endpointName: 'getLimitOrderFills',
        params,
      },
    );
  }

  /**
   * Get starter pack users
   */
  getStarterPackUsers(
    params: ApiGetStarterPackUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetStarterPackUsers200Response>(
      '/v2/starter-pack-users',
      {
        headers,
        timeout,
        endpointName: 'getStarterPackUsers',
        params,
      },
    );
  }

  /**
   * Get starter packs created by FID
   */
  getStarterPacks(
    params: ApiGetStarterPacksQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetStarterPacks200Response>('/v2/starter-packs', {
      headers,
      timeout,
      endpointName: 'getStarterPacks',
      params,
    });
  }

  /**
   * Get storage utilization for a user
   */
  getStorageUtilization({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetStorageUtilization200Response>(
      '/v2/storage-utilization',
      {
        headers,
        timeout,
        endpointName: 'getStorageUtilization',
      },
    );
  }

  /**
   * Get suggested starter packs on the network for user
   */
  getSuggestedStarterPacks(
    params: ApiGetSuggestedStarterPacksQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSuggestedStarterPacks200Response>(
      '/v2/starter-packs/suggested',
      {
        headers,
        timeout,
        endpointName: 'getSuggestedStarterPacks',
        params,
      },
    );
  }

  /**
   * Get suggested users for nux task
   */
  getSuggestedUsersToFollow(
    params: ApiGetSuggestedUsersToFollowQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSuggestedUsersToFollow200Response>(
      '/v2/nux/suggested-users',
      {
        headers,
        timeout,
        endpointName: 'getSuggestedUsersToFollow',
        params,
      },
    );
  }

  /**
   * Get suggested users for the authenticated user to follow.
   */
  getSuggestedUsers(
    params: ApiGetSuggestedUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSuggestedUsers200Response>(
      '/v2/suggested-users',
      {
        headers,
        timeout,
        endpointName: 'getSuggestedUsers',
        params,
      },
    );
  }

  /**
   * Get suggested users to tip
   */
  getSuggestedTips(
    params: ApiGetSuggestedTipsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSuggestedTips200Response>(
      '/v2/farcaster-tips/suggested-users',
      {
        headers,
        timeout,
        endpointName: 'getSuggestedTips',
        params,
      },
    );
  }

  /**
   * Get the account association for a registered domain
   */
  devToolsGetRegisteredAccountAssociation(
    params: ApiDevToolsGetRegisteredAccountAssociationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsGetRegisteredAccountAssociation200Response>(
      '/v1/dev-tools/registered-account-association',
      {
        headers,
        timeout,
        endpointName: 'devToolsGetRegisteredAccountAssociation',
        params,
      },
    );
  }

  /**
   * Get the active subscription for a user
   */
  getActiveSubscription(
    params: ApiGetActiveSubscriptionQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetActiveSubscription200Response>(
      '/v1/subscriptions/active-subscription',
      {
        headers,
        timeout,
        endpointName: 'getActiveSubscription',
        params,
      },
    );
  }

  /**
   * Get the admin feed. Supported type values include home, following, pure-following, evergreen-labeled, high-quality-labeled, and low-quality-labeled.
   */
  getAdminFeed(
    params: ApiGetAdminFeedQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetAdminFeed200Response>('/v2/admin-feed', {
      headers,
      timeout,
      endpointName: 'getAdminFeed',
      params,
    });
  }

  /**
   * Get the affinity scores between a user and the people they follow
   */
  getFollowedUsersAffinityScore(
    params: ApiGetFollowedUsersAffinityScoreQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetFollowedUsersAffinityScore200Response>(
      '/v1/followed-users-affinity-scores',
      {
        headers,
        timeout,
        endpointName: 'getFollowedUsersAffinityScore',
        params,
      },
    );
  }

  /**
   * Get the apps managed by the authed fid
   */
  devToolsManagedApps(
    params: ApiDevToolsManagedAppsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsManagedApps200Response>(
      '/v1/dev-tools/managed-apps',
      {
        headers,
        timeout,
        endpointName: 'devToolsManagedApps',
        params,
      },
    );
  }

  /**
   * Get the authenticated requester's available invites count.
   */
  getInvitesAvailable({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetInvitesAvailable200Response>(
      '/v2/invites-available',
      {
        headers,
        timeout,
        endpointName: 'getInvitesAvailable',
      },
    );
  }

  /**
   * Get the authenticated requester's warpcast sponsored invites.
   */
  getWarpcastSponsoredInvites({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetWarpcastSponsoredInvites200Response>(
      '/v2/warpcast-sponsored-invites',
      {
        headers,
        timeout,
        endpointName: 'getWarpcastSponsoredInvites',
      },
    );
  }

  /**
   * Get the channels highlighted for the authenticated user
   */
  getHighlightedChannels({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetHighlightedChannels200Response>(
      '/v2/highlighted-channels',
      {
        headers,
        timeout,
        endpointName: 'getHighlightedChannels',
      },
    );
  }

  /**
   * Get the conversation transcript for a snap build
   */
  getSnapAgentBuildConversation(
    params: { buildId: string },
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSnapAgentBuildConversation200Response>(
      `/v2/snap/agent/builds/${encodeURIComponent(params.buildId)}/conversation`,
      {
        headers,
        timeout,
        endpointName: 'getSnapAgentBuildConversation',
      },
    );
  }

  /**
   * Get the count of users who have claimed the current user's referral code
   */
  getReferralCodeCount({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiGetReferralCodeCount200Response>(
      '/v2/get-referral-code-count',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getReferralCodeCount',
        body: {},
      },
    );
  }

  /**
   * Get the custody address associated with an FID.
   */
  getCustodyAddress(
    params: ApiGetCustodyAddressQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCustodyAddress200Response>(
      '/v2/custody-address',
      {
        headers,
        timeout,
        endpointName: 'getCustodyAddress',
        params,
      },
    );
  }

  /**
   * Get the domains owned by specified or authed fid
   */
  devToolsDomainsOwned(
    params: ApiDevToolsDomainsOwnedQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsDomainsOwned200Response>(
      '/v1/dev-tools/domains-owned',
      {
        headers,
        timeout,
        endpointName: 'devToolsDomainsOwned',
        params,
      },
    );
  }

  /**
   * Get the fee USD value of an onchain swap
   */
  getOnchainSwapFeeUsdValue(
    params: ApiGetOnchainSwapFeeUsdValueQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainSwapFeeUsdValue200Response>(
      '/v1/onchain/swaps/fee',
      {
        headers,
        timeout,
        endpointName: 'getOnchainSwapFeeUsdValue',
        params,
      },
    );
  }

  /**
   * Get the feeds the authenticated user is following, including non-subscribable.
   */
  getFeedSummaries({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetFeedSummaries200Response>('/v2/feeds', {
      headers,
      timeout,
      endpointName: 'getFeedSummaries',
    });
  }

  /**
   * Get the harmful-domain blocklist (mini-apps and arbitrary domains).
   */
  getFrameBlocklist({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetFrameBlocklist200Response>(
      '/v2/frame-blocklist',
      {
        headers,
        timeout,
        endpointName: 'getFrameBlocklist',
      },
    );
  }

  /**
   * Get the history of home feed generations and casts included in the home feed
   */
  getHomeFeedGenerationHistory(
    params: ApiGetHomeFeedGenerationHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetHomeFeedGenerationHistory200Response>(
      '/v1/home-feed-history',
      {
        headers,
        timeout,
        endpointName: 'getHomeFeedGenerationHistory',
        params,
      },
    );
  }

  /**
   * Get the mini-app home embed for a domain
   */
  getMiniAppHomeEmbed(
    params: ApiGetMiniAppHomeEmbedQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetMiniAppHomeEmbed200Response>(
      '/v1/mini-app/home-embed',
      {
        headers,
        timeout,
        endpointName: 'getMiniAppHomeEmbed',
        params,
      },
    );
  }

  /**
   * Get the next nux task for the viewer
   */
  getNextNuxTask({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetNextNuxTask200Response>('/v2/nux/task', {
      headers,
      timeout,
      endpointName: 'getNextNuxTask',
    });
  }

  /**
   * Get the open graph metadata for a URL
   */
  devToolsGetOpenGraphMetadata(
    params: ApiDevToolsGetOpenGraphMetadataQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsGetOpenGraphMetadata200Response>(
      '/v1/dev-tools/open-graph-metadata',
      {
        headers,
        timeout,
        endpointName: 'devToolsGetOpenGraphMetadata',
        params,
      },
    );
  }

  /**
   * Get the positions for a user
   */
  getPredictionPositions(
    params: ApiGetPredictionPositionsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPredictionPositions200Response>(
      '/v1/predictions/positions',
      {
        headers,
        timeout,
        endpointName: 'getPredictionPositions',
        params,
      },
    );
  }

  /**
   * Get the price history for a prediction outcome given a market clob token id
   */
  getPredictionPriceHistory(
    params: ApiGetPredictionPriceHistoryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPredictionPriceHistory200Response>(
      '/v1/predictions/outcomes/price-history',
      {
        headers,
        timeout,
        endpointName: 'getPredictionPriceHistory',
        params,
      },
    );
  }

  /**
   * Get the price history for all outcomes in a prediction market given a market clob token id
   */
  getPredictionMarket(
    params: ApiGetPredictionMarketQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPredictionMarket200Response>(
      '/v1/predictions/markets',
      {
        headers,
        timeout,
        endpointName: 'getPredictionMarket',
        params,
      },
    );
  }

  /**
   * Get the price history for all outcomes in a prediction market given a market clob token id
   */
  getPredictionPriceHistoryMarket(
    params: ApiGetPredictionPriceHistoryMarketQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPredictionPriceHistoryMarket200Response>(
      '/v1/predictions/markets/price-history',
      {
        headers,
        timeout,
        endpointName: 'getPredictionPriceHistoryMarket',
        params,
      },
    );
  }

  /**
   * Get the price history for marekt's positive in a prediction event given a event id
   */
  getPredictionPriceHistoryEvent(
    params: ApiGetPredictionPriceHistoryEventQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetPredictionPriceHistoryEvent200Response>(
      '/v1/predictions/events/price-history',
      {
        headers,
        timeout,
        endpointName: 'getPredictionPriceHistoryEvent',
        params,
      },
    );
  }

  /**
   * Get the referral code that the current user has claimed
   */
  getClaimedReferralCode({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiGetClaimedReferralCode200Response>(
      '/v2/get-claimed-referral-code',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getClaimedReferralCode',
        body: {},
      },
    );
  }

  /**
   * Get the replies to a conversation cast for interactive expansion
   */
  getConversationCastReplies(
    params: ApiGetConversationCastRepliesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetConversationCastReplies200Response>(
      '/v1/conversation-cast-replies',
      {
        headers,
        timeout,
        endpointName: 'getConversationCastReplies',
        params,
      },
    );
  }

  /**
   * Get the replies to a conversation cast for interactive expansion. Excludes replies by the focus cast author, followed users, and viewer since those should have been returned by the thread endpoint
   */
  getConversationCastRepliesObsolete(
    params: ApiGetConversationCastRepliesObsoleteQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetConversationCastRepliesObsolete200Response>(
      '/v2/conversation-cast-replies',
      {
        headers,
        timeout,
        endpointName: 'getConversationCastRepliesObsolete',
        params,
      },
    );
  }

  /**
   * Get the roles for a domain
   */
  devToolsDomainRoles(
    params: ApiDevToolsDomainRolesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsDomainRoles200Response>(
      '/v1/dev-tools/domain-roles',
      {
        headers,
        timeout,
        endpointName: 'devToolsDomainRoles',
        params,
      },
    );
  }

  /**
   * Get the source code for a snap build
   */
  getSnapAgentBuildSource(
    params: { buildId: string },
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSnapAgentBuildSource200Response>(
      `/v2/snap/agent/builds/${encodeURIComponent(params.buildId)}/source`,
      {
        headers,
        timeout,
        endpointName: 'getSnapAgentBuildSource',
      },
    );
  }

  /**
   * Get the state of an onchain action
   */
  getOnchainAction(
    params: ApiGetOnchainActionQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainAction200Response>(
      '/v2/onchain-action',
      {
        headers,
        timeout,
        endpointName: 'getOnchainAction',
        params,
      },
    );
  }

  /**
   * Get the state of an uploaded video
   */
  getVideoState(
    params: ApiGetVideoStateQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetVideoState200Response>('/v1/uploaded-video', {
      headers,
      timeout,
      endpointName: 'getVideoState',
      params,
    });
  }

  /**
   * Get the status of a Farcaster Pro subscription with USDC
   */
  farcasterProSubscribeWithUsdcStatus(
    params: ApiFarcasterProSubscribeWithUsdcStatusQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFarcasterProSubscribeWithUsdcStatus200Response>(
      '/v1/farcaster-pro/subscribe-with-usdc-status',
      {
        headers,
        timeout,
        endpointName: 'farcasterProSubscribeWithUsdcStatus',
        params,
      },
    );
  }

  /**
   * Get the status of a gasless swap
   */
  getGaslessStatus(
    params: ApiGetGaslessStatusQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetGaslessStatus200Response>(
      '/v2/swaps/gasless/status',
      {
        headers,
        timeout,
        endpointName: 'getGaslessStatus',
        params,
      },
    );
  }

  /**
   * Get the top engagement ring candidates for a user based on mutual likes in the last 30 days
   */
  getEngagementRingCandidates(
    params: ApiGetEngagementRingCandidatesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetEngagementRingCandidates200Response>(
      '/v1/engagement-ring-candidates',
      {
        headers,
        timeout,
        endpointName: 'getEngagementRingCandidates',
        params,
      },
    );
  }

  /**
   * Get the user's primary address
   */
  publicGetPrimaryAddress(
    params: ApiPublicGetPrimaryAddressQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiPublicGetPrimaryAddress200Response>(
      '/fc/primary-address',
      {
        headers,
        timeout,
        endpointName: 'publicGetPrimaryAddress',
        params,
      },
    );
  }

  /**
   * Get the user's primary addresss
   */
  publicGetPrimaryAddresses(
    params: ApiPublicGetPrimaryAddressesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiPublicGetPrimaryAddresses200Response>(
      '/fc/primary-addresses',
      {
        headers,
        timeout,
        endpointName: 'publicGetPrimaryAddresses',
        params,
      },
    );
  }

  /**
   * Get the value of all dynamic configs
   */
  getDynamicConfigs({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetDynamicConfigs200Response>(
      '/v1/dynamic-configs',
      {
        headers,
        timeout,
        endpointName: 'getDynamicConfigs',
      },
    );
  }

  /**
   * Get the week summary of tips for a user
   */
  getTipsWeekSummary({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetTipsWeekSummary200Response>(
      '/v2/farcaster-tips/week-summary',
      {
        headers,
        timeout,
        endpointName: 'getTipsWeekSummary',
      },
    );
  }

  /**
   * Get time-sorted list of events around channels
   */
  fcGetChannelEvents(
    params: ApiFcGetChannelEventsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetChannelEvents200Response>(
      '/fc/channel-events',
      {
        headers,
        timeout,
        endpointName: 'fcGetChannelEvents',
        params,
      },
    );
  }

  /**
   * Get time-sorted list of primary address events
   */
  fcGetPrimaryAddressEvents(
    params: ApiFcGetPrimaryAddressEventsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetPrimaryAddressEvents200Response>(
      '/fc/primary-address-events',
      {
        headers,
        timeout,
        endpointName: 'fcGetPrimaryAddressEvents',
        params,
      },
    );
  }

  /**
   * Get token by chain and contract address
   */
  getToken(
    params: ApiGetTokenQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetToken200Response>('/v2/token', {
      headers,
      timeout,
      endpointName: 'getToken',
      params,
    });
  }

  /**
   * Get token chart by chain, contract address, and period
   */
  getTokenChart(
    params: ApiGetTokenChartQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenChart200Response>('/v2/token-chart', {
      headers,
      timeout,
      endpointName: 'getTokenChart',
      params,
    });
  }

  /**
   * Get token holders by chain and contract address
   */
  getTokenHolders(
    params: ApiGetTokenHoldersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenHolders200Response>('/v2/token-holders', {
      headers,
      timeout,
      endpointName: 'getTokenHolders',
      params,
    });
  }

  /**
   * Get tokens in the watchlist.
   */
  getTokensInWatchlist(
    params: ApiGetTokensInWatchlistQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokensInWatchlist200Response>(
      '/v2/token-watchlists',
      {
        headers,
        timeout,
        endpointName: 'getTokensInWatchlist',
        params,
      },
    );
  }

  /**
   * Get top Frames based on developer rewards scores.
   */
  getTopFrames(
    params: ApiGetTopFramesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTopFrames200Response>('/v1/top-frameapps', {
      headers,
      timeout,
      endpointName: 'getTopFrames',
      params,
    });
  }

  /**
   * Get top casters for the channel.
   */
  getChannelTopCasters(
    params: ApiGetChannelTopCastersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelTopCasters200Response>(
      '/v2/channel-top-casters',
      {
        headers,
        timeout,
        endpointName: 'getChannelTopCasters',
        params,
      },
    );
  }

  /**
   * Get top inviters with score
   */
  getInvitersLeaderboard({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetInvitersLeaderboard200Response>(
      '/v2/inviters-leaderboard',
      {
        headers,
        timeout,
        endpointName: 'getInvitersLeaderboard',
      },
    );
  }

  /**
   * Get top mini apps
   */
  getTopMiniApps(
    params: ApiGetTopMiniAppsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTopMiniApps200Response>('/v1/top-mini-apps', {
      headers,
      timeout,
      endpointName: 'getTopMiniApps',
      params,
    });
  }

  /**
   * Get trending tokens
   */
  getTrendingTokens(
    params: ApiGetTrendingTokensQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTrendingTokens200Response>(
      '/v2/trending-tokens',
      {
        headers,
        timeout,
        endpointName: 'getTrendingTokens',
        params,
      },
    );
  }

  /**
   * Get trending topic casts
   */
  getTrendingTopicCasts(
    params: ApiGetTrendingTopicCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTrendingTopicCasts200Response>(
      '/v1/get-trending-topic-casts',
      {
        headers,
        timeout,
        endpointName: 'getTrendingTopicCasts',
        params,
      },
    );
  }

  /**
   * Get trending topics
   */
  getTrendingTopics({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetTrendingTopics200Response>(
      '/v1/get-trending-topics',
      {
        headers,
        timeout,
        endpointName: 'getTrendingTopics',
      },
    );
  }

  /**
   * Get trending topics for admin
   */
  getTrendingTopicsForAdmin({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetTrendingTopicsForAdmin200Response>(
      '/v1/admin-trending-topics',
      {
        headers,
        timeout,
        endpointName: 'getTrendingTopicsForAdmin',
      },
    );
  }

  /**
   * Get user account verifications attested by Warpcast
   */
  fcGetAccountVerifications(
    params: ApiFcGetAccountVerificationsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetAccountVerifications200Response>(
      '/fc/account-verifications',
      {
        headers,
        timeout,
        endpointName: 'fcGetAccountVerifications',
        params,
      },
    );
  }

  /**
   * Get users for quality annotation by admins
   */
  getUsersForQualityAnnotation(
    params: ApiGetUsersForQualityAnnotationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUsersForQualityAnnotation200Response>(
      '/v2/get-users-for-quality-annotation',
      {
        headers,
        timeout,
        endpointName: 'getUsersForQualityAnnotation',
        params,
      },
    );
  }

  /**
   * Get wallet context for a token
   */
  getTokenWalletContext(
    params: ApiGetTokenWalletContextQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTokenWalletContext200Response>(
      '/v2/token/wallet',
      {
        headers,
        timeout,
        endpointName: 'getTokenWalletContext',
        params,
      },
    );
  }

  /**
   * Get whether the specified email address has already been invited.
   */
  getIsUserInvited(
    params: ApiGetIsUserInvitedQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetIsUserInvited200Response>('/v2/invites', {
      headers,
      timeout,
      endpointName: 'getIsUserInvited',
      params,
    });
  }

  /**
   * Get yield deposit data for a token
   */
  getOnchainYieldDeposit(
    params: ApiGetOnchainYieldDepositQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainYieldDeposit200Response>(
      '/v1/onchain/yield/deposit',
      {
        headers,
        timeout,
        endpointName: 'getOnchainYieldDeposit',
        params,
      },
    );
  }

  /**
   * Get yield overview for the viewer
   */
  getOnchainYieldOverview(
    params: ApiGetOnchainYieldOverviewQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainYieldOverview200Response>(
      '/v1/onchain/yield/overview',
      {
        headers,
        timeout,
        endpointName: 'getOnchainYieldOverview',
        params,
      },
    );
  }

  /**
   * Get yield withdraw data for a token
   */
  getOnchainYieldWithdraw(
    params: ApiGetOnchainYieldWithdrawQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetOnchainYieldWithdraw200Response>(
      '/v1/onchain/yield/withdraw',
      {
        headers,
        timeout,
        endpointName: 'getOnchainYieldWithdraw',
        params,
      },
    );
  }

  /**
   * Gets a single cast for a specific user using a shortened hash.
   */
  getUserCast(
    params: ApiGetUserCastQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserCast200Response>('/v2/user-cast', {
      headers,
      timeout,
      endpointName: 'getUserCast',
      params,
    });
  }

  /**
   * Gets active auth sessions for the authenticated user.
   */
  getAuthSessions({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetAuthSessions200Response>('/v2/auth/sessions', {
      headers,
      timeout,
      endpointName: 'getAuthSessions',
    });
  }

  /**
   * Gets all casts (including replies and recasts) created by the specified user.
   */
  getUserCastsAndReplies(
    params: ApiGetUserCastsAndRepliesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserCastsAndReplies200Response>('/v2/casts', {
      headers,
      timeout,
      endpointName: 'getUserCastsAndReplies',
      params,
    });
  }

  /**
   * Gets an approval message hash for a recovery address change
   */
  getRecoveryAddressChangeHash(
    params: ApiGetRecoveryAddressChangeHashQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRecoveryAddressChangeHash200Response>(
      '/v2/recovery-address-change-hash',
      {
        headers,
        timeout,
        endpointName: 'getRecoveryAddressChangeHash',
        params,
      },
    );
  }

  /**
   * Gets casts that are new conversations (i.e. are not replies or recasts) created by the specified user.
   */
  getUserCasts(
    params: ApiGetUserCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserCasts200Response>('/v2/profile-casts', {
      headers,
      timeout,
      endpointName: 'getUserCasts',
      params,
    });
  }

  /**
   * Gets details of a signer.
   */
  getSigner(
    params: ApiGetSignerQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSigner200Response>('/v2/signer', {
      headers,
      timeout,
      endpointName: 'getSigner',
      params,
    });
  }

  /**
   * Gets details of a signer.
   */
  getSignerRemoveHash(
    params: ApiGetSignerRemoveHashQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSignerRemoveHash200Response>(
      '/v2/signer-remove-hash',
      {
        headers,
        timeout,
        endpointName: 'getSignerRemoveHash',
        params,
      },
    );
  }

  /**
   * Gets information about a recovery address change
   */
  getRecoveryAddressChange(
    params: ApiGetRecoveryAddressChangeQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRecoveryAddressChange200Response>(
      '/v2/recovery-address-changes',
      {
        headers,
        timeout,
        endpointName: 'getRecoveryAddressChange',
        params,
      },
    );
  }

  /**
   * Gets information about application feature flags for the authenticated user.
   */
  getClientConfig({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetClientConfig200Response>('/v2/client-config', {
      headers,
      timeout,
      endpointName: 'getClientConfig',
    });
  }

  /**
   * Gets invite info for a direct cast group.
   */
  getDirectCastGroupInviteV3(
    params: ApiGetDirectCastGroupInviteV3QueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastGroupInviteV3200Response>(
      '/v2/direct-cast-group-invite',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastGroupInviteV3',
        params,
      },
    );
  }

  /**
   * Gets snap casts created by the specified user.
   */
  getProfileSnapCasts(
    params: ApiGetProfileSnapCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetProfileSnapCasts200Response>(
      '/v2/profile-snap-casts',
      {
        headers,
        timeout,
        endpointName: 'getProfileSnapCasts',
        params,
      },
    );
  }

  /**
   * Gets the connected addresses for the specified user. (SSR)
   */
  getUserConnectedAddresses(
    params: ApiGetUserConnectedAddressesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserConnectedAddresses200Response>(
      '/v2/ssr/user-connected-addresses',
      {
        headers,
        timeout,
        endpointName: 'getUserConnectedAddresses',
        params,
      },
    );
  }

  /**
   * Gets the current onboarding state for the authenticated user and creates an auth token if possible.,  * This is an optimization to reduce the number of requests the client needs to make during initial,  * onboarding.
   */
  getOnboardingStateAndAuthToken(
    body: ApiGetOnboardingStateAndAuthTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiGetOnboardingStateAndAuthToken200Response>(
      '/v2/onboarding-state',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'getOnboardingStateAndAuthToken',
        body,
      },
    );
  }

  /**
   * Gets the current onboarding state for the authenticated user.
   */
  getOnboardingState({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetOnboardingState200Response>(
      '/v2/onboarding-state',
      {
        headers,
        timeout,
        endpointName: 'getOnboardingState',
      },
    );
  }

  /**
   * Gets the currently authenticated user.
   */
  getAuthenticatedUser({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetAuthenticatedUser200Response>('/v2/me', {
      headers,
      timeout,
      endpointName: 'getAuthenticatedUser',
    });
  }

  /**
   * Gets the direct cast conversations for the requesting user.
   */
  getDirectCastConversationsV3(
    params: ApiGetDirectCastConversationsV3QueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastConversationsV3200Response>(
      '/v2/direct-cast-conversation-list',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastConversationsV3',
        params,
      },
    );
  }

  /**
   * Gets the direct casts for the specified conversation.
   */
  getDirectCastConversationMessages(
    params: ApiGetDirectCastConversationMessagesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastConversationMessages200Response>(
      '/v2/direct-cast-conversation-messages',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastConversationMessages',
        params,
      },
    );
  }

  /**
   * Gets the direct casts for the specified conversation. (deprecated)
   */
  getDirectCastConversationV3(
    params: ApiGetDirectCastConversationV3QueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastConversationV3200Response>(
      '/v2/direct-cast-conversation-details',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastConversationV3',
        params,
      },
    );
  }

  /**
   * Gets the inbox conversations for the requesting user.
   */
  getDirectCastInbox(
    params: ApiGetDirectCastInboxQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastInbox200Response>(
      '/v2/direct-cast-inbox',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastInbox',
        params,
      },
    );
  }

  /**
   * Gets the recent direct casts for the specified conversation.
   */
  getDirectCastConversationRecentMessages(
    params: ApiGetDirectCastConversationRecentMessagesQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastConversationRecentMessages200Response>(
      '/v2/direct-cast-conversation-recent-messages',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastConversationRecentMessages',
        params,
      },
    );
  }

  /**
   * Gets the recovery address for the authenticated user
   */
  getRecoveryAddress({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetRecoveryAddress200Response>(
      '/v2/recovery-address',
      {
        headers,
        timeout,
        endpointName: 'getRecoveryAddress',
      },
    );
  }

  /**
   * Gets the specified user via their FID through replica.
   */
  getUserByFID(
    params: ApiGetUserByFIDQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserByFID200Response>('/v2/user-by-fid', {
      headers,
      timeout,
      endpointName: 'getUserByFID',
      params,
    });
  }

  /**
   * Gets the specified user via their FID through replica. (SSR)
   */
  getUserByFIDForOG(
    params: ApiGetUserByFIDForOGQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserByFIDForOG200Response>(
      '/v2/ssr/user-by-fid',
      {
        headers,
        timeout,
        endpointName: 'getUserByFIDForOG',
        params,
      },
    );
  }

  /**
   * Gets the specified user via their FID. (Dangerous)
   */
  getUser(
    params: ApiGetUserQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUser200Response>('/v2/user', {
      headers,
      timeout,
      endpointName: 'getUser',
      params,
    });
  }

  /**
   * Gets the specified user via their username.
   */
  getUserByUsername(
    params: ApiGetUserByUsernameQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserByUsername200Response>(
      '/v2/user-by-username',
      {
        headers,
        timeout,
        endpointName: 'getUserByUsername',
        params,
      },
    );
  }

  /**
   * Gets the specified user via their username. (SSR)
   */
  getUserByUsernameForOG(
    params: ApiGetUserByUsernameForOGQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserByUsernameForOG200Response>(
      '/v2/ssr/user-by-username',
      {
        headers,
        timeout,
        endpointName: 'getUserByUsernameForOG',
        params,
      },
    );
  }

  /**
   * Gets the top casts for the specified user. (SSR)
   */
  getUserTopCasts(
    params: ApiGetUserTopCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserTopCasts200Response>(
      '/v2/ssr/user-top-casts',
      {
        headers,
        timeout,
        endpointName: 'getUserTopCasts',
        params,
      },
    );
  }

  /**
   * Gets the user who has most recently verified ownership of the specified ETH address.
   */
  getUserByVerification(
    params: ApiGetUserByVerificationQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserByVerification200Response>(
      '/v2/user-by-verification',
      {
        headers,
        timeout,
        endpointName: 'getUserByVerification',
        params,
      },
    );
  }

  /**
   * GitHub auth callbacks
   */
  authenticateGitHub({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<void>('/auth/gh', {
      headers,
      timeout,
      endpointName: 'authenticateGitHub',
    });
  }

  /**
   * Handle Coinbase onramp callback
   */
  handleCoinbaseCommerceCallback({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiHandleCoinbaseCommerceCallback200Response>(
      '/v2/onramp/coinbase/callback',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'handleCoinbaseCommerceCallback',
        body: {},
      },
    );
  }

  /**
   * Hide a token from the wallet positions.
   */
  hideToken(
    body: ApiHideTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiHideToken200Response>('/v2/hide-token', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'hideToken',
      body,
    });
  }

  /**
   * History of warps for given authenticated user.
   */
  getWarpTransactions(
    params: ApiGetWarpTransactionsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWarpTransactions200Response>(
      '/v2/warp-transactions',
      {
        headers,
        timeout,
        endpointName: 'getWarpTransactions',
        params,
      },
    );
  }

  /**
   * Host participant role moderation for live rooms; active cohosts can moderate when the host has left. Supports cohost -> speaker and speaker/cohost -> listener.
   */
  moderateParticipantRoleAudioRoom(
    body: ApiModerateParticipantRoleAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiModerateParticipantRoleAudioRoom200Response>(
      '/v1/audio-room/moderate-role',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'moderateParticipantRoleAudioRoom',
        body,
      },
    );
  }

  /**
   * Host, or an active cohost when the host has left, demotes a speaker/cohost back to listener. Invited speakers can also demote themselves back to listener.
   */
  removeSpeakerAudioRoom(
    body: ApiRemoveSpeakerAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRemoveSpeakerAudioRoom200Response>(
      '/v1/audio-room/remove-speaker',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeSpeakerAudioRoom',
        body,
      },
    );
  }

  /**
   * Host-forced removal of a participant from a live room; active cohosts can remove participants when the host has left. Removed users can rejoin manually.
   */
  removeParticipantAudioRoom(
    body: ApiRemoveParticipantAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRemoveParticipantAudioRoom200Response>(
      '/v1/audio-room/remove-participant',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeParticipantAudioRoom',
        body,
      },
    );
  }

  /**
   * Host/cohost cancels a pending stage invite for a participant.
   */
  cancelStageInviteAudioRoom(
    body: ApiCancelStageInviteAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCancelStageInviteAudioRoom200Response>(
      '/v1/audio-room/cancel-stage-invite',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'cancelStageInviteAudioRoom',
        body,
      },
    );
  }

  /**
   * Host/cohost promotes a listener or sends a pending invite to stage.
   */
  acceptSpeakerAudioRoom(
    body: ApiAcceptSpeakerAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAcceptSpeakerAudioRoom200Response>(
      '/v1/audio-room/accept-speaker',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'acceptSpeakerAudioRoom',
        body,
      },
    );
  }

  /**
   * Information about buying Warps with Coinbase Commerce.
   */
  buyWarpsCoinbaseCommerceInfo({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiBuyWarpsCoinbaseCommerceInfo200Response>(
      '/v2/buy-warps-coinbase-commerce',
      {
        headers,
        timeout,
        endpointName: 'buyWarpsCoinbaseCommerceInfo',
      },
    );
  }

  /**
   * Initiate a new recovery
   */
  initiateRecovery(
    body: ApiInitiateRecoveryRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiInitiateRecovery200Response>('/v2/initiate-recovery', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'initiateRecovery',
      body,
    });
  }

  /**
   * Initiate a signer key request for a Warpcast signer.
   */
  createWarpcastSignedKeyRequest({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiCreateWarpcastSignedKeyRequest200Response>(
      '/v2/warpcast-signed-key-request',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createWarpcastSignedKeyRequest',
        body: {},
      },
    );
  }

  /**
   * Insert a featured app
   */
  insertFeaturedApp(
    body: ApiInsertFeaturedAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiInsertFeaturedApp200Response>(
      '/v1/featured-app-admin/insert',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'insertFeaturedApp',
        body,
      },
    );
  }

  /**
   * Insert a hidden featured app
   */
  insertHiddenFeaturedApp(
    body: ApiInsertHiddenFeaturedAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiInsertHiddenFeaturedApp200Response>(
      '/v1/hidden-featured-app-admin/insert',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'insertHiddenFeaturedApp',
        body,
      },
    );
  }

  /**
   * Inspect a miniapp url
   */
  devToolsInspectMiniAppUrl(
    params: ApiDevToolsInspectMiniAppUrlQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsInspectMiniAppUrl200Response>(
      '/v1/dev-tools/inspect-miniapp-url',
      {
        headers,
        timeout,
        endpointName: 'devToolsInspectMiniAppUrl',
        params,
      },
    );
  }

  /**
   * Inspect an image url
   */
  devToolsInspectImageUrl(
    params: ApiDevToolsInspectImageUrlQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsInspectImageUrl200Response>(
      '/v1/dev-tools/inspect-image-url',
      {
        headers,
        timeout,
        endpointName: 'devToolsInspectImageUrl',
        params,
      },
    );
  }

  /**
   * Invite a user to a channel as a member or moderator
   */
  inviteChannelUserToRole(
    body: ApiInviteChannelUserToRoleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiInviteChannelUserToRole200Response>(
      '/v1/manage-channel-users',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'inviteChannelUserToRole',
        body,
      },
    );
  }

  /**
   * Invite a user to a channel as a member or moderator (public signer version)
   */
  fcInviteUserToChannelRole(
    body: ApiFcInviteUserToChannelRoleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcInviteUserToChannelRole200Response>(
      '/fc/channel-invites',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'fcInviteUserToChannelRole',
        body,
      },
    );
  }

  /**
   * Invite a user to a direct cast group.
   */
  fcPutGroupInvites(
    body: ApiFcPutGroupInvitesRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiFcPutGroupInvites200Response>('/fc/group-invites', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPutGroupInvites',
      body,
    });
  }

  /**
   * Join a channel via an invite code
   */
  joinChannelViaCode(
    body: ApiJoinChannelViaCodeRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiJoinChannelViaCode200Response>(
      '/v1/join-channel-via-code',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'joinChannelViaCode',
        body,
      },
    );
  }

  /**
   * Join an audio room and receive a LiveKit access token (admin-only v1).
   */
  joinAudioRoom(
    body: ApiJoinAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiJoinAudioRoom200Response>('/v1/audio-room/join', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'joinAudioRoom',
      body,
    });
  }

  /**
   * Leave an audio room (best-effort, LiveKit disconnect handles the real cleanup).
   */
  leaveAudioRoom(
    body: ApiLeaveAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiLeaveAudioRoom200Response>('/v1/audio-room/leave', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'leaveAudioRoom',
      body,
    });
  }

  /**
   * Limits the content visibility between users.
   */
  limitVisibility(
    body: ApiLimitVisibilityRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiLimitVisibility200Response>('/v2/limit-visibility', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'limitVisibility',
      body,
    });
  }

  /**
   * LinkedIn auth callbacks
   */
  authenticateLinkedIn({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<void>('/auth/linkedin', {
      headers,
      timeout,
      endpointName: 'authenticateLinkedIn',
    });
  }

  /**
   * List KV entries for the published snap from this build
   */
  getSnapAgentBuildKv(
    params: ApiGetSnapAgentBuildKvQueryParams & { buildId: string },
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSnapAgentBuildKv200Response>(
      `/v2/snap/agent/builds/${encodeURIComponent(params.buildId)}/kv`,
      {
        headers,
        timeout,
        endpointName: 'getSnapAgentBuildKv',
        params: Object.fromEntries(
          Object.entries(params).filter(([key]) => !['buildId'].includes(key)),
        ) as RequestParams,
      },
    );
  }

  /**
   * List active participants in an audio room. Set includePast to return a deduped historical participant list for ended-room playback.
   */
  listAudioRoomParticipants(
    params: ApiListAudioRoomParticipantsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiListAudioRoomParticipants200Response>(
      '/v1/audio-room/participants',
      {
        headers,
        timeout,
        endpointName: 'listAudioRoomParticipants',
        params,
      },
    );
  }

  /**
   * List all miniapp manifests
   */
  devToolsListMiniAppManifests(
    params: ApiDevToolsListMiniAppManifestsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiDevToolsListMiniAppManifests200Response>(
      '/v1/dev-tools/list-manifests',
      {
        headers,
        timeout,
        endpointName: 'devToolsListMiniAppManifests',
        params,
      },
    );
  }

  /**
   * List and search for channel banned users
   */
  fcGetChannelBannedUsers(
    params: ApiFcGetChannelBannedUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetChannelBannedUsers200Response>(
      '/fc/channel-bans',
      {
        headers,
        timeout,
        endpointName: 'fcGetChannelBannedUsers',
        params,
      },
    );
  }

  /**
   * List and search for channel banned users
   */
  getChannelBannedUsers(
    params: ApiGetChannelBannedUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelBannedUsers200Response>(
      '/v1/channel-banned-users',
      {
        headers,
        timeout,
        endpointName: 'getChannelBannedUsers',
        params,
      },
    );
  }

  /**
   * List and search members and directly invitable moderators of a channel
   */
  getChannelUsersForManagement(
    params: ApiGetChannelUsersForManagementQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelUsersForManagement200Response>(
      '/v1/manage-channel-users',
      {
        headers,
        timeout,
        endpointName: 'getChannelUsersForManagement',
        params,
      },
    );
  }

  /**
   * List and search users to invite to a channel
   */
  getChannelUsersForInvite(
    params: ApiGetChannelUsersForInviteQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelUsersForInvite200Response>(
      '/v1/invite-channel-users',
      {
        headers,
        timeout,
        endpointName: 'getChannelUsersForInvite',
        params,
      },
    );
  }

  /**
   * List currently-live audio rooms (admin-only v1).
   */
  listLiveAudioRooms(
    params: ApiListLiveAudioRoomsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiListLiveAudioRooms200Response>('/v1/audio-rooms', {
      headers,
      timeout,
      endpointName: 'listLiveAudioRooms',
      params,
    });
  }

  /**
   * List embedded wallets for the authenticated user
   */
  listEmbeddedWallets(
    params: ApiListEmbeddedWalletsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiListEmbeddedWallets200Response>(
      '/v2/wallet/embedded-wallets',
      {
        headers,
        timeout,
        endpointName: 'listEmbeddedWallets',
        params,
      },
    );
  }

  /**
   * List hidden featured apps
   */
  listHiddenFeaturedApps({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiListHiddenFeaturedApps200Response>(
      '/v1/hidden-featured-app-admin/list',
      {
        headers,
        timeout,
        endpointName: 'listHiddenFeaturedApps',
      },
    );
  }

  /**
   * List image assets for a snap build
   */
  getSnapAgentBuildAssets(
    params: { buildId: string },
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSnapAgentBuildAssets200Response>(
      `/v2/snap/agent/builds/${encodeURIComponent(params.buildId)}/assets`,
      {
        headers,
        timeout,
        endpointName: 'getSnapAgentBuildAssets',
      },
    );
  }

  /**
   * List mini app push notification configurations (admin only).
   */
  adminListMiniAppPushNotificationConfigs({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiAdminListMiniAppPushNotificationConfigs200Response>(
      '/v2/admin-mini-app-push-notifications',
      {
        headers,
        timeout,
        endpointName: 'adminListMiniAppPushNotificationConfigs',
      },
    );
  }

  /**
   * List or search for followers and/or members of a channel
   */
  getChannelUsers(
    params: ApiGetChannelUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelUsers200Response>('/v1/channel-users', {
      headers,
      timeout,
      endpointName: 'getChannelUsers',
      params,
    });
  }

  /**
   * List the authenticated user's snap builds
   */
  getSnapAgentBuilds(
    params: ApiGetSnapAgentBuildsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSnapAgentBuilds200Response>(
      '/v2/snap/agent/builds',
      {
        headers,
        timeout,
        endpointName: 'getSnapAgentBuilds',
        params,
      },
    );
  }

  /**
   * List tokens eligible for gasless swaps
   */
  getSwapGaslessTokens(
    params: ApiGetSwapGaslessTokensQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSwapGaslessTokens200Response>(
      '/v2/swaps/gasless-tokens',
      {
        headers,
        timeout,
        endpointName: 'getSwapGaslessTokens',
        params,
      },
    );
  }

  /**
   * List upcoming scheduled audio rooms.
   */
  listScheduledAudioRooms(
    params: ApiListScheduledAudioRoomsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiListScheduledAudioRooms200Response>(
      '/v1/audio-rooms/scheduled',
      {
        headers,
        timeout,
        endpointName: 'listScheduledAudioRooms',
        params,
      },
    );
  }

  /**
   * Lists of cast collectibles
   */
  getCastCollectiblesIndex(
    params: ApiGetCastCollectiblesIndexQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetCastCollectiblesIndex200Response>(
      '/v2/cast-collectibles-index',
      {
        headers,
        timeout,
        endpointName: 'getCastCollectiblesIndex',
        params,
      },
    );
  }

  /**
   * Mark a direct cast convo as read.
   */
  fcPostMarkConversationAsRead(
    body: ApiFcPostMarkConversationAsReadRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcPostMarkConversationAsRead200Response>(
      '/fc/mark-conversation-read',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'fcPostMarkConversationAsRead',
        body,
      },
    );
  }

  /**
   * Mark a direct cast mentions as read.
   */
  fcPostMarkMentionsAsRead({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiFcPostMarkMentionsAsRead200Response>(
      '/fc/mark-mentions-as-read',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'fcPostMarkMentionsAsRead',
        body: {},
      },
    );
  }

  /**
   * Mark a domain as harmful (admin only). Used to flag any harmful domain, mini-app or otherwise.
   */
  adminMarkMiniAppHarmful(
    body: ApiAdminMarkMiniAppHarmfulRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiAdminMarkMiniAppHarmful200Response>(
      '/v2/admin-mini-app-harmful',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminMarkMiniAppHarmful',
        body,
      },
    );
  }

  /**
   * Mark a peer-to-peer payment as completed
   */
  completePeerToPeerPayment(
    body: ApiCompletePeerToPeerPaymentRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCompletePeerToPeerPayment200Response>(
      '/v2/complete-peer-to-peer-payment',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'completePeerToPeerPayment',
        body,
      },
    );
  }

  /**
   * Mark all notifications as read.
   */
  markAllNotificationsRead({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiMarkAllNotificationsRead200Response>(
      '/v2/mark-all-notifications-read',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markAllNotificationsRead',
        body: {},
      },
    );
  }

  /**
   * Mark all notifications in a tab as seen.
   */
  markAllTabNotificationsSeen(
    body: ApiMarkAllTabNotificationsSeenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiMarkAllTabNotificationsSeen200Response>(
      '/v2/mark-tab-notifications-seen',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markAllTabNotificationsSeen',
        body,
      },
    );
  }

  /**
   * Mark all warp transactions as read.
   */
  markAllWarpTransactionsRead({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiMarkAllWarpTransactionsRead200Response>(
      '/v2/mark-all-warp-transactions-read',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markAllWarpTransactionsRead',
        body: {},
      },
    );
  }

  /**
   * Mark an nux task as completed
   */
  completeNuxTask(
    body: ApiCompleteNuxTaskRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCompleteNuxTask200Response>('/v2/nux/task/complete', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'completeNuxTask',
      body,
    });
  }

  /**
   * Mark direct cast key as dead. (deprecated)
   */
  markDirectCastKeyAsDead(
    body: ApiMarkDirectCastKeyAsDeadRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiMarkDirectCastKeyAsDead200Response>(
      '/v2/direct-cast-keys',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markDirectCastKeyAsDead',
        body,
      },
    );
  }

  /**
   * Mark direct cast keys as dead. (deprecated)
   */
  deleteDirectCastKeysByInbox(
    params: ApiDeleteDirectCastKeysByInboxQueryParams,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteDirectCastKeysByInbox200Response>(
      '/v2/direct-cast-device-keys',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteDirectCastKeysByInbox',
        params,
      },
    );
  }

  /**
   * Mark prompt seen for user
   */
  markPromptedFor(
    body: ApiMarkPromptedForRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiMarkPromptedFor200Response>('/v2/mark-prompted-for', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'markPromptedFor',
      body,
    });
  }

  /**
   * Mark suggested users as seen
   */
  setSuggestedUsersAsSeen(
    body: ApiSetSuggestedUsersAsSeenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetSuggestedUsersAsSeen200Response>(
      '/v1/suggested-users-seen',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setSuggestedUsersAsSeen',
        body,
      },
    );
  }

  /**
   * Mark user nudged for interests step during onboarding.
   */
  markNudgedForInterests({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiMarkNudgedForInterests200Response>(
      '/v2/mark-nudged-for-interests',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markNudgedForInterests',
        body: {},
      },
    );
  }

  /**
   * Mark user nudged for push notifications step during onboarding.
   */
  markNudgedForPushNotifications({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiMarkNudgedForPushNotifications200Response>(
      '/v2/mark-nudged-for-push-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markNudgedForPushNotifications',
        body: {},
      },
    );
  }

  /**
   * Mark verification process start
   */
  markVerificationsStart({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiMarkVerificationsStart200Response>(
      '/v2/mark-verifications-start',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markVerificationsStart',
        body: {},
      },
    );
  }

  /**
   * Marks a conversation as read.
   */
  postDirectCastReadV3(
    body: ApiPostDirectCastReadV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostDirectCastReadV3200Response>(
      '/v2/direct-cast-mark-read',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postDirectCastReadV3',
        body,
      },
    );
  }

  /**
   * Marks the synchronization channel message as read for the requesting device.
   */
  markSyncChannelMessageRead(
    body: ApiMarkSyncChannelMessageReadRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiMarkSyncChannelMessageRead200Response>(
      '/v2/sync-channel-read',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'markSyncChannelMessageRead',
        body,
      },
    );
  }

  /**
   * Moderate a cast
   */
  fcModerateCast(
    body: ApiFcModerateCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcModerateCast200Response>('/fc/moderated-casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcModerateCast',
      body,
    });
  }

  /**
   * Monitor a remote SIWF request
   */
  getRemoteSiwfRequest(
    params: ApiGetRemoteSiwfRequestQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetRemoteSiwfRequest200Response>(
      '/v1/remote-siwf',
      {
        headers,
        timeout,
        endpointName: 'getRemoteSiwfRequest',
        params,
      },
    );
  }

  /**
   * No longer limit the content visibility between users.
   */
  removeVisibilityRestrictions(
    body: ApiRemoveVisibilityRestrictionsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveVisibilityRestrictions200Response>(
      '/v2/limit-visibility',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeVisibilityRestrictions',
        body,
      },
    );
  }

  /**
   * Notify a user about a campaign
   */
  notifyUsersAboutCampaign(
    body: ApiNotifyUsersAboutCampaignRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiNotifyUsersAboutCampaign200Response>(
      '/v2/campaign-admin/notify',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'notifyUsersAboutCampaign',
        body,
      },
    );
  }

  /**
   * Opens a page that loads JavaScript to sign a recovery transaction hash.
   */
  signRecoveryTransactionHash(
    params: ApiSignRecoveryTransactionHashQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/sign-recovery-transaction-hash', {
      headers,
      timeout,
      endpointName: 'signRecoveryTransactionHash',
      params,
    });
  }

  /**
   * Override a user's Neynar score.
   */
  setNeynarScoreOverride(
    body: ApiSetNeynarScoreOverrideRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetNeynarScoreOverride200Response>(
      '/v2/set-neynar-score-override',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setNeynarScoreOverride',
        body,
      },
    );
  }

  /**
   * Pin a cast to its channel
   */
  fcPinCast(
    body: ApiFcPinCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiFcPinCast200Response>('/fc/pinned-casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPinCast',
      body,
    });
  }

  /**
   * Pin a direct cast conversation.
   */
  pinDirectCastConversation(
    body: ApiPinDirectCastConversationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPinDirectCastConversation200Response>(
      '/v2/direct-cast-pin-conversation',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'pinDirectCastConversation',
        body,
      },
    );
  }

  /**
   * Pin cast on user profile.
   */
  pinCastOnUserProfile(
    body: ApiPinCastOnUserProfileRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPinCastOnUserProfile200Response>(
      '/v2/user-profile-pinned-casts',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'pinCastOnUserProfile',
        body,
      },
    );
  }

  /**
   * Prepare a video upload
   */
  prepareVideoUpload(
    body: ApiPrepareVideoUploadRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPrepareVideoUpload200Response>(
      '/v1/prepare-video-upload',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'prepareVideoUpload',
        body,
      },
    );
  }

  /**
   * Prepare an onchain limit order for signing
   */
  prepareLimitOrder(
    body: ApiPrepareLimitOrderRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPrepareLimitOrder200Response>(
      '/v1/onchain/limit-orders/prepare',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'prepareLimitOrder',
        body,
      },
    );
  }

  /**
   * Prewarm a snap agent container for a conversation
   */
  postSnapAgentPrewarm(
    body: ApiPostSnapAgentPrewarmRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostSnapAgentPrewarm200Response>(
      '/v2/snap/agent/prewarm',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postSnapAgentPrewarm',
        body,
      },
    );
  }

  /**
   * Process results of Cloudflare Turnstile challenge
   */
  setTurnstileChallengeState(
    body: ApiSetTurnstileChallengeStateRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSetTurnstileChallengeState200Response>(
      '/v1/turnstile',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setTurnstileChallengeState',
        body,
      },
    );
  }

  /**
   * Proxy a request to a snap server, optionally signing a JFS payload with the user's key.
   */
  snapRequest(
    body: ApiSnapRequestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSnapRequest200Response>('/v2/snap-request', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'snapRequest',
      body,
    });
  }

  /**
   * Proxy an authentication request to the relay server
   */
  signInWithFarcaster(
    body: ApiSignInWithFarcasterRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSignInWithFarcaster200Response>(
      '/v2/sign-in-with-farcaster',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'signInWithFarcaster',
        body,
      },
    );
  }

  /**
   * Publicly return all blocked users
   */
  fcGetBlockedUsers(
    params: ApiFcGetBlockedUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiFcGetBlockedUsers200Response>(
      '/fc/blocked-users',
      {
        headers,
        timeout,
        endpointName: 'fcGetBlockedUsers',
        params,
      },
    );
  }

  /**
   * Publish a snap from an agent conversation
   */
  postSnapAgentPublish(
    body: ApiPostSnapAgentPublishRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostSnapAgentPublish200Response>(
      '/v2/snap/agent/publish',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postSnapAgentPublish',
        body,
      },
    );
  }

  /**
   * Recast a cast.
   */
  createRecast(
    body: ApiCreateRecastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateRecast200Response>('/v2/recasts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createRecast',
      body,
    });
  }

  /**
   * Receive App Store Server Notifications.
   */
  receiveAppStoreServerNotification(
    body: ApiReceiveAppStoreServerNotificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiReceiveAppStoreServerNotification200Response>(
      '/v2/app-store-server-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'receiveAppStoreServerNotification',
        body,
      },
    );
  }

  /**
   * Receive Coinbase Commerce webhook events.
   */
  receiveCoinbaseCommerceWebhookEvent({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiReceiveCoinbaseCommerceWebhookEvent200Response>(
      '/coinbase-commerce-webhook-event',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'receiveCoinbaseCommerceWebhookEvent',
        body: {},
      },
    );
  }

  /**
   * Receive sandbox App Store Server Notifications.
   */
  receiveAppStoreServerNotificationSandbox(
    body: ApiReceiveAppStoreServerNotificationSandboxRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiReceiveAppStoreServerNotificationSandbox200Response>(
      '/v2/app-store-server-notifications-sandbox',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'receiveAppStoreServerNotificationSandbox',
        body,
      },
    );
  }

  /**
   * Record active speaker activity for recorded audio room playback.
   */
  recordAudioRoomSpeakerActivity(
    body: ApiRecordAudioRoomSpeakerActivityRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRecordAudioRoomSpeakerActivity200Response>(
      '/v1/audio-room/speaker-activity',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'recordAudioRoomSpeakerActivity',
        body,
      },
    );
  }

  /**
   * Record analytics events for storage in S3
   */
  recordAnalyticsEvents(
    body: ApiRecordAnalyticsEventsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRecordAnalyticsEvents200Response>(
      '/v1/analytics-events',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'recordAnalyticsEvents',
        body,
      },
    );
  }

  /**
   * Record host/cohost/speaker activity for inactivity auto-end.
   */
  heartbeatAudioRoom(
    body: ApiHeartbeatAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiHeartbeatAudioRoom200Response>(
      '/v1/audio-room/heartbeat',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'heartbeatAudioRoom',
        body,
      },
    );
  }

  /**
   * Records a transaction from a wallet initiated in Warpcast
   */
  recordWalletTransaction(
    body: ApiRecordWalletTransactionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiRecordWalletTransaction200Response>(
      '/v2/wallet/record-transaction',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'recordWalletTransaction',
        body,
      },
    );
  }

  /**
   * Redirect client to a presigned URL to upload a video directly to Cloudflare using the TUS protocol.
   */
  uploadVideoWithTus(
    params: ApiUploadVideoWithTusQueryParams,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<void>('/v1/upload-video-with-tus', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'uploadVideoWithTus',
      params,
    });
  }

  /**
   * Redirect to the specified URL, validating the signature.
   */
  redirectToLink(
    params: ApiRedirectToLinkQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/links', {
      headers,
      timeout,
      endpointName: 'redirectToLink',
      params,
    });
  }

  /**
   * Redirect to the specified URL, validating the signature. (FID based)
   */
  redirectToLinkV2(
    params: ApiRedirectToLinkV2QueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/links-v2', {
      headers,
      timeout,
      endpointName: 'redirectToLinkV2',
      params,
    });
  }

  /**
   * Redirect to the specified farcaster:// URL. Not signed.
   */
  redirectToDeepLink({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<void>('/deeplinks/*', {
      headers,
      timeout,
      endpointName: 'redirectToDeepLink',
    });
  }

  /**
   * Refresh a domain manifest
   */
  devToolsRefreshDomainManifest(
    body: ApiDevToolsRefreshDomainManifestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsRefreshDomainManifest200Response>(
      '/v1/dev-tools/refresh-domain-manifest',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsRefreshDomainManifest',
        body,
      },
    );
  }

  /**
   * Refresh an onchain token
   */
  refreshOnchainToken(
    params: ApiRefreshOnchainTokenQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiRefreshOnchainToken200Response>(
      '/v1/onchain/tokens/refresh',
      {
        headers,
        timeout,
        endpointName: 'refreshOnchainToken',
        params,
      },
    );
  }

  /**
   * Refresh domain manifest
   */
  refreshDomainManifestState(
    body: ApiRefreshDomainManifestStateRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRefreshDomainManifestState200Response>(
      '/v1/domain-manifest',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'refreshDomainManifestState',
        body,
      },
    );
  }

  /**
   * Refresh the attachments for a cast
   */
  devToolsForceRefreshCastAttachments(
    body: ApiDevToolsForceRefreshCastAttachmentsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsForceRefreshCastAttachments200Response>(
      '/v1/dev-tools/force-refresh-cast-attachments',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsForceRefreshCastAttachments',
        body,
      },
    );
  }

  /**
   * Refresh the open graph metadata for a URL
   */
  devToolsRefreshOpenGraphMetadata(
    body: ApiDevToolsRefreshOpenGraphMetadataRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsRefreshOpenGraphMetadata200Response>(
      '/v1/dev-tools/refresh-open-graph-metadata',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsRefreshOpenGraphMetadata',
        body,
      },
    );
  }

  /**
   * Register a secondary embedded wallet for the authenticated user
   */
  registerEmbeddedWallet(
    body: ApiRegisterEmbeddedWalletRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRegisterEmbeddedWallet200Response>(
      '/v2/wallet/embedded-wallets',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'registerEmbeddedWallet',
        body,
      },
    );
  }

  /**
   * Register an FID for the authenticated address.
   */
  registerFid(
    body: ApiRegisterFidRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiRegisterFid200Response>('/v2/register-fid', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'registerFid',
      body,
    });
  }

  /**
   * Register an app domain
   */
  devToolsRegisterDomain(
    body: ApiDevToolsRegisterDomainRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsRegisterDomain200Response>(
      '/v1/dev-tools/register-domain',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsRegisterDomain',
        body,
      },
    );
  }

  /**
   * Register information about a user's device.
   */
  registerDevice(
    body: ApiRegisterDeviceRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiRegisterDevice200Response>('/v2/devices', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'registerDevice',
      body,
    });
  }

  /**
   * Registers a discovery app
   */
  addDiscoveryApp(
    body: ApiAddDiscoveryAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAddDiscoveryApp200Response>('/v2/discovery-app', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addDiscoveryApp',
      body,
    });
  }

  /**
   * Registers a discovery frame
   */
  addDiscoveryFrame(
    body: ApiAddDiscoveryFrameRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAddDiscoveryFrame200Response>('/v2/discovery-frame', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'addDiscoveryFrame',
      body,
    });
  }

  /**
   * Reject a recovery
   */
  rejectRecovery({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiRejectRecovery200Response>('/v2/reject-recovery', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'rejectRecovery',
      body: {},
    });
  }

  /**
   * Remember that a new user has seen the instructions interstitial
   */
  dismissNewUserFollowInstructions({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiDismissNewUserFollowInstructions200Response>(
      '/v1/dismiss-new-user-follow-instructions',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'dismissNewUserFollowInstructions',
        body: {},
      },
    );
  }

  /**
   * Remove a Snap URL from the exact Snap URL blocklist.
   */
  adminUnblockSnapUrl(
    body: ApiAdminUnblockSnapUrlRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiAdminUnblockSnapUrl200Response>(
      '/v2/admin-snap-blocklist',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminUnblockSnapUrl',
        body,
      },
    );
  }

  /**
   * Remove a ban from a user in a channel
   */
  fcUnbanUserFromChannel(
    body: ApiFcUnbanUserFromChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiFcUnbanUserFromChannel200Response>(
      '/fc/channel-bans',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'fcUnbanUserFromChannel',
        body,
      },
    );
  }

  /**
   * Remove a ban from a user in a channel
   */
  unbanUserFromChannel(
    body: ApiUnbanUserFromChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiUnbanUserFromChannel200Response>(
      '/v1/channel-banned-users',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'unbanUserFromChannel',
        body,
      },
    );
  }

  /**
   * Remove a channel from a user's mute list
   */
  removeMutedChannel(
    body: ApiRemoveMutedChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRemoveMutedChannel200Response>('/v2/unmute-channel', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'removeMutedChannel',
      body,
    });
  }

  /**
   * Remove a direct cast group's members.
   */
  fcDeleteGroupMembers(
    body: ApiFcDeleteGroupMembersRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiFcDeleteGroupMembers200Response>(
      '/fc/group-members',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'fcDeleteGroupMembers',
        body,
      },
    );
  }

  /**
   * Remove a favorite a feed
   */
  removeFavoriteFeed(
    body: ApiRemoveFavoriteFeedRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveFavoriteFeed200Response>('/v2/favorite-feeds', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'removeFavoriteFeed',
      body,
    });
  }

  /**
   * Remove a featured app
   */
  removeFeaturedApp(
    body: ApiRemoveFeaturedAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRemoveFeaturedApp200Response>(
      '/v1/featured-app-admin/remove',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeFeaturedApp',
        body,
      },
    );
  }

  /**
   * Remove a hidden featured app
   */
  removeHiddenFeaturedApp(
    body: ApiRemoveHiddenFeaturedAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRemoveHiddenFeaturedApp200Response>(
      '/v1/hidden-featured-app-admin/remove',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeHiddenFeaturedApp',
        body,
      },
    );
  }

  /**
   * Remove a keyword from a user's mute list
   */
  removeMuteKeyword(
    body: ApiRemoveMuteKeywordRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRemoveMuteKeyword200Response>('/v2/unmute-keyword', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'removeMuteKeyword',
      body,
    });
  }

  /**
   * Remove a reaction from a cast.
   */
  deleteCastLike(
    body: ApiDeleteCastLikeRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteCastLike200Response>('/v2/cast-likes', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteCastLike',
      body,
    });
  }

  /**
   * Remove a role from a domain
   */
  devToolsRemoveDomainRole(
    body: ApiDevToolsRemoveDomainRoleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDevToolsRemoveDomainRole200Response>(
      '/v1/dev-tools/domain-roles',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsRemoveDomainRole',
        body,
      },
    );
  }

  /**
   * Remove a tips from a user
   */
  removeTip(
    body: ApiRemoveTipRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRemoveTip200Response>('/v2/farcaster-tips/remove-tip', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'removeTip',
      body,
    });
  }

  /**
   * Remove a user from a channel as a member or moderator
   */
  removeChannelUserFromRole(
    body: ApiRemoveChannelUserFromRoleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveChannelUserFromRole200Response>(
      '/v1/manage-channel-users',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeChannelUserFromRole',
        body,
      },
    );
  }

  /**
   * Remove a user from a channel as a member or moderator (public signer version)
   */
  fcRemoveUserFromChannelRole(
    body: ApiFcRemoveUserFromChannelRoleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiFcRemoveUserFromChannelRole200Response>(
      '/fc/channel-invites',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'fcRemoveUserFromChannelRole',
        body,
      },
    );
  }

  /**
   * Remove boost from cast in a channel
   */
  removeCastBoost(
    body: ApiRemoveCastBoostRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveCastBoost200Response>('/v2/boost-cast', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'removeCastBoost',
      body,
    });
  }

  /**
   * Remove cast bookmark.
   */
  removeCastBookmark(
    body: ApiRemoveCastBookmarkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveCastBookmark200Response>(
      '/v2/bookmarked-casts',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeCastBookmark',
        body,
      },
    );
  }

  /**
   * Remove fid from the no-fee allowlist (internal)
   */
  retoolDeleteNoFeeAllowlistEntry(
    body: ApiRetoolDeleteNoFeeAllowlistEntryRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRetoolDeleteNoFeeAllowlistEntry200Response>(
      '/v2/retool-no-fee-allowlist',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'retoolDeleteNoFeeAllowlistEntry',
        body,
      },
    );
  }

  /**
   * Remove info about connected account
   */
  removeConnectedAccount(
    body: ApiRemoveConnectedAccountRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveConnectedAccount200Response>(
      '/v2/connected-accounts',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeConnectedAccount',
        body,
      },
    );
  }

  /**
   * Remove phone verification for a user
   */
  removePhoneVerificationForUser(
    body: ApiRemovePhoneVerificationForUserRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemovePhoneVerificationForUser200Response>(
      '/v2/quests/debug/remove-phone-verification',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removePhoneVerificationForUser',
        body,
      },
    );
  }

  /**
   * Remove the creator label from a user.
   */
  removeCreatorLabel(
    body: ApiRemoveCreatorLabelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveCreatorLabel200Response>(
      '/v2/remove-creator-label',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeCreatorLabel',
        body,
      },
    );
  }

  /**
   * Remove the harmful flag from a domain (admin only).
   */
  adminRemoveMiniAppHarmful(
    body: ApiAdminRemoveMiniAppHarmfulRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiAdminRemoveMiniAppHarmful200Response>(
      '/v2/admin-mini-app-harmful',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminRemoveMiniAppHarmful',
        body,
      },
    );
  }

  /**
   * Remove token from watchlist.
   */
  removeTokenFromWatchlist(
    body: ApiRemoveTokenFromWatchlistRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveTokenFromWatchlist200Response>(
      '/v2/token-watchlists',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeTokenFromWatchlist',
        body,
      },
    );
  }

  /**
   * Removes a reaction to the specified message.
   */
  deleteDirectCastConversationReactionsV3(
    body: ApiDeleteDirectCastConversationReactionsV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteDirectCastConversationReactionsV3200Response>(
      '/v2/direct-cast-message-reaction',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteDirectCastConversationReactionsV3',
        body,
      },
    );
  }

  /**
   * Removes a signer.
   */
  removeSigner(
    body: ApiRemoveSignerRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveSigner200Response>('/v2/signers', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'removeSigner',
      body,
    });
  }

  /**
   * Rent storage
   */
  rentStorage(
    body: ApiRentStorageRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRentStorage201Response>('/v2/rent-storage', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'rentStorage',
      body,
    });
  }

  /**
   * Rent transaction intent
   */
  rentTransactionData(
    params: ApiRentTransactionDataQueryParams,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<void>('/v2/rent-transaction-data', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'rentTransactionData',
      params,
    });
  }

  /**
   * Report a cast.
   */
  reportCast(
    body: ApiReportCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiReportCast200Response>('/v2/report-cast', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'reportCast',
      body,
    });
  }

  /**
   * Report a fraudulent or offensive token.
   */
  reportToken(
    body: ApiReportTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiReportToken200Response>('/v2/report-token', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'reportToken',
      body,
    });
  }

  /**
   * Report a user.
   */
  reportUser(
    body: ApiReportUserRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiReportUser200Response>('/v2/report-user', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'reportUser',
      body,
    });
  }

  /**
   * Reports activity the user has performed
   */
  reportProfileActivity(
    body: ApiReportProfileActivityRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiReportProfileActivity200Response>(
      '/v2/report-activity',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'reportProfileActivity',
        body,
      },
    );
  }

  /**
   * Request a deletion of an account.
   */
  requestAccountDelete({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiRequestAccountDelete200Response>(
      '/v2/request-account-delete',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'requestAccountDelete',
        body: {},
      },
    );
  }

  /**
   * Request a download of miniapp analytics
   */
  analyticsMiniAppRequestDownload(
    body: ApiAnalyticsMiniAppRequestDownloadRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAnalyticsMiniAppRequestDownload200Response>(
      '/v1/analytics/miniapps/request-download',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'analyticsMiniAppRequestDownload',
        body,
      },
    );
  }

  /**
   * Request a magic link (used for warpcast -> farcaster migration)
   */
  initiateMagicLinkDirect({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiInitiateMagicLinkDirect200Response>(
      '/v2/magic-link-direct',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'initiateMagicLinkDirect',
        body: {},
      },
    );
  }

  /**
   * Request a magic link email
   */
  initiateMagicLink(
    body: ApiInitiateMagicLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiInitiateMagicLink200Response>('/v2/magic-link', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'initiateMagicLink',
      body,
    });
  }

  /**
   * Request an invite email with an email address
   */
  signupForInvite(
    body: ApiSignupForInviteRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSignupForInvite200Response>('/v2/signup-for-invite', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'signupForInvite',
      body,
    });
  }

  /**
   * Reset explore feed cache (internal)
   */
  retoolResetExploreFeedCache({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiRetoolResetExploreFeedCache200Response>(
      '/v2/retool-reset-explore-feed-cache',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'retoolResetExploreFeedCache',
        body: {},
      },
    );
  }

  /**
   * Reset onboarding state associated with an email. (Super-admins only)
   */
  resetOnboardingState(
    body: ApiResetOnboardingStateRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiResetOnboardingState200Response>(
      '/v2/reset-onboarding-state',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'resetOnboardingState',
        body,
      },
    );
  }

  /**
   * Reset the dismissed tips banner for a user, admin only
   */
  resetDismissedTips(
    body: ApiResetDismissedTipsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiResetDismissedTips200Response>(
      '/v2/farcaster-tips/reset-dismissed',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'resetDismissedTips',
        body,
      },
    );
  }

  /**
   * Reset the invite code for a channel
   */
  resetChannelInviteCode(
    body: ApiResetChannelInviteCodeRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiResetChannelInviteCode200Response>(
      '/v1/reset-channel-invite-code',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'resetChannelInviteCode',
        body,
      },
    );
  }

  /**
   * Reset the nux tasks for a user, admin only
   */
  resetNuxTasks(
    body: ApiResetNuxTasksRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiResetNuxTasks200Response>('/v2/nux/task/reset', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'resetNuxTasks',
      body,
    });
  }

  /**
   * Reset the value of a dynamic config to its default
   */
  resetDynamicConfig(
    body: ApiResetDynamicConfigRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiResetDynamicConfig200Response>(
      '/v1/dynamic-configs',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'resetDynamicConfig',
        body,
      },
    );
  }

  /**
   * Reset transacting account circuit breaker state for OP and Base.
   */
  resetAccountCircuitBreaker(
    body: ApiResetAccountCircuitBreakerRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiResetAccountCircuitBreaker200Response>(
      '/v1/debug/reset-circuit-breaker',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'resetAccountCircuitBreaker',
        body,
      },
    );
  }

  /**
   * Reset user to go through new user experience
   */
  resetToNewUserExperience({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiResetToNewUserExperience200Response>(
      '/v1/reset-to-new-user-experience',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'resetToNewUserExperience',
        body: {},
      },
    );
  }

  /**
   * Resets cached open-graph preview and fetches a new one by scraping the URL again.
   */
  scrapeEmbed(
    body: ApiScrapeEmbedRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiScrapeEmbed200Response>('/v2/scrape-embed', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'scrapeEmbed',
      body,
    });
  }

  /**
   * Resets cached open-graph preview and fetches and validates a frame open graph value set.
   */
  validateFrameEmbedV2(
    body: ApiValidateFrameEmbedV2RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiValidateFrameEmbedV2200Response>(
      '/v2/validate-frame-embed',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'validateFrameEmbedV2',
        body,
      },
    );
  }

  /**
   * Retrieve the synchronization channel messages for the requesting device.
   */
  getSyncChannel(
    params: ApiGetSyncChannelQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetSyncChannel200Response>('/v2/sync-channel', {
      headers,
      timeout,
      endpointName: 'getSyncChannel',
      params,
    });
  }

  /**
   * Retrieves NFTs for a given wallet
   */
  getWalletNfts(
    params: ApiGetWalletNftsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWalletNfts200Response>('/v2/wallet/nfts', {
      headers,
      timeout,
      endpointName: 'getWalletNfts',
      params,
    });
  }

  /**
   * Retrieves closed positions for an fid
   */
  getWalletPositionsClosed(
    params: ApiGetWalletPositionsClosedQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWalletPositionsClosed200Response>(
      '/v2/wallet/positions/closed',
      {
        headers,
        timeout,
        endpointName: 'getWalletPositionsClosed',
        params,
      },
    );
  }

  /**
   * Retrieves fungible positions for a given wallet
   */
  getWalletPositions(
    params: ApiGetWalletPositionsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWalletPositions200Response>(
      '/v2/wallet/positions',
      {
        headers,
        timeout,
        endpointName: 'getWalletPositions',
        params,
      },
    );
  }

  /**
   * Retrieves open positions for an fid
   */
  getWalletPositionsOpen(
    params: ApiGetWalletPositionsOpenQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWalletPositionsOpen200Response>(
      '/v2/wallet/positions/open',
      {
        headers,
        timeout,
        endpointName: 'getWalletPositionsOpen',
        params,
      },
    );
  }

  /**
   * Retrieves the reactions to a specific message.
   */
  getDirectCastConversationReactionsV3(
    params: ApiGetDirectCastConversationReactionsV3QueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDirectCastConversationReactionsV3200Response>(
      '/v2/direct-cast-message-reaction',
      {
        headers,
        timeout,
        endpointName: 'getDirectCastConversationReactionsV3',
        params,
      },
    );
  }

  /**
   * Return a few channels and users matching the given search query.
   */
  searchSummary(
    params: ApiSearchSummaryQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchSummary200Response>('/v2/search-summary', {
      headers,
      timeout,
      endpointName: 'searchSummary',
      params,
    });
  }

  /**
   * Return a hosted miniapp manifest
   */
  miniappsHostedManifest(
    params: { id: string },
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>(
      `/miniapps/hosted-manifest/${encodeURIComponent(params.id)}`,
      {
        headers,
        timeout,
        endpointName: 'miniappsHostedManifest',
      },
    );
  }

  /**
   * Return a robotos.txt that disallows crawling our APIs
   */
  getRobotsTxt({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<void>('/robots.txt', {
      headers,
      timeout,
      endpointName: 'getRobotsTxt',
    });
  }

  /**
   * Return all casts matching the given search query.
   */
  searchCasts(
    params: ApiSearchCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchCasts200Response>('/v2/search-casts', {
      headers,
      timeout,
      endpointName: 'searchCasts',
      params,
    });
  }

  /**
   * Return all channels
   */
  getAllChannelsPublic({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetAllChannelsPublic200Response>(
      '/v2/all-channels',
      {
        headers,
        timeout,
        endpointName: 'getAllChannelsPublic',
      },
    );
  }

  /**
   * Return all channels matching the given search query.
   */
  searchChannels(
    params: ApiSearchChannelsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchChannels200Response>('/v2/search-channels', {
      headers,
      timeout,
      endpointName: 'searchChannels',
      params,
    });
  }

  /**
   * Return all direct cast conversations matching the given search query.
   */
  searchDirectCasts(
    params: ApiSearchDirectCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchDirectCasts200Response>(
      '/v2/search-direct-casts',
      {
        headers,
        timeout,
        endpointName: 'searchDirectCasts',
        params,
      },
    );
  }

  /**
   * Return all inbox conversations matching the given search query.
   */
  searchDirectCastInbox(
    params: ApiSearchDirectCastInboxQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchDirectCastInbox200Response>(
      '/v2/search-direct-cast-inbox',
      {
        headers,
        timeout,
        endpointName: 'searchDirectCastInbox',
        params,
      },
    );
  }

  /**
   * Return all users matching the given search query.
   */
  searchUsers(
    params: ApiSearchUsersQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchUsers200Response>('/v2/search-users', {
      headers,
      timeout,
      endpointName: 'searchUsers',
      params,
    });
  }

  /**
   * Return channel information
   */
  getChannelPublic(
    params: ApiGetChannelPublicQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelPublic200Response>('/v1/channel', {
      headers,
      timeout,
      endpointName: 'getChannelPublic',
      params,
    });
  }

  /**
   * Return channels a user is following
   */
  getUserFollowingChannelsPublic(
    params: ApiGetUserFollowingChannelsPublicQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserFollowingChannelsPublic200Response>(
      '/v1/user-following-channels',
      {
        headers,
        timeout,
        endpointName: 'getUserFollowingChannelsPublic',
        params,
      },
    );
  }

  /**
   * Return success if API key is valid.
   */
  validateApiKey({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiValidateApiKey200Response>(
      '/v2/validate-api-key',
      {
        headers,
        timeout,
        endpointName: 'validateApiKey',
      },
    );
  }

  /**
   * Return success if DC auth token is valid
   */
  validateDCAuthToken({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiValidateDCAuthToken200Response>(
      '/v2/validate-dc-auth-token',
      {
        headers,
        timeout,
        endpointName: 'validateDCAuthToken',
      },
    );
  }

  /**
   * Return the status of a user potentially following a channel
   */
  getUserChannelPublic(
    params: ApiGetUserChannelPublicQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetUserChannelPublic200Response>(
      '/v1/user-channel',
      {
        headers,
        timeout,
        endpointName: 'getUserChannelPublic',
        params,
      },
    );
  }

  /**
   * Return users who follow a channel
   */
  getChannelFollowersPublic(
    params: ApiGetChannelFollowersPublicQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetChannelFollowersPublic200Response>(
      '/v1/channel-followers',
      {
        headers,
        timeout,
        endpointName: 'getChannelFollowersPublic',
        params,
      },
    );
  }

  /**
   * Returns IP address information for debugging rate limiting.
   */
  getIpInfo({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetIpInfo200Response>('/v1/debug/ip-info', {
      headers,
      timeout,
      endpointName: 'getIpInfo',
    });
  }

  /**
   * Returns a full cast collectible image
   */
  getCastCollectibleImage(
    params: ApiGetCastCollectibleImageQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/cast-collectibles/image', {
      headers,
      timeout,
      endpointName: 'getCastCollectibleImage',
      params,
    });
  }

  /**
   * Returns a thumbnail image for a cast collectible
   */
  getCastCollectibleThumbnail(
    params: ApiGetCastCollectibleThumbnailQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/cast-collectibles/thumbnail', {
      headers,
      timeout,
      endpointName: 'getCastCollectibleThumbnail',
      params,
    });
  }

  /**
   * Returns common share targets for cast
   */
  shareCast(
    params: ApiShareCastQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiShareCast200Response>('/v2/share-cast', {
      headers,
      timeout,
      endpointName: 'shareCast',
      params,
    });
  }

  /**
   * Returns common share targets sending a resource via DC
   */
  shareViaDC(
    params: ApiShareViaDCQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiShareViaDC200Response>('/v2/share-via-dc', {
      headers,
      timeout,
      endpointName: 'shareViaDC',
      params,
    });
  }

  /**
   * Returns derived public addresses for mounted mnemonic/private-key env secrets without a paired public address env var (Retool).
   */
  retoolGetEnvSecretAddresses({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiRetoolGetEnvSecretAddresses200Response>(
      '/v2/retool-env-secret-addresses',
      {
        headers,
        timeout,
        endpointName: 'retoolGetEnvSecretAddresses',
      },
    );
  }

  /**
   * Returns information about onboarding state. (Super-admins only)
   */
  lookupOnboardingState(
    params: ApiLookupOnboardingStateQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiLookupOnboardingState200Response>(
      '/v2/lookup-onboarding-state',
      {
        headers,
        timeout,
        endpointName: 'lookupOnboardingState',
        params,
      },
    );
  }

  /**
   * Returns rituals for channel or draft casts
   */
  getDraftCasts(
    params: ApiGetDraftCastsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDraftCasts200Response>('/v2/draft-casts', {
      headers,
      timeout,
      endpointName: 'getDraftCasts',
      params,
    });
  }

  /**
   * Returns rituals for channel or draft caststorms
   */
  getDraftCaststorms(
    params: ApiGetDraftCaststormsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetDraftCaststorms200Response>(
      '/v2/draft-caststorms',
      {
        headers,
        timeout,
        endpointName: 'getDraftCaststorms',
        params,
      },
    );
  }

  /**
   * Returns the active channel streak for the user
   */
  getActiveChannelStreak(
    params: ApiGetActiveChannelStreakQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetActiveChannelStreak200Response>(
      '/v2/channel-streaks',
      {
        headers,
        timeout,
        endpointName: 'getActiveChannelStreak',
        params,
      },
    );
  }

  /**
   * Returns the authenticated user's verified email address.
   */
  getAuthenticatedUserEmail({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetAuthenticatedUserEmail200Response>(
      '/v2/me/email',
      {
        headers,
        timeout,
        endpointName: 'getAuthenticatedUserEmail',
      },
    );
  }

  /**
   * Returns the curated list of wallet link cards shown in the wallet tab. Default response is the public shape (enabled rows only, minimal fields) regardless of caller identity. Pass `adminView=true` to request the admin shape (all rows including disabled, all fields); the request is rejected with 403 unless the caller also holds the `can_update_wallet_links` gate. Splitting admin behind an explicit query param keeps internal-team FIDs from silently receiving a different sort order when the mobile carousel calls this endpoint.
   */
  getWalletLinks(
    params: ApiGetWalletLinksQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetWalletLinks200Response>('/v2/wallet-links', {
      headers,
      timeout,
      endpointName: 'getWalletLinks',
      params,
    });
  }

  /**
   * Returns the farcaster json from the given domain
   */
  devToolsFarcasterJson(
    params: ApiDevToolsFarcasterJsonQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v1/dev-tools/farcaster-json', {
      headers,
      timeout,
      endpointName: 'devToolsFarcasterJson',
      params,
    });
  }

  /**
   * Returns the raw metatags from the given URL
   */
  devToolsMetaTags(
    params: ApiDevToolsMetaTagsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v1/dev-tools/meta-tags', {
      headers,
      timeout,
      endpointName: 'devToolsMetaTags',
      params,
    });
  }

  /**
   * Returns whether the server is healthy and responding to requests.
   */
  getHealth({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<ApiGetHealth200Response>('/healthcheck', {
      headers,
      timeout,
      endpointName: 'getHealth',
    });
  }

  /**
   * Reverse chrono feed of all casters in the starter pack
   */
  getStarterPackFeed(
    params: ApiGetStarterPackFeedQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetStarterPackFeed200Response>(
      '/v2/starter-packs/feed',
      {
        headers,
        timeout,
        endpointName: 'getStarterPackFeed',
        params,
      },
    );
  }

  /**
   * Revokes a specific auth session for the authenticated user.
   */
  revokeAuthSession(
    body: ApiRevokeAuthSessionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiRevokeAuthSession200Response>(
      '/v2/auth/sessions/revoke',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'revokeAuthSession',
        body,
      },
    );
  }

  /**
   * Revokes a verification for the authenticated user.
   */
  deleteVerification(
    body: ApiDeleteVerificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteVerification200Response>('/v2/verifications', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteVerification',
      body,
    });
  }

  /**
   * Revokes an API key.
   */
  revokeApiKey(
    body: ApiRevokeApiKeyRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiRevokeApiKey200Response>('/v2/revoke-api-key', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'revokeApiKey',
      body,
    });
  }

  /**
   * Revokes an authentication token.
   */
  deleteAuthToken({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.delete<ApiDeleteAuthToken200Response>('/v2/auth', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteAuthToken',
      body: {},
    });
  }

  /**
   * Save a deferred deep link with IP and user agent information.
   */
  saveDeferredDeepLink(
    body: ApiSaveDeferredDeepLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSaveDeferredDeepLink200Response>(
      '/deferred-deep-links',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'saveDeferredDeepLink',
        body,
      },
    );
  }

  /**
   * Scan an EVM wallet action
   */
  walletEvmScanAction(
    body: ApiWalletEvmScanActionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiWalletEvmScanAction200Response>(
      '/v2/wallet/evm-scan-action',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'walletEvmScanAction',
        body,
      },
    );
  }

  /**
   * Scan an EVM wallet action
   */
  walletSolScanAction(
    body: ApiWalletSolScanActionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiWalletSolScanAction200Response>(
      '/v2/wallet/sol-scan-action',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'walletSolScanAction',
        body,
      },
    );
  }

  /**
   * Scrape CA to get a possible cast embed match
   */
  scrapeContractAddress(
    params: ApiScrapeContractAddressQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiScrapeContractAddress200Response>(
      '/v2/scrape-ca',
      {
        headers,
        timeout,
        endpointName: 'scrapeContractAddress',
        params,
      },
    );
  }

  /**
   * Search for miniapps
   */
  searchMiniapps(
    params: ApiSearchMiniappsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchMiniapps200Response>('/v1/search-miniapps', {
      headers,
      timeout,
      endpointName: 'searchMiniapps',
      params,
    });
  }

  /**
   * Search for miniapps autocomplete
   */
  searchMiniappsAutocomplete(
    params: ApiSearchMiniappsAutocompleteQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchMiniappsAutocomplete200Response>(
      '/v1/search-miniapps-autocomplete',
      {
        headers,
        timeout,
        endpointName: 'searchMiniappsAutocomplete',
        params,
      },
    );
  }

  /**
   * Search for targets to send to
   */
  searchWalletSendTargets(
    params: ApiSearchWalletSendTargetsQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchWalletSendTargets200Response>(
      '/v2/wallet/send-search',
      {
        headers,
        timeout,
        endpointName: 'searchWalletSendTargets',
        params,
      },
    );
  }

  /**
   * Send a direct cast message.
   */
  fcPutMessage(
    body: ApiFcPutMessageRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiFcPutMessage200Response>('/fc/message', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPutMessage',
      body,
    });
  }

  /**
   * Send a direct cast, for use by application developers.
   */
  putExtSendDirectCast(
    body: ApiPutExtSendDirectCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutExtSendDirectCast200Response>(
      '/v2/ext-send-direct-cast',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'putExtSendDirectCast',
        body,
      },
    );
  }

  /**
   * Send a notification to a user from a frame
   */
  sendFrameNotification(
    body: ApiSendFrameNotificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSendFrameNotification200Response>(
      '/v1/frame-notifications',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'sendFrameNotification',
        body,
      },
    );
  }

  /**
   * Send a recovery transaction signature representing an admin's approval of the recovery.
   */
  approveRecoveryTransaction(
    body: ApiApproveRecoveryTransactionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiApproveRecoveryTransaction200Response>(
      '/v2/approve-recovery-transaction',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'approveRecoveryTransaction',
        body,
      },
    );
  }

  /**
   * Send a test follow recommendation notification
   */
  sendTestFollowRecommendationNotification(
    body: ApiSendTestFollowRecommendationNotificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSendTestFollowRecommendationNotification200Response>(
      '/v2/send-test-follow-recommendation-notification',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'sendTestFollowRecommendationNotification',
        body,
      },
    );
  }

  /**
   * Send a test push notification
   */
  sendPushNotification(
    body: ApiSendPushNotificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSendPushNotification200Response>(
      '/v2/send-push-notification',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'sendPushNotification',
        body,
      },
    );
  }

  /**
   * Send a verification email to the specified email address, associating it with the given custody address.
   */
  sendVerificationEmail(
    body: ApiSendVerificationEmailRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSendVerificationEmail200Response>(
      '/v2/send-verification-email',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'sendVerificationEmail',
        body,
      },
    );
  }

  /**
   * Send an email to users about buying warps
   */
  sendBuyWarpsInfoEmail({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiSendBuyWarpsInfoEmail200Response>(
      '/v2/send-buy-warps-info-email',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'sendBuyWarpsInfoEmail',
        body: {},
      },
    );
  }

  /**
   * Send an email with a link to verify flow on web.
   */
  sendConnectAddressLinkEmail({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiSendConnectAddressLinkEmail200Response>(
      '/v2/send-connect-address-link-email',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'sendConnectAddressLinkEmail',
        body: {},
      },
    );
  }

  /**
   * Sends a direct cast.
   */
  putDirectCastV3(
    body: ApiPutDirectCastV3RequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutDirectCastV3200Response>('/v2/direct-cast-send', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'putDirectCastV3',
      body,
    });
  }

  /**
   * Set a user's warpcast wallet address
   */
  putWarpcastWalletAddress(
    body: ApiPutWarpcastWalletAddressRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutWarpcastWalletAddress200Response>(
      '/v2/warpcast-wallet-address',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'putWarpcastWalletAddress',
        body,
      },
    );
  }

  /**
   * Set channel distribution
   */
  setChannelDistribution(
    body: ApiSetChannelDistributionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetChannelDistribution200Response>(
      '/v2/channel-distribution',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setChannelDistribution',
        body,
      },
    );
  }

  /**
   * Set selected interests for an onboarding category
   */
  setOnboardingInterestCategories(
    body: ApiSetOnboardingInterestCategoriesRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetOnboardingInterestCategories200Response>(
      '/v2/onboarding-interests-v2',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setOnboardingInterestCategories',
        body,
      },
    );
  }

  /**
   * Set the active username on the authenticated user
   */
  setUserUsername(
    body: ApiSetUserUsernameRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetUserUsername200Response>('/v2/set-user-username', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setUserUsername',
      body,
    });
  }

  /**
   * Set the badness of a low quality user.
   */
  setLowQualityUserBadness(
    body: ApiSetLowQualityUserBadnessRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetLowQualityUserBadness200Response>(
      '/v1/set-low-quality-user-badness',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setLowQualityUserBadness',
        body,
      },
    );
  }

  /**
   * Set the creator label of a user.
   */
  setCreatorLabel(
    body: ApiSetCreatorLabelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetCreatorLabel200Response>('/v2/set-creator-label', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setCreatorLabel',
      body,
    });
  }

  /**
   * Set the last checked timestamp for the authenticated user.
   */
  setLastCheckedTimestamp({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiSetLastCheckedTimestamp200Response>(
      '/v2/set-last-checked-timestamp',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setLastCheckedTimestamp',
        body: {},
      },
    );
  }

  /**
   * Set the position of a favorite feed
   */
  setFavoriteFeedPosition(
    body: ApiSetFavoriteFeedPositionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiSetFavoriteFeedPosition200Response>(
      '/v2/favorite-feeds',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setFavoriteFeedPosition',
        body,
      },
    );
  }

  /**
   * Set the quality of a domain (admin only). Used to flag any harmful domain, mini-app or otherwise.
   */
  setMiniAppQuality(
    body: ApiSetMiniAppQualityRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetMiniAppQuality200Response>(
      '/v2/set-miniapp-quality',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setMiniAppQuality',
        body,
      },
    );
  }

  /**
   * Set the quality of a user.
   */
  setUserQuality(
    body: ApiSetUserQualityRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetUserQuality200Response>('/v2/set-user-quality', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setUserQuality',
      body,
    });
  }

  /**
   * Set the quality of many users
   */
  setBulkUserQuality(
    body: ApiSetBulkUserQualityRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetBulkUserQuality200Response>(
      '/v2/set-bulk-user-quality',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setBulkUserQuality',
        body,
      },
    );
  }

  /**
   * Set the quality of many users via automated detection
   */
  setBulkAutoUserQuality(
    body: ApiSetBulkAutoUserQualityRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetBulkAutoUserQuality200Response>(
      '/v2/set-bulk-auto-user-quality',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setBulkAutoUserQuality',
        body,
      },
    );
  }

  /**
   * Set the referrer for the authenticated user.
   */
  setUserReferrer(
    body: ApiSetUserReferrerRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetUserReferrer200Response>('/v2/user-referrer', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setUserReferrer',
      body,
    });
  }

  /**
   * Set the value of a dynamic config
   */
  setDynamicConfig(
    body: ApiSetDynamicConfigRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetDynamicConfig200Response>('/v1/dynamic-configs', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setDynamicConfig',
      body,
    });
  }

  /**
   * Set time feed was last seen by providing the timestamp of the latest feed item
   */
  setFeedSeen(
    body: ApiSetFeedSeenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetFeedSeen200Response>('/v2/feed-seen', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'setFeedSeen',
      body,
    });
  }

  /**
   * Sign a JSON payload with the user's JFS key and forward it to a target URL.
   */
  createSignedAction(
    body: ApiCreateSignedActionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateSignedAction200Response>('/v2/signed-actions', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'createSignedAction',
      body,
    });
  }

  /**
   * Simulate a rent storage transaction
   */
  simulateRentStorage(
    params: ApiSimulateRentStorageQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSimulateRentStorage200Response>(
      '/v2/simulate-rent-storage',
      {
        headers,
        timeout,
        endpointName: 'simulateRentStorage',
        params,
      },
    );
  }

  /**
   * Simulate create signed key request.
   */
  simulateCreateSignedKeyRequest(
    body: ApiSimulateCreateSignedKeyRequestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSimulateCreateSignedKeyRequest200Response>(
      '/v2/simulate-create-signed-key-request',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'simulateCreateSignedKeyRequest',
        body,
      },
    );
  }

  /**
   * Simulate registering an FID for the authenticated address
   */
  simulateRegisterFid(
    body: ApiSimulateRegisterFidRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSimulateRegisterFid200Response>(
      '/v2/simulate-register-fid',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'simulateRegisterFid',
        body,
      },
    );
  }

  /**
   * Simulate remove signed key request.
   */
  simulateRemoveSignedKeyRequest(
    body: ApiSimulateRemoveSignedKeyRequestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSimulateRemoveSignedKeyRequest200Response>(
      '/v2/simulate-remove-signed-key-request',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'simulateRemoveSignedKeyRequest',
        body,
      },
    );
  }

  /**
   * Skip phone verification during onboarding.
   */
  setupAdvancedProtection(
    body: ApiSetupAdvancedProtectionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSetupAdvancedProtection200Response>(
      '/v2/setup-advanced-protection',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setupAdvancedProtection',
        body,
      },
    );
  }

  /**
   * Specific search users query for starter packs
   */
  searchUsersForStarterPacks(
    params: ApiSearchUsersForStarterPacksQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiSearchUsersForStarterPacks200Response>(
      '/v2/search-users-for-starter-packs',
      {
        headers,
        timeout,
        endpointName: 'searchUsersForStarterPacks',
        params,
      },
    );
  }

  /**
   * Start a channel streak
   */
  startChannelStreak(
    body: ApiStartChannelStreakRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiStartChannelStreak200Response>('/v2/channel-streaks', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'startChannelStreak',
      body,
    });
  }

  /**
   * Start a phone verification
   */
  startPhoneVerification(
    body: ApiStartPhoneVerificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiStartPhoneVerification200Response>(
      '/v2/start-phone-verification',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'startPhoneVerification',
        body,
      },
    );
  }

  /**
   * Start a scheduled audio room. Host-only — transitions from scheduled to live.
   */
  startScheduledAudioRoom(
    body: ApiStartScheduledAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiStartScheduledAudioRoom200Response>(
      '/v1/audio-room/start-scheduled',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'startScheduledAudioRoom',
        body,
      },
    );
  }

  /**
   * Start in-app purchase flow for authenticated user.
   */
  startInAppPurchase(
    body: ApiStartInAppPurchaseRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiStartInAppPurchase200Response>(
      '/v2/start-in-app-purchase',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'startInAppPurchase',
        body,
      },
    );
  }

  /**
   * Start in-app purchase flow for custody-token auth user.
   */
  startInAppPurchaseWithCustody(
    body: ApiStartInAppPurchaseWithCustodyRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiStartInAppPurchaseWithCustody200Response>(
      '/v2/start-in-app-purchase-with-custody',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'startInAppPurchaseWithCustody',
        body,
      },
    );
  }

  /**
   * Start verification and generate token
   */
  startVerification({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiStartVerification200Response>('/v2/start-verification', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'startVerification',
      body: {},
    });
  }

  /**
   * Stop active channel streaks
   */
  stopActiveChannelStreaks({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.delete<ApiStopActiveChannelStreaks200Response>(
      '/v2/channel-streaks',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'stopActiveChannelStreaks',
        body: {},
      },
    );
  }

  /**
   * Stop showing banner that counts number of followed users
   */
  dismissNewUserFollowsBanner({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.put<ApiDismissNewUserFollowsBanner200Response>(
      '/v1/dismiss-new-user-follows-banners',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'dismissNewUserFollowsBanner',
        body: {},
      },
    );
  }

  /**
   * Store a dismiss event for the tips banner
   */
  dismissTips({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiDismissTips200Response>('/v2/farcaster-tips/dismiss', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'dismissTips',
      body: {},
    });
  }

  /**
   * Store a draft cast
   */
  storeDraftCast(
    body: ApiStoreDraftCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiStoreDraftCast200Response>('/v2/draft-casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'storeDraftCast',
      body,
    });
  }

  /**
   * Store a draft caststorm
   */
  storeDraftCaststorm(
    body: ApiStoreDraftCaststormRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiStoreDraftCaststorm200Response>(
      '/v2/draft-caststorms',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'storeDraftCaststorm',
        body,
      },
    );
  }

  /**
   * Store a miniapp manifest
   */
  devToolsStoreMiniAppManifest(
    body: ApiDevToolsStoreMiniAppManifestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiDevToolsStoreMiniAppManifest200Response>(
      '/v1/dev-tools/store-manifest',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsStoreMiniAppManifest',
        body,
      },
    );
  }

  /**
   * Store a temporary account association
   */
  devToolsStoreTempAccountAssociation(
    body: ApiDevToolsStoreTempAccountAssociationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsStoreTempAccountAssociation200Response>(
      '/v1/dev-tools/temp-account-association',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsStoreTempAccountAssociation',
        body,
      },
    );
  }

  /**
   * Stream snap agent build events (SSE proxy)
   */
  postSnapAgentBuild(
    body: ApiPostSnapAgentBuildRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<void>('/v2/snap/agent/build', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'postSnapAgentBuild',
      body,
    });
  }

  /**
   * Submit a message from signed message data
   */
  submitSignedMessageData(
    body: ApiSubmitSignedMessageDataRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiSubmitSignedMessageData200Response>(
      '/v2/submit-signed-message-data',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'submitSignedMessageData',
        body,
      },
    );
  }

  /**
   * Submit a signed Warpcast app signer for an external FID user. Backend pays gas.
   */
  createExternalUserSigner(
    body: ApiCreateExternalUserSignerRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiCreateExternalUserSigner200Response>(
      '/v2/external-user-create-signer',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createExternalUserSigner',
        body,
      },
    );
  }

  /**
   * Submit a transaction to add auth address.
   */
  putUserAuthAddress(
    body: ApiPutUserAuthAddressRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutUserAuthAddress200Response>('/v2/user-auth-address', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'putUserAuthAddress',
      body,
    });
  }

  /**
   * Submit feedback for a cast
   */
  recordCastFeedback(
    body: ApiRecordCastFeedbackRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRecordCastFeedback200Response>('/v1/cast-feedback', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'recordCastFeedback',
      body,
    });
  }

  /**
   * Submit user selected onboarding interests.
   */
  submitSelectedOnboardingInterests(
    body: ApiSubmitSelectedOnboardingInterestsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSubmitSelectedOnboardingInterests200Response>(
      '/v2/onboarding-interests',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'submitSelectedOnboardingInterests',
        body,
      },
    );
  }

  /**
   * Subscribe to Farcaster Pro with USDC
   */
  farcasterProSubscribeWithUsdc(
    body: ApiFarcasterProSubscribeWithUsdcRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFarcasterProSubscribeWithUsdc200Response>(
      '/v1/farcaster-pro/subscribe-with-usdc',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'farcasterProSubscribeWithUsdc',
        body,
      },
    );
  }

  /**
   * Subscribe to Farcaster Pro with warps
   */
  farcasterProSubscribeWithWarps(
    body: ApiFarcasterProSubscribeWithWarpsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFarcasterProSubscribeWithWarps200Response>(
      '/v1/farcaster-pro/subscribe-with-warps',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'farcasterProSubscribeWithWarps',
        body,
      },
    );
  }

  /**
   * Subscribe to onchain token price notifications
   */
  createTokenSubscription(
    body: ApiCreateTokenSubscriptionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateTokenSubscription200Response>(
      '/v1/onchain/tokens/subscriptions',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createTokenSubscription',
        body,
      },
    );
  }

  /**
   * Subscribe to onchain trader notifications
   */
  createTraderSubscription(
    body: ApiCreateTraderSubscriptionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiCreateTraderSubscription200Response>(
      '/v1/onchain/traders/subscriptions',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'createTraderSubscription',
        body,
      },
    );
  }

  /**
   * Suggestions for target to send to
   */
  walletSendSuggestions(
    params: ApiWalletSendSuggestionsQueryParams = {},
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiWalletSendSuggestions200Response>(
      '/v2/wallet/send-suggestions',
      {
        headers,
        timeout,
        endpointName: 'walletSendSuggestions',
        params,
      },
    );
  }

  /**
   * Tip a cast
   */
  tipCast(
    body: ApiTipCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiTipCast200Response>('/v2/cast-tips', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'tipCast',
      body,
    });
  }

  /**
   * Toggle RSVP for a scheduled audio room.
   */
  rsvpAudioRoom(
    body: ApiRsvpAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRsvpAudioRoom200Response>('/v1/audio-room/rsvp', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'rsvpAudioRoom',
      body,
    });
  }

  /**
   * Toggle hand-raise state for the authenticated participant.
   */
  raiseHandAudioRoom(
    body: ApiRaiseHandAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRaiseHandAudioRoom200Response>(
      '/v1/audio-room/raise-hand',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'raiseHandAudioRoom',
        body,
      },
    );
  }

  /**
   * Track article seen
   */
  recordArticleSeen(
    body: ApiRecordArticleSeenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRecordArticleSeen200Response>(
      '/v2/track-article-seen',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'recordArticleSeen',
        body,
      },
    );
  }

  /**
   * Track explore feed seen
   */
  recordExploreFeedSeen({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiRecordExploreFeedSeen200Response>(
      '/v2/track-explore-feed-seen',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'recordExploreFeedSeen',
        body: {},
      },
    );
  }

  /**
   * Track mini app activity event
   */
  putMiniAppEvent(
    body: ApiPutMiniAppEventRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutMiniAppEvent200Response>('/v2/mini-app-event', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'putMiniAppEvent',
      body,
    });
  }

  /**
   * Trigger admin actions
   */
  adminAction(
    body: ApiAdminActionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAdminAction200Response>('/v1/admin-action', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'adminAction',
      body,
    });
  }

  /**
   * Trigger updates to multiple channel threads
   */
  adminUpdateChannelThreads(
    body: ApiAdminUpdateChannelThreadsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAdminUpdateChannelThreads200Response>(
      '/v1/admin-update-channel-threads',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminUpdateChannelThreads',
        body,
      },
    );
  }

  /**
   * Trigger updates to multiple channel threads
   */
  adminUpdateChannelsAllThreads(
    body: ApiAdminUpdateChannelsAllThreadsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiAdminUpdateChannelsAllThreads200Response>(
      '/v1/admin-update-channels-all-threads',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'adminUpdateChannelsAllThreads',
        body,
      },
    );
  }

  /**
   * Twitter import matches
   */
  getTwitterFollowing(
    params: ApiGetTwitterFollowingQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<ApiGetTwitterFollowing200Response>(
      '/v2/get-twitter-following',
      {
        headers,
        timeout,
        endpointName: 'getTwitterFollowing',
        params,
      },
    );
  }

  /**
   * Unblock a previously blocked token
   */
  unblockToken(
    body: ApiUnblockTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiUnblockToken200Response>('/v2/unblock-token', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'unblockToken',
      body,
    });
  }

  /**
   * Unblock a user
   */
  fcUnblockUser(
    body: ApiFcUnblockUserRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiFcUnblockUser200Response>('/fc/blocked-users', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcUnblockUser',
      body,
    });
  }

  /**
   * Unfavorite a frame
   */
  removeFavoriteFrame(
    body: ApiRemoveFavoriteFrameRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiRemoveFavoriteFrame200Response>(
      '/v1/favorite-frames',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'removeFavoriteFrame',
        body,
      },
    );
  }

  /**
   * Unfollow a channel
   */
  fcUnfollowChannel(
    body: ApiFcUnfollowChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiFcUnfollowChannel200Response>('/fc/channel-follows', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcUnfollowChannel',
      body,
    });
  }

  /**
   * Unfollow a feed.
   */
  deleteFeedFollow(
    body: ApiDeleteFeedFollowRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteFeedFollow200Response>('/v2/feed-follows', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteFeedFollow',
      body,
    });
  }

  /**
   * Unfollow a user.
   */
  deleteFollow(
    body: ApiDeleteFollowRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteFollow200Response>('/v2/follows', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'deleteFollow',
      body,
    });
  }

  /**
   * Unfollow all least interacted with following users.
   */
  unfollowLeastInteractedWithFollowing({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.delete<ApiUnfollowLeastInteractedWithFollowing200Response>(
      '/v2/unfollow-least-interacted-with-following',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'unfollowLeastInteractedWithFollowing',
        body: {},
      },
    );
  }

  /**
   * Unhide a token from the wallet positions.
   */
  unhideToken(
    body: ApiUnhideTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUnhideToken200Response>('/v2/unhide-token', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'unhideToken',
      body,
    });
  }

  /**
   * Unpin a cast
   */
  fcUnpinCast(
    body: ApiFcUnpinCastRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiFcUnpinCast200Response>('/fc/pinned-casts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcUnpinCast',
      body,
    });
  }

  /**
   * Unpin a direct cast conversation.
   */
  unpinDirectCastConversation(
    body: ApiUnpinDirectCastConversationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiUnpinDirectCastConversation200Response>(
      '/v2/direct-cast-pin-conversation',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'unpinDirectCastConversation',
        body,
      },
    );
  }

  /**
   * Unpin cast on user profile.
   */
  unpinCastOnUserProfile(
    body: ApiUnpinCastOnUserProfileRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiUnpinCastOnUserProfile200Response>(
      '/v2/user-profile-pinned-casts',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'unpinCastOnUserProfile',
        body,
      },
    );
  }

  /**
   * Unregister an app domain
   */
  devToolsUnregisterDomain(
    body: ApiDevToolsUnregisterDomainRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsUnregisterDomain200Response>(
      '/v1/dev-tools/unregister-domain',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsUnregisterDomain',
        body,
      },
    );
  }

  /**
   * Unsubscribe from onchain token price notifications
   */
  deleteTokenSubscription(
    body: ApiDeleteTokenSubscriptionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteTokenSubscription200Response>(
      '/v1/onchain/tokens/subscriptions',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteTokenSubscription',
        body,
      },
    );
  }

  /**
   * Unsubscribe from onchain trader notifications
   */
  deleteTraderSubscription(
    body: ApiDeleteTraderSubscriptionRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiDeleteTraderSubscription200Response>(
      '/v1/onchain/traders/subscriptions',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'deleteTraderSubscription',
        body,
      },
    );
  }

  /**
   * Unsubscribes email address per FID. Duplicate of GET above, but for Gmail one-click unsubscribe.
   */
  unsubscribeFidOneClick(
    params: ApiUnsubscribeFidOneClickQueryParams,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<void>('/unsubscribe-v2', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'unsubscribeFidOneClick',
      params,
    });
  }

  /**
   * Unsubscribes email address per FID. Intended to be loaded via browser.
   */
  unsubscribeFid(
    params: ApiUnsubscribeFidQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/unsubscribe-v2', {
      headers,
      timeout,
      endpointName: 'unsubscribeFid',
      params,
    });
  }

  /**
   * Unsubscribes email address. Duplicate of GET above, but for Gmail one-click unsubscribe.
   */
  unsubscribeEmailOneClick(
    params: ApiUnsubscribeEmailOneClickQueryParams,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<void>('/unsubscribe', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'unsubscribeEmailOneClick',
      params,
    });
  }

  /**
   * Unsubscribes email address. Intended to be loaded via browser.
   */
  unsubscribeEmail(
    params: ApiUnsubscribeEmailQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/unsubscribe', {
      headers,
      timeout,
      endpointName: 'unsubscribeEmail',
      params,
    });
  }

  /**
   * Unwatch a cast collectible
   */
  unwatchCastCollectible(
    body: ApiUnwatchCastCollectibleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.delete<ApiUnwatchCastCollectible200Response>(
      '/v2/watch-cast-collectible',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'unwatchCastCollectible',
        body,
      },
    );
  }

  /**
   * Unwatch an unavailable cast collectible
   */
  watchCastCollectible(
    body: ApiWatchCastCollectibleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiWatchCastCollectible200Response>(
      '/v2/watch-cast-collectible',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'watchCastCollectible',
        body,
      },
    );
  }

  /**
   * Update (pause/unpause) job queue or queue shard
   */
  updateJobQueue(
    body: ApiUpdateJobQueueRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiUpdateJobQueue200Response>('/v1/job-queue', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateJobQueue',
      body,
    });
  }

  /**
   * Update a channel
   */
  updateChannel(
    body: ApiUpdateChannelRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdateChannel200Response>('/v2/channels-owned', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateChannel',
      body,
    });
  }

  /**
   * Update a curated wallet link (admin only). A new `url` re-crawls and overwrites the old row's cached enrichment (title / description / imageUrl) with the new site's values, since the old values no longer describe the row. `refetchOg: true` (without a URL change) busts the OpenGraph service's Redis cache for that URL and re-crawls, filling any currently-null enrichment fields but leaving values the admin already curated on this row untouched. A non-blank admin-provided `name` / `description` / `imageUrl` on this request always wins over the crawler; a blank (empty or whitespace-only) value is treated as unset, so the crawler fills it rather than the row being overwritten with an empty string. `refetchOg` is not persisted — pass it again on each request that should force a re-crawl.
   */
  updateWalletLink(
    body: ApiUpdateWalletLinkRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiUpdateWalletLink200Response>('/v2/wallet-links', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateWalletLink',
      body,
    });
  }

  /**
   * Update a direct cast conversation.
   */
  fcPostConversation(
    body: ApiFcPostConversationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcPostConversation200Response>('/fc/conversation', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPostConversation',
      body,
    });
  }

  /**
   * Update a direct cast group member's role.
   */
  fcPostGroupMembers(
    body: ApiFcPostGroupMembersRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcPostGroupMembers200Response>('/fc/group-members', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPostGroupMembers',
      body,
    });
  }

  /**
   * Update a direct cast group.
   */
  fcPostGroup(
    body: ApiFcPostGroupRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiFcPostGroup200Response>('/fc/group', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'fcPostGroup',
      body,
    });
  }

  /**
   * Update a favorite frame
   */
  updateFavoriteFrame(
    body: ApiUpdateFavoriteFrameRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdateFavoriteFrame200Response>(
      '/v1/favorite-frames',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updateFavoriteFrame',
        body,
      },
    );
  }

  /**
   * Update a featured app
   */
  updateFeaturedApp(
    body: ApiUpdateFeaturedAppRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUpdateFeaturedApp200Response>(
      '/v1/featured-app-admin/update',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updateFeaturedApp',
        body,
      },
    );
  }

  /**
   * Update a miniapp manifest
   */
  devToolsUpdateMiniAppManifest(
    body: ApiDevToolsUpdateMiniAppManifestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiDevToolsUpdateMiniAppManifest200Response>(
      '/v1/dev-tools/update-manifest',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'devToolsUpdateMiniAppManifest',
        body,
      },
    );
  }

  /**
   * Update a news article (internal)
   */
  retoolUpdateArticle(
    body: ApiRetoolUpdateArticleRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiRetoolUpdateArticle200Response>('/v2/retool-news', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'retoolUpdateArticle',
      body,
    });
  }

  /**
   * Update a paid invite
   */
  updatePaidInvite(
    body: ApiUpdatePaidInviteRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdatePaidInvite200Response>('/v2/invite', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updatePaidInvite',
      body,
    });
  }

  /**
   * Update a remote SIWF request
   */
  updateRemoteSiwfRequest(
    body: ApiUpdateRemoteSiwfRequestRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiUpdateRemoteSiwfRequest200Response>('/v1/remote-siwf', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateRemoteSiwfRequest',
      body,
    });
  }

  /**
   * Update a trending topic
   */
  updateTrendingTopic(
    body: ApiUpdateTrendingTopicRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUpdateTrendingTopic200Response>(
      '/v1/admin-trending-topics',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updateTrendingTopic',
        body,
      },
    );
  }

  /**
   * Update embedded wallet metadata
   */
  updateEmbeddedWallet(
    body: ApiUpdateEmbeddedWalletRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdateEmbeddedWallet200Response>(
      '/v2/wallet/embedded-wallet',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updateEmbeddedWallet',
        body,
      },
    );
  }

  /**
   * Update preferences for direct cast group.
   */
  updateDirectCastGroupPreferences(
    body: ApiUpdateDirectCastGroupPreferencesRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiUpdateDirectCastGroupPreferences200Response>(
      '/v2/direct-cast-group-preferences',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updateDirectCastGroupPreferences',
        body,
      },
    );
  }

  /**
   * Update starter pack
   */
  updateStarterPack(
    body: ApiUpdateStarterPackRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdateStarterPack200Response>('/v2/starter-pack', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateStarterPack',
      body,
    });
  }

  /**
   * Update summary for a token
   */
  updateTokenSummary(
    body: ApiUpdateTokenSummaryRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUpdateTokenSummary200Response>('/v1/token-summary', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateTokenSummary',
      body,
    });
  }

  /**
   * Update the authenticated user's recovery address
   */
  updateRecoveryAddress(
    body: ApiUpdateRecoveryAddressRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiUpdateRecoveryAddress200Response>(
      '/v2/recovery-address',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updateRecoveryAddress',
        body,
      },
    );
  }

  /**
   * Update the event status as an admin
   */
  updateFarcasterTipsStatus(
    body: ApiUpdateFarcasterTipsStatusRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUpdateFarcasterTipsStatus200Response>(
      '/v2/farcaster-tips/tip-status',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'updateFarcasterTipsStatus',
        body,
      },
    );
  }

  /**
   * Update the primary address for a Farcaster user.
   */
  putPrimaryVerification(
    body: ApiPutPrimaryVerificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutPrimaryVerification200Response>(
      '/v2/verifications/primary',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'putPrimaryVerification',
        body,
      },
    );
  }

  /**
   * Update title / description / scheduledAt on a Space. Host-only. Scheduled Spaces allow all fields; live Spaces allow title and description.
   */
  updateAudioRoom(
    body: ApiUpdateAudioRoomRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUpdateAudioRoom200Response>('/v1/audio-room/update', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateAudioRoom',
      body,
    });
  }

  /**
   * Update user's device contact book state
   */
  setContactsDeviceState(
    body: ApiSetContactsDeviceStateRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiSetContactsDeviceState200Response>(
      '/v2/update-contacts-device-state',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setContactsDeviceState',
        body,
      },
    );
  }

  /**
   * Updates
   */
  setUserPreferences(
    body: ApiSetUserPreferencesRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiSetUserPreferences200Response>(
      '/v2/user-preferences',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'setUserPreferences',
        body,
      },
    );
  }

  /**
   * Updates attributes for the currently authenticated user.
   */
  updateUser(
    body: ApiUpdateUserRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdateUser200Response>('/v2/me', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateUser',
      body,
    });
  }

  /**
   * Updates the location attribute for the currently authenticated user.
   */
  updateUserLocation(
    body: ApiUpdateUserLocationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.patch<ApiUpdateUserLocation200Response>('/v2/my-location', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'updateUserLocation',
      body,
    });
  }

  /**
   * Upgrades the auth token
   */
  postStepUpMessage(
    body: ApiPostStepUpMessageRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostStepUpMessage200Response>('/v2/auth/step-up', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'postStepUpMessage',
      body,
    });
  }

  /**
   * Upload an image asset for a snap build
   */
  postSnapAgentBuildAsset(
    params: { buildId: string },
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiPostSnapAgentBuildAsset200Response>(
      `/v2/snap/agent/builds/${encodeURIComponent(params.buildId)}/assets`,
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'postSnapAgentBuildAsset',
        body: {},
      },
    );
  }

  /**
   * Upload following set from Twitter import
   */
  uploadTwitterFollowing(
    body: ApiUploadTwitterFollowingRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUploadTwitterFollowing200Response>(
      '/v2/twitter-following',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'uploadTwitterFollowing',
        body,
      },
    );
  }

  /**
   * Upload user's contact book
   */
  uploadContacts(
    body: ApiUploadContactsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiUploadContacts200Response>('/v2/contacts', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'uploadContacts',
      body,
    });
  }

  /**
   * Uploads text to be scraped to generate a preview.
   */
  processCastAttachments(
    body: ApiProcessCastAttachmentsRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiProcessCastAttachments200Response>(
      '/v2/cast-attachments',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'processCastAttachments',
        body,
      },
    );
  }

  /**
   * Verifies email address with a client-provided code
   */
  verifyEmailWithCode(
    body: ApiVerifyEmailWithCodeRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiVerifyEmailWithCode200Response>(
      '/v2/onboarding-verify-email',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'verifyEmailWithCode',
        body,
      },
    );
  }

  /**
   * Verifies email address. Intended to be loaded via browser.
   */
  verifyEmail(
    params: ApiVerifyEmailQueryParams,
    { headers, timeout }: { headers?: RequestHeaders; timeout?: number } = {},
  ) {
    return this.authedGet<void>('/v2/emails/verify', {
      headers,
      timeout,
      endpointName: 'verifyEmail',
      params,
    });
  }

  /**
   * Verify a TOTP code for a user
   */
  verifyTotpCode(
    body: ApiVerifyTotpCodeRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiVerifyTotpCode200Response>('/v2/totp/verify', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'verifyTotpCode',
      body,
    });
  }

  /**
   * Verify a TOTP code for a user
   */
  verifyTotpCodeForEmail(
    body: ApiVerifyTotpCodeForEmailRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiVerifyTotpCodeForEmail200Response>(
      '/v2/totp/verify-for-email',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'verifyTotpCodeForEmail',
        body,
      },
    );
  }

  /**
   * Verify a token by marking it as verified by Farcaster
   */
  verifyToken(
    body: ApiVerifyTokenRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiVerifyToken200Response>('/v2/verify-token', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'verifyToken',
      body,
    });
  }

  /**
   * Verify an address for a Farcaster user.
   */
  putVerification(
    body: ApiPutVerificationRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.put<ApiPutVerification200Response>('/v2/verifications', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'putVerification',
      body,
    });
  }

  /**
   * Vote on a poll
   */
  recordPollVote(
    body: ApiRecordPollVoteRequestBody,
    {
      headers,
      timeout,
      retryLimit,
    }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {},
  ) {
    return this.post<ApiRecordPollVote200Response>('/v2/record-poll-vote', {
      headers,
      timeout,
      retryLimit,
      endpointName: 'recordPollVote',
      body,
    });
  }

  /**
   * Webhook for creator rewards frame
   */
  creatorRewardsFrameWebhook({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiCreatorRewardsFrameWebhook200Response>(
      '/v1/creator-rewards-frame-webhook',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'creatorRewardsFrameWebhook',
        body: {},
      },
    );
  }

  /**
   * Webhook for donations mini app
   */
  giveMiniAppWebhook({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiGiveMiniAppWebhook200Response>(
      '/v1/give-mini-app-webhook',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'giveMiniAppWebhook',
        body: {},
      },
    );
  }

  /**
   * Webhook for featured mint frame
   */
  featuredMintFrameWebhook({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiFeaturedMintFrameWebhook200Response>(
      '/v1/featured-mint-frame-webhook',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'featuredMintFrameWebhook',
        body: {},
      },
    );
  }

  /**
   * Webhook receiver for LiveKit Cloud events (participant_left, room_finished, etc.). Signature verified via Authorization/Authorize JWT signed with LIVEKIT_API_SECRET.
   */
  livekitWebhook({
    headers,
    timeout,
    retryLimit,
  }: { headers?: RequestHeaders; timeout?: number; retryLimit?: number } = {}) {
    return this.post<ApiLivekitWebhook200Response>(
      '/v1/audio-rooms/livekit-webhook',
      {
        headers,
        timeout,
        retryLimit,
        endpointName: 'livekitWebhook',
        body: {},
      },
    );
  }

  /**
   * X auth callbacks
   */
  authenticateX({
    headers,
    timeout,
  }: { headers?: RequestHeaders; timeout?: number } = {}) {
    return this.authedGet<void>('/auth/x', {
      headers,
      timeout,
      endpointName: 'authenticateX',
    });
  }
}
