import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';

export type CastActionsBarProps = {
  cast: ApiCast;
  shouldShowCastBookmarkAction: boolean;
  onCastAddedToList?: () => void;
  hideCounts?: boolean;
  includeReason?: ApiCastFeedIncludeReason;
  likeCount: number;
  recastCount: number;
  replyCount: number;
  isFocusedCast: boolean;
  partOfTheDisabledThread?: boolean;
  onBeforeAction?: () => void;
};
