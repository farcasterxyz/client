import { ComposeCast } from '@farcaster/miniapp-core';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiAssetEvent,
  ApiCastChannelTag,
  ApiCastFeedIncludeReason,
  ApiCaststormCast,
  ApiCastVideoEmbed,
  ApiChain,
  ApiChannel,
  ApiEthNonFungibleToken,
  ApiLimitOrder,
  ApiNotificationType,
  ApiOnchainTokenMinimal,
  ApiOnchainTransactionSwapEmbed,
  ApiOpenGraphMetadata,
  ApiPaymentMethod,
  ApiProfileToken,
  ApiStarterPack,
  ApiTokenLink,
  ApiTokenNewsItem,
  ApiTokenSourcePlatform,
  ApiTotpTokenContext,
  ApiTrendingTokensTimeWindow,
  ApiUser,
  ApiUserCastAction,
  ApiUserMinimal,
  ApiUserQuality,
  CastHashPrefix,
} from 'farcaster-client-data';
import { FeedSourceOn } from 'farcaster-client-hooks';
import { WalletSendParams, WalletSwapParams } from 'farcaster-expo';

import type { NeynarScoreInfo } from '~/utils/NeynarScoreUtils';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootNativeStackParamList {}
  }
}

export const routes = {
  Token: 'Token',
  TokenCA: 'TokenCA',
} as const;

export type Route = (typeof routes)[keyof typeof routes];

type NoParams = Record<string, never>;

export type PhoneVerificationStartParams = {
  questId?: string;
  errorMessage?: string;
};

export type PhoneVerificationCodeParams = {
  questId?: string;
  phone: string;
};

export type TokenNewsParams = {
  symbol?: string;
  newsItems?: ApiTokenNewsItem[];
};

export type TokenNewsCastsParams = {
  symbol: string;
  newsItem: ApiTokenNewsItem;
};

export type FarcasterProUpsellParams = {
  source?: string; // used for analytics
};

export type RootStackParamList = {
  Drawer: NoParams;
  VideoScreen: VideoScreenParams;
};

export type RootNativeStackParamList = {
  RootStack: NoParams;
  UnauthedStack: NoParams;
  DraftCasts: NoParams;
  SelectCountry: SelectCountryScreenParams;
  SelectCastAction: SelectCastActionParams;
  NewUserFollowInstructions: NoParams;
  SecureModeSetup: SecureModeSetupScreenParams;
  FarcasterProUpsell: FarcasterProUpsellParams;
  SecureModeVerifyCode: SecureModeVerifyCodeScreenParams;
  PhoneVerificationStart: PhoneVerificationStartParams;
  PhoneVerificationCode: PhoneVerificationCodeParams;
  Campaign: CampaignScreenParams;
};

export type SecureModeSetupScreenParams = {
  onComplete?: () => void;
  source?: string; // used for analytics
};

export type DrawerParamList = {
  BottomTabs: BottomTabsParamList;
};

export type BottomTabsParamList = {
  HomeTab: NoParams;
  ExploreTab: NoParams;
  WalletTab: NoParams;
  NotificationsTab: NoParams;
  DirectCastsTab: NoParams;
  AppsHomeTab: NoParams;
  NewsTab: NoParams;
};

export type RecoveryStackParamList = {
  Recovery: NoParams;
  RecoveryBackupRecoveryPhrase: RecoveryBackupRecoveryPhraseParams;
};

export type RecoveryBackupRecoveryPhraseParams = {
  token: string;
  email: string;
  totpToken?: string;
};

export type UnauthedStackParamList = DebugStackParamList & {
  Landing: NoParams;
  OnboardingImportWallet: NoParams;
  OnboardingImportWalletHelp: NoParams;
  OnboardingSignIn: NoParams;
  OnboardingSignInWithEmail: NoParams;
  OnboardingSignInWithMobile: NoParams;
  OnboardingSignInWithDesktop: NoParams;
  OnboardingSignInWithDesktopInitiate: OnboardingSignInWithDesktopInitiateParams;
  OnboardingSignInWithWalletInitiate: OnboardingSignInWithWalletInitiateParams;
  OnboardingSignInWithWebInitiate: OnboardingSignInWithWebInitiateParams;
  OnboardingSignInAnotherDevice: OnboardingSignInAnotherDeviceParams;
  MagicLinkSignIn: MagicLinkSignInParams;
  RecoveryStart: RecoveryStartParams;
  RecoveryInitiate: RecoveryInitiateParams;
  RecoveryConfirm: RecoveryConfirmParams;
  RecoveryNotFound: RecoveryNotFoundParams;
  UnauthedStack: NoParams;
  SignedKeyRequest: SignedKeyRequestParams;
  WalletSignInAnotherDevice: WalletSignInAnotherDeviceParams;
  Onboarding: OnboardingParams;
};

