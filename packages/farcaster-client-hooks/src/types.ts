import { InfiniteData } from '@tanstack/react-query';
import {
  ApiAsset,
  ApiCast,
  ApiCastFeedItem,
  ApiChannel,
  ApiDirectCast,
  ApiDirectCastConversation,
  ApiDirectCastConversationInfoV3,
  ApiDirectCastInboxConversationInfoV3,
  ApiDirectCastMessageV3,
  ApiGetAccountVerificationsV2200Response,
  ApiGetAdminFeed200Response,
  ApiGetDirectCastConversationMessages200Response,
  ApiGetDirectCastKeys200Response,
  ApiGetExploreFeed200Response,
  ApiGetFollowers200Response,
  ApiGetFollowing200Response,
  ApiGetMutedKeyword200Response,
  ApiGetMutedKeywords200Response,
  ApiGetNews200Response,
  ApiGetOnboardingState200Response,
  ApiGetStarterPack200Response,
  ApiGetStarterPacks200Response,
  ApiGetStarterPackUsers200Response,
  ApiGetSuggestedUsers200Response,
  ApiGetThread200Response,
  ApiGetTokensInWatchlist200Response,
  ApiGetTwitterFollowing200Response,
  ApiGetUser200Response,
  ApiGetUserByFID200Response,
  ApiGetUserCasts200Response,
  ApiGetWalletPositions200Response,
  ApiTokenLink,
  ApiTrendingToken,
  ApiTrendingTopic,
  ApiUser,
} from 'farcaster-client-data';

import { PaginatedResult } from './hooks';
import { DeepPartial } from './utils';

/******************************************************************/

export type Cache<T> = T | undefined;
export type InfiniteCache<T> = InfiniteData<T, unknown> | undefined;

export type AdminFeedCache = InfiniteCache<ApiGetAdminFeed200Response>;
export type DirectCastKeysCache = Cache<ApiGetDirectCastKeys200Response>;
export type FollowersCache = InfiniteCache<ApiGetFollowers200Response>;
export type FollowingCache = InfiniteCache<ApiGetFollowing200Response>;
export type GloballyCachedAssetCache = Cache<ApiAsset>;
export type GloballyCachedCastCache = Cache<ApiCast>;
export type GloballyCachedChannelCache = Cache<ApiChannel>;
export type GloballyCachedTokenCache = Cache<ApiTokenLink>;
export type GloballyCachedTotpTokenCache = Cache<TimestampedTotpToken>;
export type GloballyCachedUserCache = Cache<ApiUser>;
export type InvitesAvailableCache = Cache<number>;
export type OnboardingStateCache = Cache<ApiGetOnboardingState200Response>;
export type SuggestedUsersCache =
  InfiniteCache<ApiGetSuggestedUsers200Response>;
export type ThreadCache = InfiniteCache<ApiGetThread200Response>;
export type UserCache = Cache<ApiGetUser200Response>;
export type UserCastsCache = InfiniteCache<ApiGetUserCasts200Response>;
export type GloballyCachedDirectCastInboxCache =
  Cache<ApiDirectCastInboxConversationInfoV3>;
export type StarterPackUsersCache =
  InfiniteCache<ApiGetStarterPackUsers200Response>;
export type StarterPackCache = Cache<ApiGetStarterPack200Response['result']>;
export type StarterPacksCache = InfiniteCache<ApiGetStarterPacks200Response>;
export type MutedKeywordCache = Cache<ApiGetMutedKeyword200Response['result']>;
export type MutedKeywordsCache = Cache<ApiGetMutedKeywords200Response>;
export type ChannelsForCategoryCache = InfiniteCache<
  PaginatedResult<ApiChannel>
>;
export type TwitterFollowingUsersCache =
  InfiniteCache<ApiGetTwitterFollowing200Response>;
export type VerificationsCache = Cache<
  ApiGetAccountVerificationsV2200Response['result']
>;
export type WalletPositionsCache = Cache<
  ApiGetWalletPositions200Response['result']
>;
export type NewsCache = Cache<ApiGetNews200Response['result']>;
export type ExploreFeedCache = Cache<ApiGetExploreFeed200Response['result']>;
export type UserProfileCache = Cache<ApiGetUserByFID200Response>;
export type TokenWatchlistsCache =
  InfiniteCache<ApiGetTokensInWatchlist200Response>;
/******************************************************************/

export type TimestampedTotpToken = {
  token: string;
  timestamp: number;
};

export type AssetUpdates = DeepPartial<ApiAsset> &
  Pick<ApiAsset, 'contractAddress' | 'tokenId'>;

export type BatchMergeIntoGloballyCachedAssets = (params: {
  batchUpdates: AssetUpdates[];
}) => void;

export type CastUpdates = DeepPartial<ApiCast> &
  Pick<ApiCast, 'hash' | 'recast'>;

export type MergeIntoGloballyCachedCast = (params: {
  updates: CastUpdates;
}) => void;

export type BatchMergeIntoGloballyCachedCasts = (params: {
  batchUpdates: CastUpdates[];
}) => void;

export type ChannelUpdates = DeepPartial<ApiChannel> & Pick<ApiChannel, 'key'>;

export type MergeIntoGloballyCachedChannel = (params: {
  updates: ChannelUpdates;
}) => void;

export type BatchMergeIntoGloballyCachedChannels = (params: {
  batchUpdates: ChannelUpdates[];
}) => void;

