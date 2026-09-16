import {
  DirectCast as CryptographyDirectCast,
  DirectCastConversation as CryptographyDirectCastConversation,
} from 'farcaster-cryptography';

export type SyncChannelType =
  | 'syncDirectCastsAsSender'
  | 'sendDirectCastsAsReceiver'
  | 'authAsSender'
  | 'authAsReceiver';

export type DirectCast = CryptographyDirectCast & {
  isSending?: boolean;
  optimisticTimestamp?: number;
};

export type DirectCastConversation = Omit<
  CryptographyDirectCastConversation,
  'directCasts'
> & {
  directCasts: DirectCast[];
};

export type DirectCastConversations = Record<
  string,
  DirectCastConversation | undefined
>;
