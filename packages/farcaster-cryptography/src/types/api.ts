export interface FarcasterApiClient {
  addDirectCastKeysByAccount(
    body: ApiAddDirectCastKeysByAccountRequestBody,
  ): Promise<FetchResponse<ApiAddDirectCastKeysByAccount200Response>>;

  getDirectCastKeysByAccount(
    params: ApiGetDirectCastKeysByAccountQueryParams,
  ): Promise<FetchResponse<ApiGetDirectCastKeysByAccount200Response>>;

  deleteDirectCastKeysByInbox(
    params: ApiDeleteDirectCastKeysByInboxQueryParams,
  ): Promise<FetchResponse<ApiDeleteDirectCastKeysByInbox200Response>>;

  getDirectCastKeys(
    params: ApiGetDirectCastKeysQueryParams,
  ): Promise<FetchResponse<ApiGetDirectCastKeys200Response>>;

  addDirectCastUserKey(
    body: ApiAddDirectCastUserKeyRequestBody,
  ): Promise<FetchResponse<ApiAddDirectCastUserKey200Response>>;

  getUser(
    params: ApiGetUserQueryParams,
  ): Promise<FetchResponse<ApiGetUser200Response>>;

  getSyncChannel(
    params: ApiGetSyncChannelQueryParams,
  ): Promise<FetchResponse<ApiGetSyncChannel200Response>>;

  deleteSyncChannel(
    params: ApiDeleteSyncChannelQueryParams,
  ): Promise<FetchResponse<ApiDeleteSyncChannel200Response>>;

  markSyncChannelMessageRead(
    body: ApiMarkSyncChannelMessageReadRequestBody,
  ): Promise<FetchResponse<ApiMarkSyncChannelMessageRead200Response>>;

  updateSyncChannel(
    body: ApiUpdateSyncChannelRequestBody,
  ): Promise<FetchResponse<ApiUpdateSyncChannel200Response>>;
}

export type RequestHeaders = Record<string, string>;

export type ApiBase64String = string;

export type ApiFarcasterAddress = string;

export type ApiCreateConversationRequestBody = {
  participantFids: ApiFid[];
};

export type ApiCreateConversation200Response = {
  result: {
    conversationId: string;
    participants: ApiUser[];
  };
};

export type ApiSendDirectCastRequestBody = {
  conversationId: string;
  text: string;
  transportBundle?: {
    base64IV: string;
    base64Ciphertext: string;
    base64AssociatedData: string;
  };
};

export type ApiSendDirectCast200Response = {
  result: {
    success: boolean;
  };
};

export type ApiGetDirectCastKeysQueryParams = {
  fid: ApiFid;
};

export type ApiGetDirectCastConversationsQueryParams = {
  cursor?: string;
  limit: number;
};

export type ApiDirectCastConversation = {
  conversationId: string;
  participants: ApiUser[];
  lastDirectCast?: ApiDirectCast;
  timestamp: ApiTimestampMillis;
  isUnread: boolean;
};

export type ApiAddDirectCastUserKey200Response = {
  result: {
    success: boolean;
  };
};

export type ApiAddDirectCastUserKeyRequestBody = {
  idk?: {
    base64PublicKey: ApiBase64String;
    base64Signature: ApiBase64String;
    deviceId: string;
    deviceName: string;
    transportBundle?: {
      base64IV: string;
      base64Ciphertext: string;
      base64AssociatedData: string;
    };
  };
  spk?: {
    base64PublicKey: ApiBase64String;
    base64Signature: ApiBase64String;
    deviceId: string;
    deviceName: string;
    transportBundle?: {
      base64IV: string;
      base64Ciphertext: string;
      base64AssociatedData: string;
    };
  };
};

export type ApiMarkConversationReadRequestBody = {
  conversationId: string;
};

export type ApiMarkConversationRead200Response = {
  result: {
    success: boolean;
  };
};

export type ApiKeyStoreKey = {
  keyId: string;
  type: string;
  base64PublicKey: ApiBase64String;
  base64Signature: ApiBase64String;
  timestamp: ApiTimestampMillis;
  fid?: ApiFid;
  deviceId?: string;
  deviceName?: string;
  transportBundle?: {
    base64IV: string;
    base64Ciphertext: string;
    base64AssociatedData: string;
  };
};

export type ApiGetDirectCastKeys200Response = {
  result: {
    keys: {
      idk: ApiKeyStoreKey[];
      spk: ApiKeyStoreKey[];
    };
  };
};

export interface FetchResponse<T> {
  readonly data: T;
  readonly status: number;
}

