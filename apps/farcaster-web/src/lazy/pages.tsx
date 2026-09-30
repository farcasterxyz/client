import { lazyWithPreload } from './helpers';

export const AdminLabeledCastsPage = lazyWithPreload(() =>
  import('~/pages/adminLabeledCasts/AdminLabeledCastsPage').then((res) => ({
    default: res.AdminLabeledCastsPage,
  })),
);

export const AdminEngagementRingCandidatesPage = lazyWithPreload(() =>
  import('~/pages/adminEngagementRingCandidates/AdminEngagementRingCandidatesPage').then(
    (res) => ({
      default: res.AdminEngagementRingCandidatesPage,
    }),
  ),
);

export const AdminFeedsComparisonPage = lazyWithPreload(() =>
  import('~/pages/adminFeedsComparison/AdminFeedsComparisonPage').then(
    (res) => ({
      default: res.AdminFeedsComparisonPage,
    }),
  ),
);

export const AdminReviewsPage = lazyWithPreload(() =>
  import('~/pages/adminReviews/AdminReviewsPage').then((res) => ({
    default: res.AdminReviewsPage,
  })),
);

export const ApiKeysPage = lazyWithPreload(() =>
  import('~/pages/developers/ApiKeysPage').then((res) => ({
    default: res.ApiKeysPage,
  })),
);

export const HostedManifestsPage = lazyWithPreload(() =>
  import('~/pages/developers/HostedManifestsPage').then((res) => ({
    default: res.HostedManifestsPage,
  })),
);

export const ChannelPage = lazyWithPreload(() =>
  import('~/pages/channel/ChannelPage').then((res) => ({
    default: res.ChannelPage,
  })),
);

export const ChannelFeedPage = lazyWithPreload(() =>
  import('~/pages/channel/ChannelFeedPage').then((res) => ({
    default: res.ChannelFeedPage,
  })),
);

export const ChannelFollowersPage = lazyWithPreload(() =>
  import('~/pages/channelFollowers/ChannelFollowersPage').then((res) => ({
    default: res.ChannelFollowersPage,
  })),
);

export const ChannelMembersPage = lazyWithPreload(() =>
  import('~/pages/channelMembers/ChannelMembersPage').then((res) => ({
    default: res.ChannelMembersPage,
  })),
);

export const ChannelFollowersYouKnowPage = lazyWithPreload(() =>
  import('~/pages/channelFollowers/ChannelFollowersYouKnowPage').then(
    (res) => ({ default: res.ChannelFollowersYouKnowPage }),
  ),
);

export const ConversationReactionsWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversationReactionsWithUsername/ConversationReactionsWithUsernamePage').then(
    (res) => ({ default: res.ConversationReactionsWithUsernamePage }),
  ),
);

export const ConversationReactionsWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversationReactionsWithoutUsername/ConversationReactionsWithoutUsernamePage').then(
    (res) => ({ default: res.ConversationReactionsWithoutUsernamePage }),
  ),
);

export const ConversationRecastsWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversationRecastsWithUsername/ConversationRecastsWithUsernamePage').then(
    (res) => ({ default: res.ConversationRecastsWithUsernamePage }),
  ),
);

export const ConversationRecastsWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversationRecastsWithoutUsername/ConversationRecastsWithoutUsernamePage').then(
    (res) => ({ default: res.ConversationRecastsWithoutUsernamePage }),
  ),
);

export const ConversationQuotesWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversationQuotesWithUsername/ConversationQuotesWithUsernamePage').then(
    (res) => ({ default: res.ConversationQuotesWithUsernamePage }),
  ),
);

export const ConversationQuotesWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversationQuotesWithoutUsername/ConversationQuotesWithoutUsernamePage').then(
    (res) => ({ default: res.ConversationQuotesWithoutUsernamePage }),
  ),
);

export const ConversationWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversation/ConversationWithUsernamePage').then((res) => ({
    default: res.ConversationWithUsernamePage,
  })),
);

export const ConversationWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/conversation/ConversationWithoutUsernamePage').then(
    (res) => ({ default: res.ConversationWithoutUsernamePage }),
  ),
);

