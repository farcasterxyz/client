import {
  ApiCastFeedIncludeReason,
  ApiNotificationType,
  ApiUserChannelsCategory,
  CastHashPrefix,
} from 'farcaster-client-data';
import { FeedSourceOn } from 'farcaster-client-hooks';

import {
  AdminEngagementRingCandidatesPage,
  AdminFeedsComparisonPage,
  AdminLabeledCastsPage,
  AdminReviewsPage,
  ApiKeysPage,
  AppsPage,
  ArticlePage,
  BookmarksPage,
  ChannelFeedPage,
  ChannelFollowersPage,
  ChannelFollowersYouKnowPage,
  ChannelJoinViaCodePage,
  ChannelMembersPage,
  ChannelPage,
  ChannelsPage,
  ChannelsSearchPage,
  CloudflareChallengePage,
  ComposePage,
  ContractAddressTransitionPage,
  ConversationQuotesWithoutUsernamePage,
  ConversationQuotesWithUsernamePage,
  ConversationReactionsWithoutUsernamePage,
  ConversationReactionsWithUsernamePage,
  ConversationRecastsWithoutUsernamePage,
  ConversationRecastsWithUsernamePage,
  ConversationWithoutUsernamePage,
  ConversationWithUsernamePage,
  DebugAdminTokenPage,
  DebugCastsPage,
  DebugEmbeddedWalletPage,
  DebugMenuPage,
  DeleteAccountPage,
  DevelopersEmbedsPage,
  DevelopersPage,
  DirectCastsConversationPage,
  DirectCastsInboxCreatePage,
  DirectCastsInboxPage,
  DirectCastsInvitePage,
  DownloadPage,
  FarcasterConnectPage,
  FollowersWithoutUsernamePage,
  FollowersWithUsernamePage,
  FollowersYouKnowWithoutUsernamePage,
  FollowersYouKnowWithUsernamePage,
  FollowingPage,
  FollowingWithoutUsernamePage,
  FollowingWithUsernamePage,
  GlobalFrameAnalyticsPage,
  HomeFeedPage,
  HostedManifestsPage,
  LaunchMiniAppPage,
  LiveAudioRoomPage,
  LocationUsersPage,
  LoginRedirectToAppPage,
  MagicLinkPage,
  ManageAppPage,
  ManageChannelsForCategoryPage,
  MiniAppEmbedPage,
  MiniAppManifestPage,
  MiniAppPreviewPage,
  MiniAppsEditorsChoicePage,
  MiniAppsPage,
  MiniAppsSearchPage,
  MintPage,
  NotificationGroupCastsPage,
  NotificationGroupChannelRoleInvitesPage,
  NotificationGroupMiniAppsPage,
  NotificationGroupUsersPage,
  NotificationsPage,
  OpenOnMobilePage,
  PrivacyPolicyPage,
  ProfileAssetsWithoutUsernamePage,
  ProfileAssetsWithUsernamePage,
  ProfileCastsAndRepliesWithoutUsernamePage,
  ProfileCastsAndRepliesWithUsernamePage,
  ProfileCastsWithoutUsernamePage,
  ProfileCastsWithUsernamePage,
  ProfileLikesWithoutUsernamePage,
  ProfileLikesWithUsernamePage,
  ProfileSnapCastsWithoutUsernamePage,
  ProfileSnapCastsWithUsernamePage,
  ProfileStarterPacksWithoutUsernamePage,
  ProfileStarterPacksWithUsernamePage,
  ProUpsellPage,
  RecentSearchPage,
  RecoveryInitiatePage,
  RecoveryPage,
  RecoveryStartPage,
  ReferralsJoinPage,
  ReferralsListPage,
  ReferralsOverviewPage,
  ReferralsPage,
  ReferralWithoutUsernamePage,
  ReferralWithUsernamePage,
  SavedPage,
  SettingsAdvancedPage,
  SettingsBlockedUsersPage,
  SettingsCastsAndUsersPage,
  SettingsConnectedAccountsPage,
  SettingsConnectedAddressesPage,
  SettingsDeveloperToolsPage,
  SettingsDirectCastsOthersPage,
  SettingsDirectCastsPage,
  SettingsDirectCastsRecommendedPage,
  SettingsFeedsPage,
  SettingsImportPage,
  SettingsMiniAppsPage,
  SettingsMutedKeywordsPage,
  SettingsMutedUsersPage,
  SettingsMutesAndBlocksPage,
  SettingsNotificationsPage,
  SettingsPreferredWalletPage,
  SettingsStarterPacksPage,
  SettingsStoragePage,
  SettingsVerificationsPage,
  SignInWithFarcasterPage,
  SignupForInvitePage,
  SnapsToolPage,
  SpaceRoomPage,
  SpacesPage,
  StarterPackPage,
  StarterPacksPage,
  SuggestedStarterPacksPage,
  SupportPage,
  TermsOfUsePage,
  TokenPage,
  TopSearchPage,
  TrendingTopicPage,
  UsersForYouPage,
  UsersSearchPage,
  VanityReferralJoinPage,
  VanityReferralLandingPage,
  WalletPage,
} from '~/lazy/pages';
import { ChannelEditSection } from '~/types/routing';

