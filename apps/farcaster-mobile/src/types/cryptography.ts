import {
  Conversation as CryptographyDirectCastConversation,
  // eslint-disable-next-line no-restricted-imports
  ConversationParticipant as CryptographyConversationParticipant,
  // eslint-disable-next-line no-restricted-imports
  InboxDirectCast as CryptographyDirectCast,
} from 'farcaster-cryptography';

export type SyncChannelType =
  | 'syncDirectCastsAsSender'
  | 'sendDirectCastsAsReceiver'
  | 'authAsSender'
  | 'authAsReceiver';

export type ConversationParticipant = CryptographyConversationParticipant;

export type DirectCast = CryptographyDirectCast & {
  sender: ConversationParticipant;
};

export type OptimisticDirectCast = DirectCast & {
  isOptimistic: true;
  localTimestamp: number;
};

export const isOptimisticDirectCast = (
  directCast: unknown,
): directCast is OptimisticDirectCast =>
  !!(directCast && (directCast as OptimisticDirectCast).isOptimistic);

export type DirectCastConversation = CryptographyDirectCastConversation & {
  lastMessage: DirectCast | undefined;
};

export type OptimisticDirectCasts = Record<
  string,
  undefined | Record<string, DirectCast>
>;

export type AddOptimisticDirectCast = (params: {
  conversationId: string;
  optimisticDirectCast: OptimisticDirectCast;
}) => RemoveOptimisticDirectCast;
export type RemoveOptimisticDirectCast = () => void;

export type SendDirectCast = (params: {
  conversationId: string;
  message: string;
  participants: ConversationParticipant[];
  reinit?: boolean;
}) => Promise<void>;

export type GetConversationPaginationParams =
  | { before: number; after: undefined }
  | { before: undefined; after: number };

export type StartNewConversation = (params: {
  counterPartyFids: number[];
}) => Promise<DirectCastConversation>;

export type MarkConversationRead = (params: {
  conversationId: string;
}) => Promise<void>;

export type DirectCastsStatusName =
  | 'error-syncing-inbox'
  | 'error-fetching-device-keys'
  | 'uninitialized'
  | 'device-limit-reached'
  | 'ready';

export type DirectCastsStatus =
  | {
      status: 'error-syncing-inbox';
      error: string;
      retry: () => Promise<void>;
    }
  | {
      status: 'error-fetching-device-keys';
      error: string;
      retry: () => Promise<void>;
    }
  | {
      status: 'uninitialized';
    }
  | {
      status: 'device-limit-reached';
    }
  | {
      status: 'ready';
    };

export type DeleteConversation = (conversationId: string) => Promise<void>;