export const DebugAdminTokenPage = lazyWithPreload(() =>
  import('~/pages/debug/DebugAdminTokenPage').then((res) => ({
    default: res.DebugAdminTokenPage,
  })),
);

export const DebugCastsPage = lazyWithPreload(() =>
  import('~/pages/debug/DebugCastsPage').then((res) => ({
    default: res.DebugCastsPage,
  })),
);

export const DebugEmbeddedWalletPage = lazyWithPreload(() =>
  import('~/pages/debug/DebugEmbeddedWalletPage').then((res) => ({
    default: res.DebugEmbeddedWalletPage,
  })),
);

export const DebugMenuPage = lazyWithPreload(() =>
  import('~/pages/debug/DebugMenuPage').then((res) => ({
    default: res.DebugMenuPage,
  })),
);

// DevelopersEmbedsPage removed

export const DirectCastsInvitePage = lazyWithPreload(() =>
  import('~/pages/directCastsInvite/DirectCastsInvitePage').then((res) => ({
    default: res.DirectCastsInvitePage,
  })),
);

export const DirectCastsConversationPage = lazyWithPreload(() =>
  import('~/pages/directCastsConversation/DirectCastsConversationPage').then(
    (res) => ({ default: res.DirectCastsConversationPage }),
  ),
);

export const DirectCastsInboxPage = lazyWithPreload(() =>
  import('~/pages/directCastsInbox/DirectCastsInboxPage').then((res) => ({
    default: res.DirectCastsInboxPage,
  })),
);

export const DirectCastsInboxCreatePage = lazyWithPreload(() =>
  import('~/pages/directCastsInboxCreate/DirectCastsInboxCreatePage').then(
    (res) => ({
      default: res.DirectCastsInboxCreatePage,
    }),
  ),
);

export const AppsPage = lazyWithPreload(() =>
  import('~/pages/apps/AppsPage').then((res) => ({
    default: res.AppsPage,
  })),
);

export const DownloadPage = lazyWithPreload(() =>
  import('~/pages/download/DownloadPage').then((res) => ({
    default: res.DownloadPage,
  })),
);

export const MintPage = lazyWithPreload(() =>
  import('~/pages/mint/MintPage').then((res) => ({
    default: res.MintPage,
  })),
);

export const ChannelsPage = lazyWithPreload(() =>
  import('~/pages/explore/ChannelsPage').then((res) => ({
    default: res.ChannelsPage,
  })),
);

export const ManageChannelsForCategoryPage = lazyWithPreload(() =>
  import('~/pages/explore/ManageChannelsForCategoryPage').then((res) => ({
    default: res.ManageChannelsForCategoryPage,
  })),
);

export const ChannelJoinViaCodePage = lazyWithPreload(() =>
  import('~/pages/channelJoinViaCode/ChannelJoinViaCodePage').then((res) => ({
    default: res.ChannelJoinViaCodePage,
  })),
);

export const FollowersWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/followersWithUsername/FollowersWithUsernamePage').then(
    (res) => ({ default: res.FollowersWithUsernamePage }),
  ),
);

export const FollowersWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/followersWithoutUsername/FollowersWithoutUsernamePage').then(
    (res) => ({ default: res.FollowersWithoutUsernamePage }),
  ),
);

export const FollowersYouKnowWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/followersYouKnowWithUsername/FollowersYouKnowWithUsernamePage').then(
    (res) => ({ default: res.FollowersYouKnowWithUsernamePage }),
  ),
);

export const FollowersYouKnowWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/followersYouKnowWithoutUsername/FollowersYouKnowWithoutUsernamePage').then(
    (res) => ({ default: res.FollowersYouKnowWithoutUsernamePage }),
  ),
);

export const FollowingWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/followingWithUsername/FollowingWithUsernamePage').then(
    (res) => ({ default: res.FollowingWithUsernamePage }),
  ),
);

export const FollowingWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/followingWithoutUsername/FollowingWithoutUsernamePage').then(
    (res) => ({ default: res.FollowingWithoutUsernamePage }),
  ),
);