import {
  appExplorePathPrefix,
  appInboxPathPrefix,
  appPathPrefix,
  appSearchPathPrefix,
  appSettingsPathPrefix,
} from './routePrefixes';

const family = (family: RouteFamily) => family;

// Used for highlighting the active tab in the left side bar
export type RouteFamily =
  | 'default'
  | 'home'
  | 'spaces'
  | 'channel'
  | 'apps'
  | 'notifications'
  | 'explore'
  | 'profile'
  | 'settings'
  | 'invites'
  | 'collections'
  | 'directCasts'
  | 'search'
  | 'mini-apps'
  | 'bookmarks'
  | 'starter-packs'
  | 'news'
  | 'saved';

const routes = {
  homeFeed: {
    path: '/',
    params: {},
    search: {
      mintURL: undefined,
      composerActionURL: undefined,
      launchDepositBonusesInfo: undefined,
    } as {
      mintURL?: string;
      composerActionURL?: string;
      launchFrameDomain?: string;
      launchFrameUrl?: string;
      launchDepositBonusesInfo?: string;
    },
    family: family('home'),
    Component: HomeFeedPage,
  },
  audioRoom: {
    path: `${appPathPrefix}/audio-room/:roomId`,
    params: { roomId: '' } as {
      roomId: string;
    },
    search: {},
    family: family('home'),
    Component: LiveAudioRoomPage,
  },
  spacesDiscovery: {
    path: `${appPathPrefix}/spaces`,
    params: {},
    search: {
      tab: undefined,
    } as {
      tab?: 'live' | 'upcoming';
    },
    family: family('spaces'),
    Component: SpacesPage,
  },
  spaces: {
    path: `${appPathPrefix}/spaces/:roomId`,
    params: { roomId: '' } as {
      roomId: string;
    },
    search: {},
    family: family('spaces'),
    Component: SpaceRoomPage,
  },
  miniApps: {
    path: `/miniapps`,
    params: {},
    search: {
      q: undefined,
    } as {
      q?: string;
    },
    family: family('mini-apps'),
    Component: MiniAppsPage,
  },
  miniAppsEditorsChoice: {
    path: `/miniapps/editors-choice`,
    params: {},
    search: {},
    family: family('mini-apps'),
    Component: MiniAppsEditorsChoicePage,
  },
  miniAppsCanonical: {
    path: `/miniapps/:id/:slug?/*`,
    params: {
      id: '',
      slug: '',
      '*': '',
    } as {
      id: string;
      slug: string;
      '*': string;
    },
    search: {},
    family: family('mini-apps'),
    Component: LaunchMiniAppPage,
  },
  following: {
    path: `${appPathPrefix}/following`,
    params: {},
    search: {},
    family: family('home'),
    Component: FollowingPage,
  },

  channel: {
    path: `${appPathPrefix}/channel/:channelKey`,
    params: { channelKey: '' } as {
      channelKey: string;
    },
    search: {},
    family: family('channel'),
    Component: ChannelPage,
  },
  channelSettings: {
    path: `${appPathPrefix}/channel/:channelKey/settings`,
    params: { channelKey: '' } as {
      channelKey: string;
    },
    search: {},
    family: family('channel'),
    // Reuse ChannelPage so we avoid flashes due to lazy loading
    Component: ChannelPage,
  },
  channelSettingsSection: {
    path: `${appPathPrefix}/channel/:channelKey/settings/:section`,
    params: { channelKey: '', section: 'details' } as {
      channelKey: string;
      section: ChannelEditSection;
    },
    search: {},
    family: family('channel'),
    // Reuse ChannelPage so we avoid flashes due to lazy loading
    Component: ChannelPage,
  },
  channelFeed: {
    path: `${appPathPrefix}/channel/:channelKey/:tab`,
    params: { channelKey: '', tab: 'recent' } as {
      channelKey: string;
      tab: string;
    },
    search: {},
    family: family('channel'),
    Component: ChannelFeedPage,
  },
  channelFollowers: {
    path: `${appPathPrefix}/channel/:channelKey/followers`,
    params: { channelKey: '' } as {
      channelKey: string;
    },
    search: {},
    family: family('channel'),
    Component: ChannelFollowersPage,
  },
  channelMembers: {
    path: `${appPathPrefix}/channel/:channelKey/members`,
    params: { channelKey: '' } as {
      channelKey: string;
    },
    search: {},
    family: family('channel'),
    Component: ChannelMembersPage,
  },
  channelFollowersYouKnow: {
    path: `${appPathPrefix}/channel/:channelKey/followers-you-know`,
    params: { channelKey: '' } as {
      channelKey: string;
    },
    search: {},
    family: family('channel'),
    Component: ChannelFollowersYouKnowPage,
  },
  conversationWithoutUsername: {
    path: `${appPathPrefix}/conversations/:castHash`,
    params: { castHash: '' } as {
      castHash: string;
    },
    search: { includeReason: undefined, sourceOn: undefined } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
    },
    family: family('default'),
    Component: ConversationWithoutUsernamePage,
  },
  conversationReactionsWithoutUsername: {
    path: `${appPathPrefix}/conversations/:castHash/reactions`,
    params: { castHash: '' } as {
      castHash: string;
    },
    search: {},
    family: family('default'),
    Component: ConversationReactionsWithoutUsernamePage,
  },
  conversationRecastsWithoutUsername: {
    path: `${appPathPrefix}/conversations/:castHash/recasts`,
    params: { castHash: '' } as {
      castHash: string;
    },
    search: {},
    family: family('default'),
    Component: ConversationRecastsWithoutUsernamePage,
  },
  conversationQuotesWithoutUsername: {
    path: `${appPathPrefix}/conversations/:castHash/quotes`,
    params: { castHash: '' } as {
      castHash: string;
    },
    search: {},
    family: family('default'),
    Component: ConversationQuotesWithoutUsernamePage,
  },
  discover: {
    path: `${appPathPrefix}/apps`,
    params: {},
    search: {},
    family: family('apps'),
    Component: AppsPage,
  },
  discoverTrending: {
    path: `${appPathPrefix}/apps/trending`,
    params: {},
    search: {},
    family: family('apps'),
    Component: AppsPage,
  },
  discoverYourApps: {
    path: `${appPathPrefix}/apps/your-apps`,
    params: {},
    search: {},
    family: family('apps'),
    Component: AppsPage,
  },
  followersYouKnowWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/followers-you-know`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {},
    family: family('default'),
    Component: FollowersYouKnowWithoutUsernamePage,
  },
  followersWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/followers`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {},
    family: family('default'),
    Component: FollowersWithoutUsernamePage,
  },
  followingWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/following`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {},
    family: family('default'),
    Component: FollowingWithoutUsernamePage,
  },
  globalFrameAnalytics: {
    path: `${appPathPrefix}/frame-analytics`,
    params: {},
    search: {},
    family: family('default'),
    Component: GlobalFrameAnalyticsPage,
  },
  profileCastsWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileCastsWithoutUsernamePage,
  },
  profileCastsAndRepliesWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/casts-and-replies`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileCastsAndRepliesWithoutUsernamePage,
  },
  profileLikesWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/likes`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileLikesWithoutUsernamePage,
  },
  profileAssetsWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/assets`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileAssetsWithoutUsernamePage,
  },
  profileSnapCastsWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/snaps`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {},
    family: family('profile'),
    Component: ProfileSnapCastsWithoutUsernamePage,
  },
  profileStarterPacksWithoutUsername: {
    path: `${appPathPrefix}/profiles/:fid/packs`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileStarterPacksWithoutUsernamePage,
  },
  notifications: {
    path: `${appPathPrefix}/notifications`,
    params: {},
    search: {},
    family: family('notifications'),
    Component: NotificationsPage,
  },
  notificationsWithTabs: {
    path: `${appPathPrefix}/notifications/:tab`,
    params: { tab: '' } as {
      tab: string | undefined;
    },
    search: {},
    family: family('notifications'),
    Component: NotificationsPage,
  },
  notificationGroupUsers: {
    path: `${appPathPrefix}/notifications/:type/:groupId`,
    params: { groupId: '', type: 'follow' } as {
      groupId: string;
      type: ApiNotificationType;
    },
    search: { title: '' } as {
      title: string | undefined;
    },
    family: family('notifications'),
    Component: NotificationGroupUsersPage,
  },
  notificationGroupCasts: {
    path: `${appPathPrefix}/notifications/casts/:type`,
    params: { type: 'new-cast' } as {
      type: Extract<
        ApiNotificationType,
        | 'new-cast'
        | 'new-cast-in-channel'
        | 'dormant-user-new-cast'
        | 'unfollowed-cast-reply'
        | 'trending-cast'
        | 'channel-pinned-cast'
      >;
    },
    search: { groupId: '' } as {
      groupId: string;
    },
    family: family('notifications'),
    Component: NotificationGroupCastsPage,
  },
  notificationGroupChannelRoleInvites: {
    path: `${appPathPrefix}/notifications/channel-role-invites`,
    params: {},
    search: { groupId: '' } as {
      groupId: string;
    },
    family: family('notifications'),
    Component: NotificationGroupChannelRoleInvitesPage,
  },
  notificationGroupMiniApps: {
    path: `${appPathPrefix}/notifications/mini-apps`,
    params: {},
    search: { groupId: '' } as {
      groupId: string;
    },
    family: family('notifications'),
    Component: NotificationGroupMiniAppsPage,
  },
  directCastsInvite: {
    path: `${appPathPrefix}/group/:inviteCode`,
    params: { inviteCode: '' } as {
      inviteCode: string;
    },
    search: {},
    family: family('default'),
    Component: DirectCastsInvitePage,
  },
  directCastsCreate: {
    path: `${appInboxPathPrefix}/create/:fid`,
    params: { fid: 0 } as {
      fid: number;
    },
    search: {
      text: '',
    } as {
      text: string;
    },
    family: family('directCasts'),
    Component: DirectCastsInboxCreatePage,
  },
  directCastsInbox: {
    path: `${appInboxPathPrefix}`,
    params: {},
    search: {},
    family: family('directCasts'),
    Component: DirectCastsInboxPage,
  },
  directCastsConversation: {
    path: `${appInboxPathPrefix}/:conversationId`,
    params: { conversationId: '' } as {
      conversationId: string;
    },
    search: { text: '' } as {
      text?: string;
    },
    family: family('directCasts'),
    Component: DirectCastsConversationPage,
  },
  locationUsers: {
    path: `${appPathPrefix}/locations/:placeId`,
    params: { placeId: '' } as {
      placeId: string;
    },
    search: {},
    family: family('default'),
    Component: LocationUsersPage,
  },
  signInWithFarcaster: {
    path: `${appPathPrefix}/sign-in-with-farcaster`,
    params: {},
    search: {} as {},
    family: family('default'),
    Component: SignInWithFarcasterPage,
  },
  signInWithFarcasterV2: {
    path: `${appPathPrefix}/siwf`,
    params: {},
    search: {} as {},
    family: family('default'),
    Component: SignInWithFarcasterPage,
  },
  settings: {
    path: appSettingsPathPrefix,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsNotificationsPage,
  },
  settingsNotifications: {
    path: `${appSettingsPathPrefix}/notifications`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsNotificationsPage,
  },
  settingsConnectedAddresses: {
    path: `${appSettingsPathPrefix}/verified-addresses`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsConnectedAddressesPage,
  },
  settingsConnectedAccounts: {
    path: `${appSettingsPathPrefix}/connected-accounts`,
    params: {},
    search: {} as { success?: boolean },
    family: family('settings'),
    Component: SettingsConnectedAccountsPage,
  },
  settingsPreferredWallet: {
    path: `${appSettingsPathPrefix}/preferred-wallet`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsPreferredWalletPage,
  },
  settingsDirectCasts: {
    path: `${appSettingsPathPrefix}/direct-casts`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsDirectCastsPage,
  },
  settingsDirectCastsRecommended: {
    path: `${appSettingsPathPrefix}/direct-casts/recommended`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsDirectCastsRecommendedPage,
  },
  settingsDirectCastsOthers: {
    path: `${appSettingsPathPrefix}/direct-casts/others`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsDirectCastsOthersPage,
  },
  settingsFrames: {
    path: `${appPathPrefix}/settings/mini-apps`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsMiniAppsPage,
  },
  settingsFeeds: {
    path: `${appPathPrefix}/settings/feeds`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsFeedsPage,
  },
  settingsDeveloperTools: {
    path: `${appPathPrefix}/settings/developer-tools`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsDeveloperToolsPage,
  },
  settingsCastsAndUsers: {
    path: `${appSettingsPathPrefix}/casts-and-users`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsCastsAndUsersPage,
  },
  settingsImport: {
    path: `${appSettingsPathPrefix}/import`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsImportPage,
  },
  settingsMutedWords: {
    path: `${appSettingsPathPrefix}/muted-words`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsMutedKeywordsPage,
  },
  settingsMutedKeywords: {
    path: `${appSettingsPathPrefix}/muted-keywords`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsMutedKeywordsPage,
  },
  settingsStarterPacks: {
    path: `${appSettingsPathPrefix}/starter-packs`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsStarterPacksPage,
  },
  settingsStorage: {
    path: `${appSettingsPathPrefix}/storage`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsStoragePage,
  },
  settingsVerifications: {
    path: `${appSettingsPathPrefix}/verifications`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsVerificationsPage,
  },
  settingsMutesAndBlocks: {
    path: `${appSettingsPathPrefix}/mutes-and-blocks`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsMutesAndBlocksPage,
  },
  settingsBlockedUsers: {
    path: `${appSettingsPathPrefix}/blocked-users`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsBlockedUsersPage,
  },
  settingsMutedUsers: {
    path: `${appSettingsPathPrefix}/muted-users`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsMutedUsersPage,
  },
  starterPacks: {
    path: `${appPathPrefix}/starter-packs`,
    params: {},
    search: {},
    family: family('starter-packs'),
    Component: StarterPacksPage,
  },
  suggestedStarterPacks: {
    path: `${appPathPrefix}/suggested-starter-packs`,
    params: {},
    search: {},
    family: family('starter-packs'),
    Component: SuggestedStarterPacksPage,
  },
  starterPack: {
    path: `${appPathPrefix}/starter-packs/:id`,
    params: {
      id: '',
    } as {
      id: string;
    },
    search: {},
    family: family('default'),
    Component: StarterPackPage,
  },
  starterPackWithUsername: {
    path: `/:username/pack/:id`,
    params: { username: '', id: '' } as {
      username: string;
      id: string;
    },
    search: {},
    family: family('default'),
    Component: StarterPackPage,
  },
  news: {
    path: `${appPathPrefix}/news/:id`,
    params: {
      id: '',
    } as {
      id: string;
    },
    search: {},
    family: family('news'),
    Component: ArticlePage,
  },
  referral: {
    path: `${appPathPrefix}/referral/:fid`,
    params: {
      fid: 0,
    } as {
      fid: number;
    },
    search: {},
    family: family('invites'),
    Component: ReferralWithoutUsernamePage,
  },
  referralWithUsername: {
    path: `/:username/referral`,
    params: { username: '', id: '' } as {
      username: string;
      id: string;
    },
    search: {},
    family: family('invites'),
    Component: ReferralWithUsernamePage,
  },
  settingsAdvanced: {
    path: `${appSettingsPathPrefix}/advanced`,
    params: {},
    search: {},
    family: family('settings'),
    Component: SettingsAdvancedPage,
  },
  download: {
    path: `${appPathPrefix}/download`,
    params: {},
    search: {},
    family: family('default'),
    Component: DownloadPage,
  },
  signup: {
    path: `${appPathPrefix}/signup`,
    params: {},
    search: {},
    family: family('default'),
    Component: DownloadPage,
  },
  bookmarks: {
    path: `${appPathPrefix}/bookmarks`,
    params: {},
    search: {},
    family: family('bookmarks'),
    Component: BookmarksPage,
  },
  saved: {
    path: `${appPathPrefix}/saved`,
    params: {},
    search: {},
    family: family('saved'),
    Component: SavedPage,
  },
  savedStarterPacks: {
    path: `${appPathPrefix}/saved/starter-packs`,
    params: {},
    search: {},
    family: family('saved'),
    Component: SavedPage,
  },
  proUpsell: {
    path: `${appPathPrefix}/pro-upsell`,
    params: {},
    search: {} as {
      ref?: string;
    },
    family: family('default'),
    Component: ProUpsellPage,
  },
  manageChannelsCategory: {
    path: `${appPathPrefix}/manage-channels/:category`,
    params: {
      category: 'follow',
    } as {
      category: ApiUserChannelsCategory;
    },
    search: {},
    family: family('default'),
    Component: ManageChannelsForCategoryPage,
  },
  channels: {
    path: `${appExplorePathPrefix}/channels`,
    params: {},
    search: {},
    family: family('explore'),
    Component: ChannelsPage,
  },
  channelJoinViaCode: {
    path: `${appPathPrefix}/channel/:channelKey/join`,
    params: { channelKey: '' } as {
      channelKey: string;
    },
    search: { inviteCode: '' } as {
      inviteCode: string;
    },
    family: family('default'),
    Component: ChannelJoinViaCodePage,
  },
  app: {
    path: `${appExplorePathPrefix}/apps/:slug`,
    params: {},
    search: {},
    family: family('explore'),
    Component: AppsPage,
  },
  apps: {
    path: `${appExplorePathPrefix}/apps`,
    params: {},
    search: {},
    family: family('explore'),
    Component: AppsPage,
  },
  top: {
    path: `${appSearchPathPrefix}/top`,
    params: {},
    search: { q: '' } as {
      q: string;
    },
    family: family('search'),
    Component: TopSearchPage,
  },
  recent: {
    path: `${appSearchPathPrefix}/recent`,
    params: {},
    search: { q: '' } as {
      q: string;
    },
    family: family('search'),
    Component: RecentSearchPage,
  },
  searchChannels: {
    path: `${appSearchPathPrefix}/channels`,
    params: {},
    search: { q: '' } as {
      q: string;
    },
    family: family('search'),
    Component: ChannelsSearchPage,
  },
  searchUsers: {
    path: `${appSearchPathPrefix}/users`,
    params: {},
    search: { q: '' } as {
      q: string;
    },
    family: family('search'),
    Component: UsersSearchPage,
  },
  searchMiniApps: {
    path: `${appSearchPathPrefix}/mini-apps`,
    params: {},
    search: { q: '' } as {
      q: string;
    },
    family: family('search'),
    Component: MiniAppsSearchPage,
  },
  users: {
    path: `${appExplorePathPrefix}/users`,
    params: {},
    search: {},
    family: family('explore'),
    Component: UsersForYouPage,
  },
  compose: {
    path: `${appPathPrefix}/compose`,
    params: {},
    search: {
      text: '',
      embeds: [],
      channelKey: undefined,
      includeReason: undefined,
      parentCastHash: undefined,
    } as {
      text: string;
      embeds: string[];
      channelKey: string | undefined;
      includeReason: ApiCastFeedIncludeReason['type'] | undefined;
      parentCastHash: string | undefined;
    },
    family: family('home'),
    Component: ComposePage,
  },
  mint: {
    path: `${appPathPrefix}/mint`,
    params: {},
    search: {
      url: '',
    } as {
      url: string;
    },
    family: family('default'),
    Component: MintPage,
  },
  debug: {
    path: `${appPathPrefix}/debug`,
    params: {},
    search: {},
    family: family('default'),
    Component: DebugMenuPage,
  },
  debugCasts: {
    path: `${appPathPrefix}/debug/casts`,
    params: {},
    search: {},
    family: family('default'),
    Component: DebugCastsPage,
  },
  debugEmbeddedWallet: {
    path: `${appPathPrefix}/debug/embedded-wallet`,
    params: {},
    search: {},
    family: family('default'),
    Component: DebugEmbeddedWalletPage,
  },
  debugAdminToken: {
    path: `${appPathPrefix}/debug/admin-token`,
    params: {},
    search: {},
    family: family('default'),
    Component: DebugAdminTokenPage,
  },
  adminFeedsComparison: {
    path: `${appPathPrefix}/admin/feeds-comparison`,
    params: {},
    search: {},
    family: family('default'),
    Component: AdminFeedsComparisonPage,
  },
  adminEngagementRingCandidates: {
    path: `${appPathPrefix}/admin/engagement-ring-candidates`,
    params: {},
    search: { fid: undefined } as {
      fid?: string;
    },
    family: family('default'),
    Component: AdminEngagementRingCandidatesPage,
  },
  adminLabeledCasts: {
    path: `${appPathPrefix}/admin/labeled-casts`,
    params: {},
    search: { label: 'evergreen-labeled' } as {
      label:
        | 'evergreen-labeled'
        | 'high-quality-labeled'
        | 'low-quality-labeled'
        | undefined;
    },
    family: family('default'),
    Component: AdminLabeledCastsPage,
  },
  adminReviews: {
    path: `${appPathPrefix}/admin/reviews`,
    params: {},
    search: {},
    family: family('default'),
    Component: AdminReviewsPage,
  },
  developersEmbeds: {
    path: `${appPathPrefix}/developers/embeds`,
    params: {},
    search: {},
    family: family('default'),
    Component: DevelopersEmbedsPage,
  },
  developersApiKeys: {
    path: `${appPathPrefix}/developers/api-keys`,
    params: {},
    search: {},
    family: family('default'),
    Component: ApiKeysPage,
  },
  developersHostedManifests: {
    path: `${appPathPrefix}/developers/hosted-manifests`,
    params: {},
    search: {
      id: undefined,
      domain: undefined,
      manage: undefined,
    } as {
      id?: string;
      domain?: string;
      manage?: string;
    },
    family: family('default'),
    Component: HostedManifestsPage,
  },
  // developersEmbeds removed
  developersManageApp: {
    path: `${appPathPrefix}/developers/manage/:domain`,
    params: {
      domain: '',
    } as {
      domain: string;
    },
    search: {
      startDate: undefined,
    } as {
      startDate?: string;
    },
    family: family('default'),
    Component: ManageAppPage,
  },
  developersMiniAppManifest: {
    path: `${appPathPrefix}/developers/mini-apps/manifest`,
    params: {},
    search: {
      domain: undefined,
    } as {
      domain: string | undefined;
    },
    family: family('default'),
    Component: MiniAppManifestPage,
  },
  developersMiniAppEmbed: {
    path: `${appPathPrefix}/developers/mini-apps/embed`,
    params: {},
    search: {
      url: undefined,
    } as {
      url: string | undefined;
    },
    family: family('default'),
    Component: MiniAppEmbedPage,
  },
  developersMiniAppPreview: {
    path: `${appPathPrefix}/developers/mini-apps/preview`,
    params: {},
    search: {
      url: undefined,
    } as {
      url: string | undefined;
    },
    family: family('default'),
    Component: MiniAppPreviewPage,
  },
  developersSnaps: {
    path: `${appPathPrefix}/developers/snaps`,
    params: {},
    search: {
      url: undefined,
    } as {
      url: string | undefined;
    },
    family: family('default'),
    Component: SnapsToolPage,
  },
  // developersFrameValidator removed
  // developersCastActionPlayground removed
  // developersComposerActionPlayground removed
  developers: {
    path: `${appPathPrefix}/developers`,
    params: {},
    search: {},
    family: family('default'),
    Component: DevelopersPage,
  },
  support: {
    path: `${appPathPrefix}/support`,
    params: {},
    search: {},
    family: family('default'),
    Component: SupportPage,
  },
  supportDeleteAccount: {
    path: `${appPathPrefix}/support/deleteaccount`,
    params: {},
    search: {},
    family: family('default'),
    Component: DeleteAccountPage,
  },
  termsOfUse: {
    path: `${appPathPrefix}/terms-of-use`,
    params: {},
    search: {},
    family: family('default'),
    Component: TermsOfUsePage,
  },
  privacyPolicy: {
    path: `${appPathPrefix}/privacy-policy`,
    params: {},
    search: {},
    family: family('default'),
    Component: PrivacyPolicyPage,
  },
  '#': {
    path: '#',
    params: {},
    search: {},
    family: family('default'),
    Component: HomeFeedPage,
  },
  // addCastAction removed
  // discoverActions removed
  launchMiniApp: {
    path: `${appPathPrefix}/mini-apps/launch`,
    params: {},
    search: {} as {
      domain?: string;
      url?: string;
      [key: string]: string | undefined;
    },
    family: family('default'),
    Component: LaunchMiniAppPage,
  },

  // Vanity Routes
  // These routes must be defined at the end of the object
  // so hooks like `useCurrentRoute` – which take the first route they match –
  // don't prematurely match a vanity url where the leading symbol (e.g. `~`) is the username and
  // the path segment (e.g. `notifications`) is the `castHashPrefix`.
  // We must also adhere to this ordering in `Router` to accommodate vanity routes, unfortunately.
  conversationWithUsername: {
    path: '/:username/:castHashPrefix',
    params: { username: '', castHashPrefix: '' } as {
      username: string;
      castHashPrefix: CastHashPrefix;
    },
    search: { includeReason: undefined, sourceOn: undefined } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
    },
    family: family('default'),
    Component: ConversationWithUsernamePage,
  },
  conversationReactionsWithUsername: {
    path: '/:username/:castHashPrefix/reactions',
    params: { castHashPrefix: '', username: '' } as {
      castHashPrefix: CastHashPrefix;
      username: string;
    },
    search: {},
    family: family('default'),
    Component: ConversationReactionsWithUsernamePage,
  },
  conversationRecastsWithUsername: {
    path: '/:username/:castHashPrefix/recasts',
    params: { castHashPrefix: '', username: '' } as {
      castHashPrefix: CastHashPrefix;
      username: string;
    },
    search: {},
    family: family('default'),
    Component: ConversationRecastsWithUsernamePage,
  },
  conversationQuotesWithUsername: {
    path: '/:username/:castHashPrefix/quotes',
    params: { castHashPrefix: '', username: '' } as {
      castHashPrefix: CastHashPrefix;
      username: string;
    },
    search: {},
    family: family('default'),
    Component: ConversationQuotesWithUsernamePage,
  },
  profileSnapCastsWithUsername: {
    path: '/:username/snaps',
    params: { username: '' } as {
      username: string;
    },
    search: {},
    family: family('profile'),
    Component: ProfileSnapCastsWithUsernamePage,
  },
  profileCastsWithUsername: {
    path: '/:username',
    params: { username: '' } as {
      username: string;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileCastsWithUsernamePage,
  },
  profileCastsAndRepliesWithUsername: {
    path: '/:username/casts-and-replies',
    params: { username: '' } as {
      username: string;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileCastsAndRepliesWithUsernamePage,
  },
  profileLikesWithUsername: {
    path: '/:username/likes',
    params: { username: '' } as {
      username: string;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileLikesWithUsernamePage,
  },
  profileAssetsWithUsername: {
    path: '/:username/assets',
    params: { username: '' } as {
      username: string;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileAssetsWithUsernamePage,
  },
  profileStarterPacksWithUsername: {
    path: '/:username/packs',
    params: { username: '' } as {
      username: string;
    },
    search: {
      includeReason: undefined,
      sourceOn: undefined,
      castHash: undefined,
    } as {
      includeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      castHash?: string;
    },
    family: family('profile'),
    Component: ProfileStarterPacksWithUsernamePage,
  },
  followersYouKnowWithUsername: {
    path: '/:username/followers-you-know',
    params: { username: '' } as {
      username: string;
    },
    search: {},
    family: family('default'),
    Component: FollowersYouKnowWithUsernamePage,
  },
  followersWithUsername: {
    path: '/:username/followers',
    params: { username: '' } as {
      username: string;
    },
    search: {},
    family: family('default'),
    Component: FollowersWithUsernamePage,
  },
  followingWithUsername: {
    path: '/:username/following',
    params: { username: '' } as {
      username: string;
    },
    search: {},
    family: family('default'),
    Component: FollowingWithUsernamePage,
  },
  recoveryStart: {
    path: '/start-recovery',
    params: {},
    search: { token: '', email: '' } as {
      token: string;
      email: string;
    },
    family: family('default'),
    Component: RecoveryStartPage,
  },
  recoveryInitiate: {
    path: `${appPathPrefix}/recovery-init`,
    params: {},
    search: {},
    family: family('default'),
    Component: RecoveryInitiatePage,
  },
  recovery: {
    path: '/recovery',
    params: {},
    search: {},
    family: family('default'),
    Component: RecoveryPage,
  },
  magicLink: {
    path: '/magic-link',
    params: {},
    search: {},
    family: family('default'),
    Component: MagicLinkPage,
  },
  signupForInvite: {
    path: `${appPathPrefix}/invite-page/:inviterFid`,
    params: { inviterFid: 0 } as {
      inviterFid: number;
    },
    search: { id: '' } as {
      id: string;
    },
    family: family('default'),
    Component: SignupForInvitePage,
  },
  cloudflareChallenge: {
    path: `${appPathPrefix}/cloudflare-challenge/:id`,
    params: { id: '' } as {
      id: string;
    },
    search: {},
    family: family('default'),
    Component: CloudflareChallengePage,
  },
  referralCodeLandingPage: {
    path: `${appPathPrefix}/code/:code`,
    params: { code: '' } as {
      code: string;
    },
    search: {},
    family: family('default'),
    Component: ReferralsPage,
  },
  vanityReferralLandingPage: {
    path: `${appPathPrefix}/r/:username`,
    params: { username: '' } as {
      username: string;
    },
    search: {},
    family: family('default'),
    Component: VanityReferralLandingPage,
  },
  referralCodeJoinPage: {
    path: `${appPathPrefix}/referral-code/:code`,
    params: { code: '' } as {
      code: string;
    },
    search: {},
    family: family('default'),
    Component: ReferralsJoinPage,
  },
  vanityReferralJoinPage: {
    path: `${appPathPrefix}/r/:username/join`,
    params: { username: '' } as {
      username: string;
    },
    search: {},
    family: family('default'),
    Component: VanityReferralJoinPage,
  },
  token: {
    path: `${appPathPrefix}/token/:ticker`,
    params: {
      ticker: '',
    } as {
      ticker: string;
    },
    search: {
      from: undefined,
    } as {
      from?: string;
    },
    family: family('default'),
    Component: TokenPage,
  },
  ca: {
    path: `${appPathPrefix}/ca/:address`,
    params: {
      address: '',
    } as {
      address: string;
    },
    search: {},
    family: family('default'),
    Component: ContractAddressTransitionPage,
  },
  wallet: {
    path: `${appPathPrefix}/wallet`,
    params: {},
    search: {},
    family: family('default'),
    Component: WalletPage,
  },
  referrals: {
    path: `${appPathPrefix}/referrals`,
    params: {},
    search: {},
    family: family('default'),
    Component: ReferralsOverviewPage,
  },
  referralsList: {
    path: `${appPathPrefix}/referrals/list`,
    params: {},
    search: {},
    family: family('default'),
    Component: ReferralsListPage,
  },
  trendingTopic: {
    path: `${appPathPrefix}/trendingTopic/:topicId`,
    params: {
      topicId: '',
    } as {
      topicId: string;
    },
    search: {
      displayName: '',
    } as {
      displayName: string;
    },
    family: family('default'),
    Component: TrendingTopicPage,
  },
  farcasterConnect: {
    path: `${appPathPrefix}/connect`,
    params: {},
    search: {},
    family: family('default'),
    Component: FarcasterConnectPage,
  },
  openOnMobilePage: {
    path: `${appPathPrefix}/mobile`,
    params: {},
    search: {},
    family: family('default'),
    Component: OpenOnMobilePage,
  },
  loginRedirectWeb: {
    path: '/login-web',
    params: {},
    search: {},
    family: family('default'),
    Component: LoginRedirectToAppPage,
  },
  loginRedirectMobile: {
    path: '/login-mobile',
    params: {},
    search: {},
    family: family('default'),
    Component: LoginRedirectToAppPage,
  },
  loginRedirectWallet: {
    path: '/login-wallet',
    params: {},
    search: {},
    family: family('default'),
    Component: LoginRedirectToAppPage,
  },
  loginRedirectDesktop: {
    path: '/login-desktop',
    params: {},
    search: {},
    family: family('default'),
    Component: LoginRedirectToAppPage,
  },
  // Catch all
  catchAll: {
    path: '*',
    params: {},
    search: {},
    family: family('default'),
    Component: HomeFeedPage,
  },
} as const;

const defaultRoute = routes.homeFeed;

const routesArray = Object.values(routes);

const redirects: {
  path: string;
  url: string;
}[] = [
  {
    path: `${appPathPrefix}/frames/launch`,
    url: `${appPathPrefix}/mini-apps/launch`,
  },
  {
    path: `${appPathPrefix}/settings/frames`,
    url: `${appPathPrefix}/settings/mini-apps`,
  },
  {
    path: `${appPathPrefix}/frames`,
    url: `/miniapps`,
  },
  {
    path: `${appPathPrefix}/mini-apps`,
    url: `/miniapps`,
  },
  {
    path: `${appPathPrefix}/developers/frames`,
    url: `${appPathPrefix}/developers/mini-apps/manifest`,
  },
  {
    path: `${appPathPrefix}/developers/mini-apps/debug`,
    url: `${appPathPrefix}/developers/mini-apps/preview`,
  },
  {
    path: `${appPathPrefix}/developers/new`,
    url: `${appPathPrefix}/developers/mini-apps/manifest`,
  },
  {
    path: `${appPathPrefix}/developers/mini-apps`,
    url: `${appPathPrefix}/developers/mini-apps/manifest`,
  },
  {
    path: `${appPathPrefix}/notifications/frames`,
    url: `${appPathPrefix}/notifications/mini-apps`,
  },
  {
    path: `/referralCode/:code`,
    url: `${appPathPrefix}/code/:code`,
  },
  {
    path: `${appPathPrefix}/referralCode/:code`,
    url: `${appPathPrefix}/referral-code/:code`,
  },
  {
    path: `${appPathPrefix}/deposit-bonuses`,
    url: `/?launchDepositBonusesInfo=true`,
  },
  {
    path: `${appPathPrefix}/pro`,
    url: `${appPathPrefix}/pro-upsell`,
  },
];

export { defaultRoute, redirects, routes, routesArray };