export type HomeStackParamList = CommonStackParamList & {
  Feed: undefined | HomeScreenParams; // We include undefined because types will not be enforced on tab root screens.
};

export type ExploreStackParamList = CommonStackParamList & {
  Explore: undefined | { autoFocus?: boolean }; // We include undefined because types will not be enforced on tab root screens.
  OldExplore: undefined | NoParams; // We include undefined because types will not be enforced on tab root screens.
};

type ArticleNavigateSource =
  | 'universal-link'
  | 'trade-ideas-feed'
  | 'new-article-push'
  | 'new-article-inapp';

export type NewsStackParamList = CommonStackParamList & {
  News: undefined | NoParams; // We include undefined because types will not be enforced on tab root screens.
  Article: {
    publicId: string;
    source: ArticleNavigateSource;
  };
};

export type TrendingStackParamList = CommonStackParamList & {
  Discover: undefined | NoParams; // We include undefined because types will not be enforced on tab root screens.
};

export type ExploreAppsStackParamList = CommonStackParamList & {
  ExploreFarcaster: undefined | NoParams;
};

export type AppsCategoryScreenParams = {
  defaultSection: TrendingNavbarSections;
};

export type AppsHomeStackParamList = CommonStackParamList & {
  AppsHome: undefined | NoParams;
  DiscoverApps: undefined | NoParams;
  YourAppsSettings: undefined | NoParams;
  AppSettings: AppSettingsScreenParams;
  AppsCategory: AppsCategoryScreenParams;
  YourApps: undefined | NoParams;
  Studio: undefined | NoParams;
};

export type CollectibleParams = {
  data: ApiEthNonFungibleToken;
};

export type WalletSendCollectibleParams = {
  data: ApiEthNonFungibleToken;
};

export type WalletReceiveOnChainParams = {
  chain: ApiChain;
};

export type WalletOnRampParams = {
  paymentMethod?: ApiPaymentMethod;
};

export type WalletExploreParams = {
  prefilledQuery: string | undefined;
};

export type WalletLimitOrderParams = {
  kind: 'buy' | 'sell';
  initialToken?: ApiTokenLink;
};

export type WalletAlertsSettingsParams = {
  promptForPushes?: boolean;
};

export type WalletLimitOrderFillsParams = {
  order: ApiLimitOrder;
};

export type WalletParams = {
  initialTab?: 'orders';
  usdcLendingLearnMore?: boolean;
  limitOrderId?: string;
};

export type WalletStackParamList = {
  Wallet: WalletParams;
  WalletSend: WalletSendParams;
  WalletReceive: NoParams;
  WalletActivity: NoParams;
  WalletCash: NoParams;
  WalletReceiveOnChain: WalletReceiveOnChainParams;
  WalletOnRamp: WalletOnRampParams;
  WalletLimitOrder: WalletLimitOrderParams;
  WalletLimitOrderFills: WalletLimitOrderFillsParams;
  WalletSendCollectible: WalletSendCollectibleParams;
  WalletHyperEvmIntro: NoParams;
  WalletExplore: WalletExploreParams;
  WalletAlertsIntro: NoParams;
  WalletAlertsSettings: WalletAlertsSettingsParams;
  WalletAlertsToken: TokenAlertsParams;
  CoinbaseCommerceCallback: {
    callbackUrl: string;
    queryParams: Record<string, string>;
  };
};

export type WalletSwapStackParamList = {
  WalletSwap: WalletSwapParams;
  WalletSwapSelectSell: NoParams;
  WalletSwapSelectBuy: NoParams;
  WalletSwapDebug: NoParams;
};