export const ComposePage = lazyWithPreload(() =>
  import('~/pages/homeFeed/ComposePage').then((res) => ({
    default: res.ComposePage,
  })),
);

export const HomeLandingPage = lazyWithPreload(() =>
  import('~/pages/homeLanding/HomeLandingPage').then((res) => ({
    default: res.HomeLandingPage,
  })),
);

export const HomeFeedPage = lazyWithPreload(() =>
  import('~/pages/homeFeed/HomeFeedPage').then((res) => ({
    default: res.HomeFeedPage,
  })),
);

export const LiveAudioRoomPage = lazyWithPreload(() =>
  import('~/pages/audioRoom/LiveAudioRoomPage').then((res) => ({
    default: res.LiveAudioRoomPage,
  })),
);

export const SpacesPage = lazyWithPreload(() =>
  import('~/pages/spaces/SpacesPage').then((res) => ({
    default: res.SpacesPage,
  })),
);

export const SpaceRoomPage = lazyWithPreload(() =>
  import('~/pages/spaces/SpaceRoomPage').then((res) => ({
    default: res.SpaceRoomPage,
  })),
);

export const HomeFeedPageContent = lazyWithPreload(() =>
  import('~/pages/homeFeed/HomeFeedPageContent').then((res) => ({
    default: res.HomeFeedPageContent,
  })),
);

export const BookmarksPage = lazyWithPreload(() =>
  import('~/pages/bookmarks/BookmarksPage').then((res) => ({
    default: res.BookmarksPage,
  })),
);

export const SavedPage = lazyWithPreload(() =>
  import('~/pages/saved/SavedPage').then((res) => ({
    default: res.SavedPage,
  })),
);

export const MiniAppsPage = lazyWithPreload(() =>
  import('~/pages/miniApps/MiniAppsPage').then((res) => ({
    default: res.MiniAppsPage,
  })),
);

export const MiniAppsEditorsChoicePage = lazyWithPreload(() =>
  import('~/pages/miniApps/MiniAppsPage').then((res) => ({
    default: res.EditorsChoicePage,
  })),
);

export const StarterPacksPage = lazyWithPreload(() =>
  import('~/pages/starterPacks/StarterPacksPage').then((res) => ({
    default: res.StarterPacksPage,
  })),
);

export const SuggestedStarterPacksPage = lazyWithPreload(() =>
  import('~/pages/suggestedStarterPacks/SuggestedStarterPacksPage').then(
    (res) => ({
      default: res.SuggestedStarterPacksPage,
    }),
  ),
);

export const ProUpsellPage = lazyWithPreload(() =>
  import('~/pages/proUpsell/ProUpsellPage').then((res) => ({
    default: res.ProUpsellPage,
  })),
);

export const SignupForInvitePage = lazyWithPreload(() =>
  import('~/pages/signup/SignupForInvitePage').then((res) => ({
    default: res.SignupForInvitePage,
  })),
);

export const CloudflareChallengePage = lazyWithPreload(() =>
  import('~/pages/signup/CloudflareChallengePage').then((res) => ({
    default: res.CloudflareChallengePage,
  })),
);

export const ReferralsPage = lazyWithPreload(() =>
  import('~/pages/referral/ReferralsV2Page').then((res) => ({
    default: res.ReferralsV2Page,
  })),
);

export const VanityReferralLandingPage = lazyWithPreload(() =>
  import('~/pages/referral/VanityReferralLandingPage').then((res) => ({
    default: res.VanityReferralLandingPage,
  })),
);

export const ReferralsJoinPage = lazyWithPreload(() =>
  import('~/pages/referral/ReferralsJoinPage').then((res) => ({
    default: res.ReferralsJoinPage,
  })),
);

export const VanityReferralJoinPage = lazyWithPreload(() =>
  import('~/pages/referral/VanityReferralJoinPage').then((res) => ({
    default: res.VanityReferralJoinPage,
  })),
);

export const LocationUsersPage = lazyWithPreload(() =>
  import('~/pages/locationUsers/LocationUsersPage').then((res) => ({
    default: res.LocationUsersPage,
  })),
);