export type ApiGetDirectCastsFromConversationQueryParams = {
  conversationId: string;
  cursor?: string;
  limit: number;
};

export type ApiGetDirectCastsFromConversation200Response = {
  result: {
    participants: ApiUser[];
    directCasts: ApiDirectCast[];
    senderKeys: {
      idk: ApiKeyStoreKey;
      spk: ApiKeyStoreKey;
    };
    recipientKeys: {
      idk: ApiKeyStoreKey;
      spk: ApiKeyStoreKey;
    };
  };
  next?: {
    cursor?: string;
  };
};

export type ApiFid = number;

export type ApiFname = string;

export type ApiDisplayName = string;

export type ApiUri = string;

export type ApiPfp = {
  url: ApiUri;
  verified: boolean;
};

export type ApiLocation = {
  placeId: string;
  description: string;
};

export type ApiNonNegativeInteger = number;

export type ApiInviter = {
  fid: ApiFid;
  username?: ApiFname;
  displayName: ApiDisplayName;
};

export type ApiProfile = {
  bio: {
    text: string;
    mentions: string[];
  };
  location?: ApiLocation;
};

export type ApiUser = {
  fid: ApiFid;
  username?: ApiFname;
  displayName: ApiDisplayName;
  pfp?: ApiPfp;
  profile: ApiProfile;
  followerCount: ApiNonNegativeInteger;
  followingCount: ApiNonNegativeInteger;
  referrerUsername?: ApiFname;
  inviter?: ApiInviter;
  viewerContext?: {
    following?: boolean;
    followedBy?: boolean;
    canSendDirectCasts?: boolean;
    nerfed?: boolean;
    invisible?: boolean;
  };
};

export type ApiTimestampMillis = number;

export type ApiDirectCast = {
  sender: ApiUser;
  text: string;
  timestamp: ApiTimestampMillis;
  viewerContext?: {
    sender: boolean;
    received: boolean;
  };
  transportBundle?: {
    base64IV: string;
    base64Ciphertext: string;
    base64AssociatedData: string;
  };
};

export type ApiGetUserQueryParams = {
  fid: ApiFid;
};

export type ApiUserAndInviter = {
  user: ApiUser;
  inviter?: ApiUser;
  inviterIsReferrer?: boolean;
};

export type ApiGetUser200Response = {
  result: ApiUserAndInviter;
};

export type TransportBundle = {
  base64IV: string;
  base64Ciphertext: string;
  base64AssociatedData: string;
};

export type DirectCastConversation = {
  conversationId: string;
  directCasts: DirectCast[];
  participants: ApiUser[];
  isUnread: boolean;
  unreadCount: number;
  lastDirectCastTimestamp: number;
};

export type ApiSyncChannelHash = string;

export type ApiSyncChannelMessage = {
  messageHash: ApiSyncChannelHash;
  message: ApiBase64String;
  base64PublicKey: ApiBase64String;
  base64Signature: ApiBase64String;
};

export type ApiBase64UrlString = string;

export type ApiGetSyncChannelQueryParams = {
  channelId: string;
  base64PublicKey: ApiBase64UrlString;
  base64Signature: ApiBase64UrlString;
};

export type ApiGetSyncChannel200Response = {
  result: {
    messages: ApiSyncChannelMessage[];
  };
};

export type ApiDeleteSyncChannelQueryParams = {
  channelId: string;
  base64PublicKey: ApiBase64UrlString;
  base64Signature: ApiBase64UrlString;
};

export type ApiDeleteSyncChannel200Response = {
  result: {
    success: boolean;
  };
};

export type ApiMarkSyncChannelMessageReadRequestBody = {
  channelId: string;
  messageHash: ApiSyncChannelHash;
  base64PublicKey: ApiBase64String;
  base64Signature: ApiBase64String;
};

export type ApiMarkSyncChannelMessageRead200Response = {
  result: {
    success: boolean;
  };
};

export type ApiUpdateSyncChannelRequestBody = {
  channelId: string;
  messageHash: ApiSyncChannelHash;
  message: ApiBase64String;
  base64PublicKey: ApiBase64String;
  base64Signature: ApiBase64String;
};

export type ApiUpdateSyncChannel200Response = {
  result: {
    success: boolean;
  };
};

export type DirectCast = ApiDirectCast & {
  status: 'failed-to-decrypt' | 'failed-to-send' | 'decrypted';
  messageId?: string | undefined;
};

export type ApiDirectCastHeader = {
  base64IdentityKey?: ApiBase64String | undefined;
  base64SignedPreKey?: ApiBase64String | undefined;
  base64EphemeralKey: ApiBase64String;
  previousChainLength: number;
  messageNumber: number;
};