export type WalletLimitOrderStackParamList = {
  WalletLimitOrderMain: WalletLimitOrderParams;
  WalletLimitOrderSelectToken: NoParams;
  WalletLimitOrderSelectFundingToken: NoParams;
};

export type NotificationsStackParamList = CommonStackParamList & {
  Notifications: undefined | NoParams; // We include undefined because types will not be enforced on tab root screens.
  NotificationsInGroup: NotificationsInGroupScreenParams;
  NotificationActorsInGroup: NotificationActorsInGroupScreenParams;
};

export type PlaintextDirectCastsStackParamList = {
  PlaintextDirectCasts: undefined | NoParams; // We include undefined because types will not be enforced on tab root screens.
  PlaintextDirectCastsBatchComposer: NoParams;
  PlaintextDirectCastsConversation: PlaintextDirectCastsConversationScreenParams;
  PlaintextDirectCastsCreateConversation: NoParams;
  PlaintextDirectCastsCreateConversationAddMembers: DirectCastsAddMembersScreenParams;
  DirectCastsRequests: NoParams;
  DirectCastsArchived: NoParams;
  DirectCastsConversationDetailsScreen: DirectCastsConversationDetailsScreenParams;
  DirectCastsGroupEdit: DirectCastsConversationDetailsScreenParams;
  DirectCastsGroupInviteLink: DirectCastsConversationDetailsScreenParams;
  DirectCastsGroupInvite: DirectCastsGroupInviteScreenParams;
  DirectCastsIntent: DirectCastsIntentScreenParams;
};

export type AppSettingsScreenParams = {
  domain: string;
};

export type InAppBrowserScreenParams = {
  url: string;
  source?: 'linking-fallback' | 'manual' | 'debug-menu';
};

export type AdvancedScreenSections = 'advanced-protection' | 'developer-mode';

export type AdvancedScreenParams = {
  section: AdvancedScreenSections | undefined;
};

export type SecureModeCodeVerificationMode = 'verify' | 'generate-token';