export const NotificationGroupUsersPage = lazyWithPreload(() =>
  import('~/pages/notificationGroupUsers/NotificationGroupUsersPage').then(
    (res) => ({ default: res.NotificationGroupUsersPage }),
  ),
);

export const NotificationGroupCastsPage = lazyWithPreload(() =>
  import('~/pages/notificationGroupCasts/NotificationGroupCastsPage').then(
    (res) => ({ default: res.NotificationGroupCastsPage }),
  ),
);

export const SettingsDeveloperToolsPage = lazyWithPreload(() =>
  import('~/pages/settingsDeveloperTools/SettingsDeveloperToolsPage').then(
    (res) => ({
      default: res.SettingsDeveloperToolsPage,
    }),
  ),
);

export const NotificationGroupChannelRoleInvitesPage = lazyWithPreload(() =>
  import('~/pages/notificationGroupChannelRoleInvites/NotificationGroupChannelRoleInvitesPage').then(
    (res) => ({ default: res.NotificationGroupChannelRoleInvitesPage }),
  ),
);

export const NotificationGroupMiniAppsPage = lazyWithPreload(() =>
  import('~/pages/notificationGroupMiniApps/NotificationGroupMiniAppsPage').then(
    (res) => ({ default: res.NotificationGroupMiniAppsPage }),
  ),
);

export const NotificationsPage = lazyWithPreload(() =>
  import('~/pages/notifications/NotificationsPage').then((res) => ({
    default: res.NotificationsPage,
  })),
);

export const ProfileAssetsWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileAssetsWithUsername/ProfileAssetsWithUsernamePage').then(
    (res) => ({ default: res.ProfileAssetsWithUsernamePage }),
  ),
);

export const ProfileAssetsWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileAssetsWithoutUsername/ProfileAssetsWithoutUsernamePage').then(
    (res) => ({ default: res.ProfileAssetsWithoutUsernamePage }),
  ),
);

export const ProfileCastsAndRepliesWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileCastsAndRepliesWithUsername/ProfileCastsAndRepliesWithUsernamePage').then(
    (res) => ({ default: res.ProfileCastsAndRepliesWithUsernamePage }),
  ),
);

export const ProfileCastsAndRepliesWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileCastsAndRepliesWithoutUsername/ProfileCastsAndRepliesWithoutUsernamePage').then(
    (res) => ({ default: res.ProfileCastsAndRepliesWithoutUsernamePage }),
  ),
);

export const ProfileCastsWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileCastsWithUsername/ProfileCastsWithUsernamePage').then(
    (res) => ({ default: res.ProfileCastsWithUsernamePage }),
  ),
);

export const ProfileCastsWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileCastsWithoutUsername/ProfileCastsWithoutUsernamePage').then(
    (res) => ({ default: res.ProfileCastsWithoutUsernamePage }),
  ),
);

export const ProfileSnapCastsWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileSnapCastsWithUsername/ProfileSnapCastsWithUsernamePage').then(
    (res) => ({ default: res.ProfileSnapCastsWithUsernamePage }),
  ),
);

export const ProfileSnapCastsWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileSnapCastsWithoutUsername/ProfileSnapCastsWithoutUsernamePage').then(
    (res) => ({ default: res.ProfileSnapCastsWithoutUsernamePage }),
  ),
);

export const ProfileLikesWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileLikesWithUsername/ProfileLikesWithUsernamePage').then(
    (res) => ({ default: res.ProfileLikesWithUsernamePage }),
  ),
);

export const ProfileLikesWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileLikesWithoutUsername/ProfileLikesWithoutUsernamePage').then(
    (res) => ({ default: res.ProfileLikesWithoutUsernamePage }),
  ),
);

export const ProfileStarterPacksWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileStarterPacksWithUsername/ProfileStarterPacksWithUsernamePage').then(
    (res) => ({ default: res.ProfileStarterPacksWithUsernamePage }),
  ),
);

export const ProfileStarterPacksWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/profileStarterPacksWithoutUsername/ProfileStarterPacksWithoutUsernamePage').then(
    (res) => ({ default: res.ProfileStarterPacksWithoutUsernamePage }),
  ),
);