export type TokenUpdates = DeepPartial<ApiTokenLink> &
  Pick<ApiTokenLink, 'chain' | 'ca'>;

export type MergeIntoGloballyCachedToken = (params: {
  updates: TokenUpdates;
}) => void;

export type BatchMergeIntoGloballyCachedTokens = (params: {
  batchUpdates: TokenUpdates[];
}) => void;

export type UserUpdates = DeepPartial<ApiUser> & Pick<ApiUser, 'fid'>;

export type MergeIntoGloballyCachedUser = (params: {
  updates: UserUpdates;
}) => void;

export type BatchMergeIntoGloballyCachedUsers = (params: {
  batchUpdates: UserUpdates[];
}) => void;

export type DirectCastConversationUpdates =
  DeepPartial<ApiDirectCastConversationInfoV3> &
    Pick<ApiDirectCastConversationInfoV3, 'conversationId'>;

export type DirectCastInboxUpdates =
  DeepPartial<ApiDirectCastInboxConversationInfoV3> &
    Pick<ApiDirectCastInboxConversationInfoV3, 'conversationId'>;

export type DirectCastUpdates = DeepPartial<ApiDirectCastMessageV3> &
  Pick<ApiDirectCastMessageV3, 'conversationId' | 'messageId'>;

export type MergeIntoGloballyCachedDirectCastConversation = (params: {
  updates: DirectCastConversationUpdates;
}) => void;

export type MergeIntoGloballyCachedDirectCastInbox = (params: {
  updates: DirectCastInboxUpdates;
}) => void;

export type BatchMergeIntoGloballyCachedDirectCastConversation = (params: {
  batchUpdates: DirectCastConversationUpdates[];
}) => void;

/******************************************************************/

export type ApiDirectCastWithClientData = ApiDirectCast & {
  didFailToSend?: boolean;
  sending?: boolean;
};

export interface SignedPublicKeyBundle {
  readonly base64PublicKey: string;
  readonly base64Signature: string;
}

export interface KeyBundle {
  readonly preKey: SignedPublicKeyBundle;
  readonly identity: SignedPublicKeyBundle;
}

export interface RatchetHeader {
  readonly base64EphemeralKey: string;
  readonly previousChainLength: number;
  readonly messageNumber: number;
}

export interface Ciphertext {
  readonly base64IV: string;
  readonly base64Ciphertext: string;
  readonly base64AssociatedData?: string | undefined;
}

export interface RatchetMessage {
  readonly reinitBundle?: KeyBundle | undefined;
  readonly header: RatchetHeader;
  readonly ciphertext: Ciphertext;
}

export type RatchetEncrypt = (request: { base64Plaintext: string }) => Promise<{
  message: RatchetMessage;
  transportBundle?: {
    base64IV: string;
    base64Ciphertext: string;
    base64AssociatedData: string;
  };
}>;

export type RatchetDecrypt = (request: {
  message: RatchetMessage;
  transportBundle?: {
    base64IV: string;
    base64Ciphertext: string;
    base64AssociatedData: string;
  };
}) => Promise<string>;

export type ResetRatchet = () => Promise<void>;

export type RatchetBuilder = ({
  conversationId,
  counterPartyAddress,
}: {
  conversationId: string;
  counterPartyAddress: string;
}) => Promise<{
  ratchetDecrypt: RatchetDecrypt;
  resetRatchet: ResetRatchet;
}>;

export type DataStoreFetcher = (
  ratchetMessage: RatchetMessage,
) => Promise<string | undefined>;

export const directCastDecryptionFailedMessage =
  'This message could not be decrypted.';
export const directCastDefaultEncryptedMessage = 'New encrypted message';
export const directCastFailedToSendMessage =
  'Sent message was not saved, could not be decrypted.';
export const directCastNewDeviceAdded = 'A new device has been added.';
export const internalDecryptionMessageDoubleRatchetPrefix = 'FC__DR__';
export const directCastConversationMessageTTLDays = 30;

export type DecryptedApiDirectCast = ApiDirectCastWithClientData & {
  failedToDecrypt: boolean;
};

export type DecryptedApiDirectCastConversation = ApiDirectCastConversation & {
  lastDirectCast: DecryptedApiDirectCast;
};

export type OnCreateFallback =
  ApiGetDirectCastConversationMessages200Response['result'];

// Feed Type

export enum FeedItemType {
  UserRecommendations,
  Cast,
  EndOfFeedUnit,
  TrendingTopics,
  TrendingTokens,
}

export type UserRecommendations = {
  users: ApiUser[];
};

export type UserRecommendationsFeedItem = {
  type: FeedItemType.UserRecommendations;
  item: UserRecommendations;
};

export type CastFeedItem = {
  type: FeedItemType.Cast;
  item: ApiCastFeedItem;
};

export type TrendingTopics = {
  topics: ApiTrendingTopic[];
};

export type TrendingTopicsFeedItem = {
  type: FeedItemType.TrendingTopics;
  item: TrendingTopics;
};

export type TrendingTokens = {
  tokens: ApiTrendingToken[];
};

export type TrendingTokensFeedItem = {
  type: FeedItemType.TrendingTokens;
  item: TrendingTokens;
};

export type MixedFeedItem =
  | UserRecommendationsFeedItem
  | CastFeedItem
  | TrendingTopicsFeedItem;