export type SecureModeVerifyCodeScreenParams = {
  mode: SecureModeCodeVerificationMode;
  context?: ApiTotpTokenContext;
  email?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export type CampaignScreenParams = {
  campaignId: string;
};

import { VideoPlayer } from 'expo-video';

import { TrendingNavbarSections } from '~/screens/AppsHome/TrendingNavbarSection';

export type VideoScreenParams = {
  seedVideo?: {
    castHash?: string;
    videoInCastIndex?: number;
    video?: ApiCastVideoEmbed;
    position?: number;
    isPlaying?: boolean;
    videoPlayer?: VideoPlayer;
  };
  onClose?: (seedVideoState?: { position: number; isPlaying: boolean }) => void;
};

export type CommonStackParamList = DebugStackParamList & {
  RecoverFarcasterAccount: NoParams;
  RecoverWalletAccount: NoParams;
  ListRecoveryOptions: NoParams;
  // Actions removed
  // AddCastAction removed
  Advanced: AdvancedScreenParams;
  AdvancedSigners: NoParams;
  AdvancedPasskeys: NoParams;
  AllChannels: NoParams;
  BlockedUsers: NoParams;
  BroadcastingChangeRecoveryAddress: BroadcastingChangeRecoveryAddressScreenParams;
  Bookmarks: NoParams;
  BuyStorage: NoParams;
  Cast: CastScreenParams;
  CastReactionUsers: CastReactionUsersScreenParams;
  CastRecastUsers: CastRecastUsersScreenParams;
  CastQuotes: CastQuotesScreenParams;
  CastWatchUsers: NoParams;
  CastsAndUsersSettings: NoParams;
  Channel: ChannelScreenParams;
  ChannelManage: ChannelManageScreenParams;
  ChannelManageDetails: ChannelManageDetailsScreenParams;
  ChannelManageInvites: ChannelManageInvitesScreenParams;
  ChannelManageInviteLink: ChannelManageInviteLinkScreenParams;
  ChannelManageWhoCanCast: ChannelManageWhoCanCastScreenParams;
  ChannelManageMembers: ChannelManageMembersScreenParams;
  ChannelManageBannedUsers: ChannelManageBannedUsersScreenParams;
  ChannelUsers: ChannelUsersScreenParams;
  CollectibleCast: CollectibleCastScreenParams;
  CollectibleCastIntro: NoParams;
  CollectibleCastDisplay: CollectibleCastScreenParams;
  ConnectAddress: NoParams;
  ConnectedAccounts: ConnectedAccountsScreenParams;
  ConnectedAddresses: NoParams;
  ConnectedApps: NoParams;
  ConnectedApp: ConnectedAppScreenParams;
  ConnectedAppRevokeWrite: ConnectedAppRevokeWriteScreenParams;
  ConnectedAppRevokeAuth: ConnectedAppRevokeAuthScreenParams;
  ContactsUsers: NoParams;
  CreateChannel: NoParams;
  CreateChannelPay: CreateChannelParams;
  CreateChannelSuccess: CreateChannelParams;
  CreateStarterPack: CreateStarterPackParams;
  ManageChannels: NoParams;
  DataUsage: NoParams;
  DevTools: NoParams;
  DevToolsDomains: DevToolsDomainsScrenParams;
  DevToolsPreviewMiniAppUrl: DevToolsPreviewMiniAppUrlScreenParams;
  DevToolsRegister: DevToolsRegisterScreenParams;
  DevToolsSnapEmulator: DevToolsSnapEmulatorScreenParams;
  DirectCastSettings: NoParams;
  DirectCastSettingsRecommended: NoParams;
  DirectCastSettingsOthers: NoParams;
  // DiscoverCastActions removed
  PlaintextDirectCastSettings: NoParams;
  EditBio: NoParams;
  EditChannel: EditChannelParams;
  EditChannelName: EditChannelParams;
  EditChannelDescription: EditChannelParams;
  EditDisplayName: NoParams;
  EditUsername: NoParams;
  ExploreScreen: NoParams;
  AddENSUsername: NoParams;
  EditEmail: NoParams;
  EditLocation: NoParams;
  EditProfile: NoParams;
  EditRecoveryAddress: EditRecoveryAddressParams;
  Events: EventsScreenParams;
  Feeds: NoParams;
  Follows: FollowsScreenParams;
  ReferralsJoin: {
    referralCode: string;
  };
  VanityReferralsJoin: {
    username: string;
  };
  ReferralsOverview: NoParams;
  ReferralsIntro: NoParams;
  ReferralsList: NoParams;
  DepositBonusesIntro: NoParams;
  LeastInteractedWithFollowing: NoParams;
  LocationUsers: LocationUsersScreenParams;
  ManageOwnedChannels: NoParams;
  MutedKeyword: MutedKeywordParams;
  MutedKeywords: NoParams;
  MutedUsers: NoParams;
  MutesAndBlocks: NoParams;
  MyDevices: NoParams;
  MyDevicesAddADesktopDevice: NoParams;
  MyDevicesAddAMobileDevice: NoParams;
  Collectible: CollectibleParams;
  NotificationSettings: NoParams;
  NotFound: NoParams;
  PasskeysBackupExistingUser: { migrateCredentialId?: string };
  PreferredWallet: NoParams;
  ProfilesFromX: NoParams;
  CollectibleCastsSettings: NoParams;
  TradeIdeasSettings: NoParams;
  InAppBrowser: InAppBrowserScreenParams;
  SignedKeyRequest: SignedKeyRequestParams;
  EditProfileToken: EditProfileTokenParams;
  Sessions: NoParams;
  Settings: NoParams;
  StarterPack: StarterPackParams;
  StarterPacks: NoParams;
  SuggestedStarterPacks: NoParams;
  Rewards: NoParams;
  PhoneVerificationStart: PhoneVerificationStartParams;
  PhoneVerificationCode: PhoneVerificationCodeParams;
  TokenNews: TokenNewsParams;
  TokenNewsCasts: TokenNewsCastsParams;
  TokenReportsSummary: TokenReportsSummaryParams;
  AllReportedTokens: NoParams;
  Storage: NoParams;
  StorageTransaction: StorageTransactionParams;
  SignInWithFarcaster: SignInWithFarcasterScreenParams;
  SignerRemove: SignerRemoveScreenParams;
  SignerRemoveBroadcasting: SignerRemoveBroadcastingParams;
  Signers: NoParams;
  UserV2: UserV2ScreenParams;
  UserProfileNotificationsSettings: UserProfileNotificationSettingsScreenParams;
  DeeplinkOnlyUserV2: DeeplinkOnlyUserV2ScreenParams;
  UserQuality: UserQualityScreenParams;
  UserNeynarScoreOverride: UserNeynarScoreOverrideScreenParams;
  UserCollectionNfts: UserCollectionNftsParams;
  Wallet: WalletParams;
  WalletReceiveOnChain: WalletReceiveOnChainParams;
  WalletOnRamp: WalletOnRampParams;
  TokenSearch: TokenSearchParams;
  [routes.Token]: TokenParams;
  [routes.TokenCA]: TokenCAParams;
  TokenActivity: TokenActivityParams;
  TrendingTokens: TrendingTokensParams;
  RecentTrades: NoParams;
  ContractAddressTransition: ContractAddressTransitionScreenParams;
  RedeemWarpsForUSDC: NoParams;
  WalletSettings: NoParams;
  TrendingTopic: TrendingTopicParams;
  Spaces: NoParams;
  SpaceRoom: { roomId: string; autoStartScheduled?: boolean };
  DebugNuxTasks: NoParams;
  NuxRecommendedFollows: NoParams;
};

export type DebugStackParamList = {
  DebugBenchmarks: NoParams;
  DebugCryptography: NoParams;
  DebugErrors: NoParams;
  DebugFeed: NoParams;
  DebugInAppBrowserLauncher: NoParams;
  DebugInAppPurchases: NoParams;
  DebugImages: NoParams;
  DebugLogs: NoParams;
  DebugMenu: NoParams;
  DebugNavigateTo: NoParams;
  DebugNavigationHistory: NoParams;
  DebugPasskeys: NoParams;
  DebugPushNotifications: NoParams;
  DebugRelease: NoParams;
  DebugAppAttest: NoParams;
  DebugStorage: NoParams;
  DebugStorefront: NoParams;
  DebugSyncChannel: NoParams;
  DebugTimeoutHistory: NoParams;
  DebugConnectWallet: NoParams;
  DebugCamera: NoParams;
  DebugUserQuality: NoParams;
  DebugOnboardingQuest: NoParams;
  DebugEmbeddedWallet: NoParams;
  DebugSecureMode: NoParams;
  DebugVerificationRemoval: NoParams;
  DebugTrendingFollowRecommendation: NoParams;
  DebugNewOnboarding: NoParams;
  DebugAdminTools: NoParams;
  DebugCollectibleCasts: NoParams;
  ExploreCollectibleCastsScreen: NoParams;
};

export type CastComposerIntent = {
  text: string;
  embeds: string[];
  mentions: ApiUser[];
  channelKey?: string;
  activeDraftId?: string;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  tokenKey?: string;
  parentCastHash?: string;
  draftCasts?: ApiCaststormCast[];
  scheduledAt?: Date;
};

export type MintWithWarpsDeepLinkedPrompt = {
  type: 'mint-with-warps';
  params: {
    url: string;
  };
};

export type StarterPackDeepLinkedPrompt = {
  type: 'starter-pack';
  params: {
    starterPack: ApiStarterPack;
  };
};

export type FeedScreenDeepLinkedPrompt =
  | MintWithWarpsDeepLinkedPrompt
  | StarterPackDeepLinkedPrompt;

export type HomeScreenParams = {
  castComposerIntent?: CastComposerIntent;
  prompt?: FeedScreenDeepLinkedPrompt;
};

export type SearchTabs = 'top' | 'casts' | 'tokens' | 'users' | 'channels';

export type ChannelScreenParams = {
  channelKey: string;
};

export type ChannelManageScreenParams = {
  channelKey: string;
};

export type ChannelManageDetailsScreenParams = {
  channelKey: string;
};

export type ChannelManageInvitesScreenParams = {
  channelKey: string;
};

export type ChannelManageInviteLinkScreenParams = {
  channelKey: string;
};

export type ChannelManageWhoCanCastScreenParams = {
  channelKey: string;
};

export type ChannelManageMembersScreenParams = {
  channelKey: string;
};

export type ChannelManageBannedUsersScreenParams = {
  channelKey: string;
};

export type PreviewFeedScreenParams = {
  feedKey: string;
};

export type CastScreenParams =
  | {
      castHash: string;
      castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      navigatedFromCastToast?: boolean;
    }
  | {
      castHashPrefix: CastHashPrefix;
      castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
      sourceOn?: FeedSourceOn;
      username: string;
      navigatedFromCastToast?: boolean;
    };

export type ChannelTag = Omit<ApiCastChannelTag, 'type'>;

export type ComposerOnSuccessCallback = (
  cast: ComposeCast.Result<false>['cast'],
) => void;

export type CreateCastSwapBanner = {
  type: 'swap';
  mode: 'buy' | 'sell';
  sellToken: ApiOnchainTokenMinimal;
  buyToken: ApiOnchainTokenMinimal;
  sellAmount: number;
  buyAmount: number;
};

export type CreateCastScreenParams = {
  intent?: CastComposerIntent;
  placeholder?: string;
  onSuccess?: ComposerOnSuccessCallback;
  onDismiss?: () => void;
  banner?: CreateCastSwapBanner;
  optimisticTxEmbed?: ApiOnchainTransactionSwapEmbed;
};

export type QueuedCastInfo = {
  localKey: number;
  text: string;
  userMentions: ApiUser[];
  channelMentions: ApiChannel[];
  tokenMentions: ApiTokenLink[];
};

export type QueuedCastInfoWithEmbeds = QueuedCastInfo & {
  embeds: string[];
  clientProcessedOpenGraphMetadata?: ApiOpenGraphMetadata[];
};

export type CollectionActivityScreenParams = {
  collectionId: string;
  collectionName: string;
};

export type CollectionOwnersScreenParams = {
  collectionId: string;
  collectionName: string;
};

export type ConnectedAccountsScreenParams = {
  success: boolean;
};

export type ConnectedAppScreenParams = {
  appFid: number;
  appName?: string;
};

export type ConnectedAppRevokeWriteScreenParams = {
  appFid: number;
};

export type ConnectedAppRevokeAuthScreenParams = {
  appFid: number;
};

export type CreateChannelParams = {
  channelKey: string;
};

export type CreateStarterPackParams = {
  existingStarterPack: ApiStarterPack | undefined;
};

export type EditChannelParams = {
  channelKey: string;
};

export type FidOrusername =
  | {
      fid: number;
      username?: string | undefined;
    }
  | {
      username: string;
      fid?: number | undefined;
    };

export type DevToolsPreviewMiniAppUrlScreenParams = {
  url?: string;
};

export type DevToolsSnapEmulatorScreenParams = {
  url?: string;
};

export type DevToolsRegisterScreenParams = {
  domain?: string;
  fid?: string;
};

export type UserScreenInitialTab =
  | 'casts'
  | 'snaps'
  | 'castsAndReplies'
  | 'starterPacks'
  | 'likes'
  | 'tokens';

export type UserV2ScreenParams = {
  fid: number;
  initialTab?: UserScreenInitialTab;
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  profileOpenCastHash?: string;
  sourceOn?: FeedSourceOn;
};

export type UserProfileNotificationSettingsScreenParams = {
  profileFid: number;
};

export type DeeplinkOnlyUserV2ScreenParams = {
  username: string;
  profileOpenCastHash?: string;
  sourceOn?: FeedSourceOn;
};

export type UserQualityScreenParams = {
  user: ApiUser;
  quality?: ApiUserQuality;
  badness?: number;
};

export type UserNeynarScoreOverrideScreenParams = {
  user: ApiUser;
  neynarScoreInfo?: NeynarScoreInfo;
};

export type UserCollectionNftsParams = {
  collectionName: string;
  collectionId: string;
  ownerFid: number;
};

export type EditRecoveryAddressParams = {
  succeededRecoveryAddressChangeId?: string;
  failedRecoveryAddressChangeId?: string;
};

export type EditProfileTokenParams = {
  onTokenSelected: (profileToken: ApiProfileToken) => void;
};

export type EventsScreenParams = {
  events: ApiAssetEvent[];
};

export type FollowsScreenInitialTab =
  | 'following'
  | 'followers'
  | 'followersYouKnow';

export type FollowsScreenParams =
  | {
      fid: number;
      displayName?: string;
      initialTab: FollowsScreenInitialTab;
    }
  | {
      username: string;
      displayName?: string;
      initialTab: FollowsScreenInitialTab;
    };

export type ChannelUsersScreenTab = 'members' | 'followers';
export type ChannelUsersScreenParams = {
  channelKey: string;
  initialTab?: ChannelUsersScreenTab;
};

export type CollectibleCastScreenParams = {
  castHash: string;
  username?: string;
};

export type CollectionScreenParams = {
  collectionId: string;
  collectionName: string;
};

export type BroadcastingChangeRecoveryAddressScreenParams = {
  recoveryAddressChangeId: string;
};

export type AddCastActionParams = {
  url?: string;
  name?: string;
  icon?: string;
  postUrl?: string;
  actionType?: string;
};

export type CastReactionUsersScreenParams =
  | {
      headerTitle: string | undefined;
      castHash: string;
    }
  | {
      castHashPrefix: CastHashPrefix;
      username: string;
      headerTitle: string | undefined;
    };

export type CastRecastUsersScreenParams =
  | {
      castHash: string;
    }
  | {
      username: string;
      castHashPrefix: CastHashPrefix;
    };

export type CastQuotesScreenParams =
  | {
      castHash: string;
    }
  | {
      username: string;
      castHashPrefix: CastHashPrefix;
    };

export type DirectCastsConversationScreenParamsWithConversationId = {
  conversationId: string;
};
export type DirectCastsConversationScreenParamsWithCounterPartyFids = {
  counterPartyFids: number[];
};

export type DirectCastsConversationScreenParams =
  | DirectCastsConversationScreenParamsWithConversationId
  | DirectCastsConversationScreenParamsWithCounterPartyFids;

export const isDirectCastConversationParamsWithConversationId = (
  params: DirectCastsConversationScreenParams,
): params is DirectCastsConversationScreenParamsWithConversationId => {
  return !!(params as DirectCastsConversationScreenParamsWithConversationId)
    .conversationId;
};

export type DevToolsDomainsScrenParams = {
  domain?: string;
};

export type DirectCastsConversationDetailsScreenParams = {
  conversationId: string;
};

export type DirectCastsGroupInviteScreenParams = {
  inviteCode: string;
};

export type DirectCastsIntentScreenParams = {
  targetFid: number;
  intentText: string | undefined;
};

export type PlaintextDirectCastsConversationScreenParams = {
  conversationId: string;
  counterParty?: ApiUserMinimal;
  create: boolean;
  intentText: string | undefined;
  focusOnMessageId?: string;
  tokenMentions?: ApiTokenLink[];
};

export type DirectCastsAddMembersScreenParams = {
  conversationId: string | undefined;
  excludeFids?: number[] | undefined;
};

export type NotificationsInGroupScreenParams = {
  groupId: string;
  type: Extract<
    ApiNotificationType,
    | 'new-cast'
    | 'new-cast-in-channel'
    | 'dormant-user-new-cast'
    | 'trending-cast'
    | 'channel-role-invite'
    | 'channel-pinned-cast'
    | 'frame-generic'
    | 'mini-app'
    | 'admin-review'
    | 'collectible-cast-watch-available'
  >;
  title: string | undefined;
};

export type NotificationActorsInGroupScreenParams = {
  groupId: string;
} & (
  | {
      type: Exclude<ApiNotificationType, 'nearby' | 'asset-event'>;
    }
  | {
      type: Extract<ApiNotificationType, 'nearby'>;
      locationDescription: string;
    }
);

export type NotificationCastsInGroupScreenParams = {
  groupId: string;
  type: Extract<ApiNotificationType, 'new-cast' | 'new-cast-in-channel'>;
};

export type RootTabScreenProps<Screen extends keyof BottomTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BottomTabsParamList, Screen>,
    NativeStackScreenProps<RootNativeStackParamList>
  >;

export type OnboardingParams = {
  // FIXME: Eventually move these to be part of the privateTypes.ts
  error: 'already_connected' | 'not_eligible' | undefined;
};

export type OnboardingPhoneParams = {
  errorMessage?: string;
};

export type OnboardingVerifyPhoneParams = {
  phone: string;
};

export type OnboardingSignInWithDesktopInitiateParams = {
  channelId: string | null;
};

export type OnboardingSignInWithWalletInitiateParams = {
  channelId: string | null;
};

export type OnboardingSignInWithWebInitiateParams = {
  channelId: string | null;
};

export type OnboardingSignInAnotherDeviceType = 'mobile' | 'web' | 'wallet';

export type OnboardingRegisterFidScreenParams = {
  allowBack?: boolean;
};

export type OnboardingSignInAnotherDeviceParams = {
  channelId: string | null;
  type: OnboardingSignInAnotherDeviceType;
};

export type WalletSignInAnotherDeviceParams = {
  channelId: string | null;
  nonce: string | null;
  expiresAt: string | null;
};

export type OnboardingSignInConfirmType = 'desktop' | 'mobile';

export type LocationUsersScreenParams = {
  placeId: string;
  description: string;
};

export type MutedKeywordParams = {
  keyword: string | undefined;
};

export type StarterPackParams = {
  starterPackId: string;
  newlyCreatedStarterPack?: boolean;
};

export type ContractAddressTransitionScreenParams = {
  address: string;
};

export type TokenSearchParams = {
  ticker: string;
};

export type TrendingTopicParams = {
  topicId: string;
  displayName: string;
};

export type TokenParams = {
  chain: ApiChain;
  ca: string;
  fid?: number;
  address?: string;
  via: string;
  attributedDomain?: string;
  castAuthorFid?: number;
};

export type TokenCAParams = {
  ca: string;
  via: string;
  attributedDomain?: string;
};

export type TokenReportsSummaryParams = {
  chain: ApiChain;
  ca: string;
};

export type TokenAlertsParams = {
  chain: ApiChain;
  ca: string;
};

export type TokenActivityParams = {
  chain: ApiChain;
  ca: string;
};

export type TrendingTokensParams = {
  platform?: ApiTokenSourcePlatform;
  chain?: ApiChain;
  timeWindow?: ApiTrendingTokensTimeWindow;
};

export type StorageTransactionParams = {
  productPurchaseTrackingId: string;
  units: number;
};

export type SelectCountryScreenParams = {
  onSelect: (countryCode: string) => void;
  allowedCountyCodes?: string[];
};

export type SelectCastActionParams = {
  onSelect: (actionId: string) => void;
  castActions: ApiUserCastAction[];
};

export type RemoteSiwfRequestParams = {
  token: string;
};

export type SignedKeyRequestParams = {
  token: string;
  redirectUrl?: string | undefined;
};

export type SignInWithFarcasterScreenParams = {
  signInUri: string;
};

export type SignerRemoveScreenParams = {
  publicKey: string;
};

export type SignerRemoveBroadcastingParams = {
  keyTransactionId: string;
  appPfpUrl?: string;
  appDisplayName?: string;
};

export type MagicLinkSignInParams = {
  token: string;
  address: string;
};

export type RecoveryStartParams = {
  token?: string;
  email?: string;
};

export type RecoveryInitiateParams = {
  email?: string;
};

export type RecoveryConfirmParams = {
  email: string;
};

export type RecoveryNotFoundParams = {
  email?: string;
};

export type AppDetailsParams = {
  slug: string;
};

export type FullParamList = RootStackParamList &
  RootNativeStackParamList &
  UnauthedStackParamList &
  DrawerParamList &
  BottomTabsParamList &
  HomeStackParamList &
  ExploreStackParamList &
  TrendingStackParamList &
  WalletStackParamList &
  WalletLimitOrderStackParamList &
  WalletSwapStackParamList &
  NotificationsStackParamList &
  PlaintextDirectCastsStackParamList &
  RecoveryStackParamList &
  AppsHomeStackParamList &
  NewsStackParamList;

export type ScreenName = keyof FullParamList;
export type BottomTabName = keyof BottomTabsParamList;

export type FocusedScreen<Name extends ScreenName> = {
  name: Name;
  params: FullParamList[Name];
};

export const isFocusedScreen = <Name extends ScreenName>(
  focusedScreen: unknown,
  name: Name,
): focusedScreen is FocusedScreen<Name> => {
  return !!(
    focusedScreen && (focusedScreen as FocusedScreen<Name>).name === name
  );
};

export const getFocusedScreenParams = <Name extends ScreenName>(
  focusedScreenAndParams: FocusedScreen<Name>,
): FullParamList[Name] => {
  return focusedScreenAndParams.params;
};