export const MagicLinkPage = lazyWithPreload(() =>
  import('~/pages/magicLink/MagicLinkPage').then((res) => ({
    default: res.MagicLinkPage,
  })),
);

export const RecoveryPage = lazyWithPreload(() =>
  import('~/pages/recovery/RecoveryPage').then((res) => ({
    default: res.RecoveryPage,
  })),
);

export const RecoveryStartPage = lazyWithPreload(() =>
  import('~/pages/recoveryStart/RecoveryStartPage').then((res) => ({
    default: res.RecoveryStartPage,
  })),
);

export const RecoveryInitiatePage = lazyWithPreload(() =>
  import('~/pages/recoveryInitiate/RecoveryInitiatePage').then((res) => ({
    default: res.RecoveryInitiatePage,
  })),
);

export const TopSearchPage = lazyWithPreload(() =>
  import('~/pages/search/TopSearchPage').then((res) => ({
    default: res.TopSearchPage,
  })),
);

export const RecentSearchPage = lazyWithPreload(() =>
  import('~/pages/search/RecentSearchPage').then((res) => ({
    default: res.RecentSearchPage,
  })),
);

export const ChannelsSearchPage = lazyWithPreload(() =>
  import('~/pages/search/ChannelsSearchPage').then((res) => ({
    default: res.ChannelsSearchPage,
  })),
);

export const UsersSearchPage = lazyWithPreload(() =>
  import('~/pages/search/UsersSearchPage').then((res) => ({
    default: res.UsersSearchPage,
  })),
);

export const MiniAppsSearchPage = lazyWithPreload(() =>
  import('~/pages/search/MiniAppsSearchPage').then((res) => ({
    default: res.MiniAppsSearchPage,
  })),
);

// FrameValidatorPage removed

export const SignInWithFarcasterPage = lazyWithPreload(() =>
  import('~/pages/signInWithFarcaster/SignInWithFarcasterPage').then((res) => ({
    default: res.SignInWithFarcasterPage,
  })),
);

export const SettingsAdvancedPage = lazyWithPreload(() =>
  import('~/pages/settingsAdvanced/SettingsAdvancedPage').then((res) => ({
    default: res.SettingsAdvancedPage,
  })),
);

export const SettingsVerificationsPage = lazyWithPreload(() =>
  import('~/pages/settingsVerifications/SettingsVerificationsPage').then(
    (res) => ({
      default: res.SettingsVerificationsPage,
    }),
  ),
);

export const SettingsConnectedAddressesPage = lazyWithPreload(() =>
  import('~/pages/settingsConnectedAddresses/SettingsConnectedAddressesPage').then(
    (res) => ({ default: res.SettingsConnectedAddressesPage }),
  ),
);

export const SettingsConnectedAccountsPage = lazyWithPreload(() =>
  import('~/pages/settingsConnectedAccounts/SettingsConnectedAccountsPage').then(
    (res) => ({ default: res.SettingsConnectedAccountsPage }),
  ),
);

export const SettingsPreferredWalletPage = lazyWithPreload(() =>
  import('~/pages/settingsPreferredWallet/SettingsPreferredWalletPage').then(
    (res) => ({ default: res.SettingsPreferredWalletPage }),
  ),
);

export const SettingsDirectCastsPage = lazyWithPreload(() =>
  import('~/pages/settingsDirectCasts/SettingsDirectCastsPage').then((res) => ({
    default: res.SettingsDirectCastsPage,
  })),
);

export const SettingsDirectCastsRecommendedPage = lazyWithPreload(() =>
  import('~/pages/settingsDirectCasts/SettingsDirectCastsRecommendedPage').then(
    (res) => ({
      default: res.SettingsDirectCastsRecommendedPage,
    }),
  ),
);

export const SettingsDirectCastsOthersPage = lazyWithPreload(() =>
  import('~/pages/settingsDirectCasts/SettingsDirectCastsOthersPage').then(
    (res) => ({
      default: res.SettingsDirectCastsOthersPage,
    }),
  ),
);

// SettingsActionsPage removed