export type ApiDirectCastCiphertext = {
  base64IV: ApiBase64String;
  base64Ciphertext: ApiBase64String;
  base64AssociatedData: ApiBase64String;
};

export type ApiInboxDirectCastHeaderType =
  | ApiDirectCastHeader
  | ApiDirectCastCiphertext;

export type ApiInboxDirectCast = {
  conversationId: string;
  inboxId: string;
  messageId: string;
  account: string;
  fid: number;
  base64Identifier: ApiBase64String;
  reinit: boolean;
  noNotify: boolean;
  serverTimestamp: ApiTimestampMillis;
  header: ApiInboxDirectCastHeaderType;
  ciphertext: ApiDirectCastCiphertext;
};

export type ApiDirectCastConversationV2 = {
  conversationId: string;
  activeInboxIds: string[];
  accounts: string[];
  lastReadTime: ApiTimestampMillis;
  lastMessageTime: ApiTimestampMillis;
};

export type ApiGetDirectCastConversationsInfoQueryParamsCamelCase = {
  cursor?: string;
  limit: number;
};

export type ApiGetDirectCastConversationsInfoQueryParams =
  ApiGetDirectCastConversationsInfoQueryParamsCamelCase;

export type ApiDirectCastConversations = {
  conversations: ApiDirectCastConversationV2[];
};

export type ApiGetDirectCastConversationsInfo200Response = {
  result: ApiDirectCastConversations;
  next?: {
    cursor?: string;
  };
};

export type ApiGetDirectCastInboxQueryParamsCamelCase = {
  inboxId: string;
  cursor?: string;
  limit: number;
};
export type ApiGetDirectCastInboxQueryParams =
  ApiGetDirectCastInboxQueryParamsCamelCase;

export type ApiGetDirectCastInbox200Response = {
  result: {
    messages: ApiInboxDirectCast[];
  };
  next?: {
    cursor?: string;
  };
};

export type ApiSendBulkDirectCastRequestBody = {
  messages: ApiInboxDirectCast[];
};

export type ApiSendBulkDirectCast200Response = {
  result: {
    success: boolean;
  };
};

export type ApiSetDirectCastsFetchedRequestBody = {
  inboxId: string;
  messageIds: string[];
};

export type ApiSetDirectCastsFetched200Response = {
  result: {
    success: boolean;
  };
};

export type ApiGetDirectCastKeysByAccountQueryParamsCamelCase = {
  fid: ApiFid;
};
export type ApiGetDirectCastKeysByAccountQueryParams =
  ApiGetDirectCastKeysByAccountQueryParamsCamelCase;

export type ApiDirectCastKeysByAccount = {
  user: ApiUser;
  limitReached: boolean;
  keys: {
    idk: ApiDirectCastKey[];
    spk: ApiDirectCastKey[];
  };
};

export type ApiGetDirectCastKeysByAccount200Response = {
  result: ApiDirectCastKeysByAccount;
};

export type ApiAddDirectCastKeysByAccountRequestBody = {
  idk?: {
    keyId: string;
    type: string;
    base64PublicKey: ApiBase64String;
    base64Signature: ApiBase64String;
    deviceId: string;
    deviceName: string;
    account: ApiFarcasterAddress;
    inboxId: string;
  };
  spk?: {
    keyId: string;
    type: string;
    base64PublicKey: ApiBase64String;
    base64Signature: ApiBase64String;
    deviceId: string;
    deviceName: string;
    account: ApiFarcasterAddress;
    inboxId: string;
  };
};

export type ApiAddDirectCastKeysByAccount200Response = {
  result: {
    success: boolean;
  };
};

export type ApiDeleteDirectCastKeysByInboxQueryParamsCamelCase = {
  inboxId: string;
};
export type ApiDeleteDirectCastKeysByInboxQueryParams =
  ApiDeleteDirectCastKeysByInboxQueryParamsCamelCase;

export type ApiDeleteDirectCastKeysByInbox200Response = {
  result: {
    success: boolean;
  };
};

export type ApiMarkDirectCastsReadRequestBody = {
  messageIds: string[];
  localUnreadCount?: number;
};

export type ApiMarkDirectCastsRead200Response = {
  result: {
    success: boolean;
  };
};

export type ApiDirectCastKey = {
  keyId: string;
  type: string;
  base64PublicKey: ApiBase64String;
  base64Signature: ApiBase64String;
  deviceId: string;
  deviceName: string;
  account: ApiFarcasterAddress;
  inboxId: ApiBase64String;
  timestamp: ApiTimestampMillis;
};
