import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiCastFeedItemTopHat,
} from 'farcaster-client-data';
import { FetchMoreReplies } from 'farcaster-client-hooks';

import { ShowMoreProps } from '~/components/casts/ShowMore';

export type ThreadPosition =
  | 'start'
  | 'start_and_end'
  | 'composer_start'
  | 'middle_continuous'
  | 'middle_disconnected'
  | 'end_continuous'
  | 'end_disconnected';

export type BuildCastWithContextOptions = {
  focusedCastHash?: string;
  forceThreadPosition?: ThreadPosition;
  forceCastHeaderLabelHidden?: boolean;
  onShowMorePress?: FetchMoreReplies;
  castHashesWithNoMoreReplies?: string[];
  excludeFocusedCast?: boolean;
  forceNoLastInList?: boolean;
  showChannelTag?: boolean | ((cast: ApiCast) => boolean);
  showPinnedAsAnnouncement?: boolean;
  channelDisallowed?: boolean;
  isHighlighted?: boolean;
};

export type CastContext = {
  index?: number;
  hasVisibleReplies: boolean;
  isFirstInList: boolean;
  isLastInList: boolean;
  isFocused: boolean;
  isReplyingToContinuousCast: boolean;
  isReplyingToDisconnectedCast: boolean;
  isReplyingToFocusedCast: boolean;
  forceShowReplyingTo: boolean;
  showMore: ShowMoreProps | undefined;
  truncateCastText: boolean;
  threadPosition: ThreadPosition;
  includeDetails: boolean;
  shouldShowRecastLabel: boolean;
  isReplyingToEmbed: boolean;
  shouldShowChannelTag: boolean;
  includeReason?: ApiCastFeedIncludeReason;
  labelReason?: string;
  itemTimestamp?: number;
  isPinned?: boolean;
  showPinnedAsAnnouncement?: boolean;
  score?: number;
  topHat?: ApiCastFeedItemTopHat;
  channelDisallowed?: boolean;
  showMemberBadge?: boolean;
  isHighlighted?: boolean;
};

export type ApiCastWithContext = {
  cast: ApiCast;
  context: CastContext;
};