export const SettingsCastsAndUsersPage = lazyWithPreload(() =>
  import('~/pages/settingsCastsAndUsers/SettingsCastsAndUsersPage').then(
    (res) => ({
      default: res.SettingsCastsAndUsersPage,
    }),
  ),
);

export const SettingsMutedKeywordsPage = lazyWithPreload(() =>
  import('~/pages/settingsMutedKeywords/SettingsMutedKeywordsPage').then(
    (res) => ({
      default: res.SettingsMutedKeywordsPage,
    }),
  ),
);

export const SettingsImportPage = lazyWithPreload(() =>
  import('~/pages/settingsImport/SettingsImportPage').then((res) => ({
    default: res.SettingsImportPage,
  })),
);

export const SettingsStarterPacksPage = lazyWithPreload(() =>
  import('~/pages/settingsStarterPacks/SettingsStarterPacksPage').then(
    (res) => ({
      default: res.SettingsStarterPacksPage,
    }),
  ),
);

export const SettingsStoragePage = lazyWithPreload(() =>
  import('~/pages/settingsStorage/SettingsStoragePage').then((res) => ({
    default: res.SettingsStoragePage,
  })),
);

export const ArticlePage = lazyWithPreload(() =>
  import('~/pages/news/ArticlePage').then((res) => ({
    default: res.ArticlePage,
  })),
);

export const StarterPackPage = lazyWithPreload(() =>
  import('~/pages/starterPack/StarterPackPage').then((res) => ({
    default: res.StarterPackPage,
  })),
);

export const ReferralWithUsernamePage = lazyWithPreload(() =>
  import('~/pages/referral/ReferralPage').then((res) => ({
    default: res.ReferralPageWithUsername,
  })),
);

export const ReferralWithoutUsernamePage = lazyWithPreload(() =>
  import('~/pages/referral/ReferralPage').then((res) => ({
    default: res.ReferralPageWithoutUsername,
  })),
);

export const SettingsNotificationsPage = lazyWithPreload(() =>
  import('~/pages/settingsNotifications/SettingsNotificationsPage').then(
    (res) => ({ default: res.SettingsNotificationsPage }),
  ),
);

export const FollowingPage = lazyWithPreload(() =>
  import('~/pages/following/FollowingPage').then((res) => ({
    default: res.FollowingPage,
  })),
);

export const UsersForYouPage = lazyWithPreload(() =>
  import('~/pages/usersForYou/UsersForYouPage').then((res) => ({
    default: res.UsersForYouPage,
  })),
);

export const DeleteAccountPage = lazyWithPreload(() =>
  import('~/pages/support/DeleteAccountPage').then((res) => ({
    default: res.DeleteAccountPage,
  })),
);

export const SupportPage = lazyWithPreload(() =>
  import('~/pages/support/SupportPage').then((res) => ({
    default: res.SupportPage,
  })),
);

export const DevelopersEmbedsPage = lazyWithPreload(() =>
  import('~/pages/developers/DevelopersEmbedsPage').then((res) => ({
    default: res.DevelopersEmbedsPage,
  })),
);

export const DevelopersPage = lazyWithPreload(() =>
  import('~/pages/developers/DevelopersPage').then((res) => ({
    default: res.DevelopersPage,
  })),
);

export const TermsOfUsePage = lazyWithPreload(() =>
  import('~/pages/termsOfUse/TermsOfUsePage').then((res) => ({
    default: res.TermsOfUsePage,
  })),
);

export const PrivacyPolicyPage = lazyWithPreload(() =>
  import('~/pages/privacyPolicy/PrivacyPolicyPage').then((res) => ({
    default: res.PrivacyPolicyPage,
  })),
);

export const GlobalFrameAnalyticsPage = lazyWithPreload(() =>
  import('~/pages/globalFrameAnalytics/GlobalFrameAnalyticsPage').then(
    (res) => ({
      default: res.GlobalFrameAnalyticsPage,
    }),
  ),
);

// AddCastActionPage removed

// DiscoverActionsPage removed

// CastActionPlaygroundPage removed

// ComposerActionPlaygroundPage removed

export const LaunchMiniAppPage = lazyWithPreload(() =>
  import('~/pages/launchMiniApp/LaunchMiniAppPage').then((res) => ({
    default: res.LaunchMiniAppPage,
  })),
);

export const SettingsMiniAppsPage = lazyWithPreload(() =>
  import('~/pages/settingsMiniApps/SettingsMiniAppsPage').then((res) => ({
    default: res.SettingsMiniAppsPage,
  })),
);

export const TokenPage = lazyWithPreload(() =>
  import('~/pages/token/TokenPage').then((res) => ({
    default: res.TokenPage,
  })),
);

export const SettingsFeedsPage = lazyWithPreload(() =>
  import('~/pages/settingsFeeds/SettingsFeedsPage').then((res) => ({
    default: res.SettingsFeedsPage,
  })),
);

export const ContractAddressTransitionPage = lazyWithPreload(() =>
  import('~/pages/token/ContractAddressTransitionPage').then((res) => ({
    default: res.ContractAddressTransitionPage,
  })),
);

export const WalletPage = lazyWithPreload(() =>
  import('~/pages/wallet/WalletPage').then((res) => ({
    default: res.WalletPage,
  })),
);

export const ManageAppPage = lazyWithPreload(() =>
  import('~/pages/developers/ManageAppPage').then((res) => ({
    default: res.ManageAppPage,
  })),
);

export const MiniAppManifestPage = lazyWithPreload(() =>
  import('~/pages/developers/MiniAppManifestPage').then((res) => ({
    default: res.MiniAppManifestPage,
  })),
);

export const MiniAppEmbedPage = lazyWithPreload(() =>
  import('~/pages/developers/MiniAppEmbedPage').then((res) => ({
    default: res.MiniAppEmbedPage,
  })),
);

export const MiniAppPreviewPage = lazyWithPreload(() =>
  import('~/pages/developers/MiniAppPreviewPage').then((res) => ({
    default: res.MiniAppPreviewPage,
  })),
);

export const SnapsToolPage = lazyWithPreload(() =>
  import('~/pages/developers/SnapsToolPage').then((res) => ({
    default: res.SnapsToolPage,
  })),
);

export const TrendingTopicPage = lazyWithPreload(() =>
  import('~/pages/trendingTopic/TrendingTopicPage').then((res) => ({
    default: res.TrendingTopicPage,
  })),
);

export const FarcasterConnectPage = lazyWithPreload(() =>
  import('~/pages/farcasterConnect/FarcasterConnectPage').then((res) => ({
    default: res.FarcasterConnectPage,
  })),
);

export const OpenOnMobilePage = lazyWithPreload(() =>
  import('~/pages/openOnMobile/OpenOnMobilePage').then((res) => ({
    default: res.OpenOnMobilePage,
  })),
);

export const LoginRedirectToAppPage = lazyWithPreload(() =>
  import('~/pages/loginRedirectToApp/LoginRedirectToAppPage').then((res) => ({
    default: res.LoginRedirectToAppPage,
  })),
);

export const SettingsMutesAndBlocksPage = lazyWithPreload(() =>
  import('~/pages/settingsMutesAndBlocks/SettingsMutesAndBlocksPage').then(
    (res) => ({
      default: res.SettingsMutesAndBlocksPage,
    }),
  ),
);

export const SettingsBlockedUsersPage = lazyWithPreload(() =>
  import('~/pages/settingsBlockedUsers/SettingsBlockedUsersPage').then(
    (res) => ({
      default: res.SettingsBlockedUsersPage,
    }),
  ),
);

export const SettingsMutedUsersPage = lazyWithPreload(() =>
  import('~/pages/settingsMutedUsers/SettingsMutedUsersPage').then((res) => ({
    default: res.SettingsMutedUsersPage,
  })),
);

export const ReferralsOverviewPage = lazyWithPreload(() =>
  import('~/pages/referral/ReferralsOverviewPage').then((res) => ({
    default: res.ReferralsOverviewPage,
  })),
);

export const ReferralsListPage = lazyWithPreload(() =>
  import('~/pages/referral/ReferralsListPage').then((res) => ({
    default: res.ReferralsListPage,
  })),
);
