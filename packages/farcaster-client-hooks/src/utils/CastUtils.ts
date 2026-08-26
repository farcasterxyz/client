import {
  ApiCast,
  ApiCastUrlEmbed,
  ApiOpenGraphMetadata,
  ApiUser,
  parseCaip19Url,
} from 'farcaster-client-data';

import { FetchMoreReplies } from '../hooks/data/queries/conversationCastReplies';
import { FetchOpenGraphMetadataCardFoundResult } from '../hooks/generic/useFetchOpenGraphMetadata';

export type ThreadPosition =
  | 'start'
  | 'middle'
  | 'start_and_end'
  | 'end_continuous'
  | 'end_disconnected'
  | 'create_cast_inline_replying_to'
  | 'top_root'
  | 'dashed'
  | 'end_with_show_more'
  | 'middle_with_show_more';

// Hard cap on conversation reply-tree recursion depth (see getConversationReplies).
const MAX_CONV_REPLY_DEPTH = 32;

export type WrappedCast = { cast: ApiCast };

export type ThreadListItem<T extends WrappedCast> =
  | { type: 'cast'; wrappedCast: T }
  | { type: 'hiddenRepliesHeader'; hiddenRepliesVisible: boolean };

export type CastWrapper<T extends WrappedCast> = (props: {
  focusedCastHash: string;
  casts: ApiCast[];
  onShowMorePress: FetchMoreReplies;
  castHashesWithNoMoreReplies: string[];
  castHashesWithRequestedReplies: string[];
  hasHiddenReplies: boolean;
  hiddenRepliesVisible: boolean;
  numMainCasts: number;
  channelDisallowed: boolean;
}) => T[];

export type ShowMoreInfo = { hash: string; fid: number; onPress?: () => void };

export interface ThreadItem {
  cast: ApiCast;
  showMoreInfo: ShowMoreInfo | undefined;
  threadPosition: ThreadPosition;
  isFocused: boolean;
  omitReplyingTo: boolean;
  hideBottomBorder?: boolean;
}

export const buildDirectReplyHashesByParentHash = (casts: ApiCast[]) => {
  const directReplyHashesByParentHash = new Map<string, Set<string>>();

  casts.forEach((cast) => {
    if (!cast.parentHash) {
      return;
    }

    const replyHashes =
      directReplyHashesByParentHash.get(cast.parentHash) ?? new Set<string>();
    replyHashes.add(cast.hash);
    directReplyHashesByParentHash.set(cast.parentHash, replyHashes);
  });

  return directReplyHashesByParentHash;
};

export const getLoadedDirectReplyHashes = ({
  cast,
  directReplyHashesByParentHash,
}: {
  cast: ApiCast;
  directReplyHashesByParentHash: Map<string, Set<string>>;
}) => {
  const replyHashes = new Set(
    cast.replies.casts?.map((replyCast) => replyCast.hash) ?? [],
  );

  directReplyHashesByParentHash
    .get(cast.hash)
    ?.forEach((replyHash) => replyHashes.add(replyHash));

  return [...replyHashes];
};

export const getRemainingDirectReplyCount = ({
  cast,
  loadedDirectReplyHashes,
}: {
  cast: ApiCast;
  loadedDirectReplyHashes: string[];
}) => Math.max(0, cast.replies.count - loadedDirectReplyHashes.length);

export const getConversationThreadItems: CastWrapper<ThreadItem> = ({
  focusedCastHash,
  casts,
  onShowMorePress,
  castHashesWithNoMoreReplies,
  castHashesWithRequestedReplies,
  hiddenRepliesVisible,
  numMainCasts,
}): ThreadItem[] => {
  const threadItems: ThreadItem[] = [];
  const directReplyHashesByParentHash =
    buildDirectReplyHashesByParentHash(casts);
  const flatCastHashes = new Set(casts.map((cast) => cast.hash));

  for (let index = 0; index < casts.length; index++) {
    const cast = casts[index];

    const isFocused = cast.hash === focusedCastHash;

    const hasReplies = cast.replies.count !== 0;

    const hasParent =
      typeof cast.parentHash !== 'undefined' ||
      cast.parentSource?.type === 'url';

    const isNextReplyingToThis =
      index === casts.length - 1
        ? false
        : casts[index + 1].parentHash === cast.hash;

    const loadedDirectReplyHashes = getLoadedDirectReplyHashes({
      cast,
      directReplyHashesByParentHash,
    });
    const remainingDirectReplyCount = getRemainingDirectReplyCount({
      cast,
      loadedDirectReplyHashes,
    });
    const shouldShowMore =
      !isFocused &&
      remainingDirectReplyCount > 0 &&
      castHashesWithNoMoreReplies.includes(cast.hash) !== true;
    const showMoreInfo: ShowMoreInfo | undefined = shouldShowMore
      ? {
          hash: cast.hash,
          fid: cast.author.fid,
          onPress: () =>
            onShowMorePress({
              parentCastHash: cast.hash,
              excludeReplyHashes: loadedDirectReplyHashes,
            }),
        }
      : undefined;

    // Conversation cast = cast with embedded replies that need to be rendered
    const isConversation =
      !isFocused && hasParent && hasReplies && !isNextReplyingToThis;

    if (isConversation) {
      const replies = getConversationReplies({
        cast,
        castHashesWithNoMoreReplies,
        onShowMorePress,
        convReplyLevel: 0,
        parentIsLast: true,
        visited: new Set<string>(),
        excludedReplyHashes: flatCastHashes,
      });

      threadItems.push({
        cast,
        showMoreInfo,
        threadPosition: shouldShowMore
          ? 'end_with_show_more'
          : replies.length > 0
            ? 'start'
            : 'start_and_end',
        isFocused: false,
        omitReplyingTo: true,
      });

      threadItems.push(...replies);
    } else {
      const isPrevFocused =
        index === 0 ? false : casts[index - 1].hash === focusedCastHash;

      const isReplyingToPrev =
        index === 0 ? false : cast.parentHash === casts[index - 1].hash;

      const isStart = index === 0 || isPrevFocused || !isReplyingToPrev;

      const isEnd = index === casts.length - 1 || !isNextReplyingToThis;

      const threadPosition: ThreadPosition = shouldShowMore
        ? isEnd
          ? 'end_with_show_more'
          : 'middle_with_show_more'
        : isStart && isEnd
          ? 'start_and_end'
          : isStart
            ? 'start'
            : isEnd
              ? 'end_continuous'
              : 'middle';

      threadItems.push({
        cast,
        showMoreInfo,
        threadPosition,
        isFocused,
        omitReplyingTo:
          threadPosition === 'middle' ||
          threadPosition === 'middle_with_show_more' ||
          isStart,
      });

      if (castHashesWithRequestedReplies.includes(cast.hash)) {
        threadItems.push(
          ...getConversationReplies({
            cast,
            castHashesWithNoMoreReplies,
            onShowMorePress,
            convReplyLevel: 0,
            parentIsLast: !isNextReplyingToThis,
            visited: new Set<string>(),
            excludedReplyHashes: flatCastHashes,
          }),
        );
      }
    }

    // Remove border of last main item when hidden replies are visible because
    // we add a header with a line
    if (hiddenRepliesVisible && index === numMainCasts - 1) {
      threadItems[threadItems.length - 1].hideBottomBorder = true;
    }
  }
  return threadItems;
};

function getConversationReplies({
  cast,
  castHashesWithNoMoreReplies,
  onShowMorePress,
  convReplyLevel,
  parentIsLast,
  visited,
  excludedReplyHashes,
}: {
  cast: ApiCast;
  castHashesWithNoMoreReplies: string[];
  onShowMorePress: FetchMoreReplies;
  convReplyLevel: number;
  parentIsLast: boolean;
  visited: Set<string>;
  excludedReplyHashes: Set<string>;
}): ThreadItem[] {
  const threadItems: ThreadItem[] = [];

  // `replies.casts` is network-controlled and can be cyclic or extremely deep;
  // bail on a cycle (cast already on the current path) or past the depth cap to
  // avoid a JS stack overflow → Hermes SIGABRT.
  if (convReplyLevel >= MAX_CONV_REPLY_DEPTH || visited.has(cast.hash)) {
    return threadItems;
  }
  visited.add(cast.hash);

  const replies = (cast.replies.casts || []).filter(
    (replyCast) => !excludedReplyHashes.has(replyCast.hash),
  );

  replies.forEach((replyCast, index) => {
    const isLastVisibleReply = replies.length - 1 === index;
    const hasMoreVisibleSiblingReplies = !isLastVisibleReply;

    let childReplies: ThreadItem[] = [];
    if ((replyCast.replies.casts?.length ?? 0) > 0) {
      childReplies = getConversationReplies({
        cast: replyCast,
        castHashesWithNoMoreReplies,
        onShowMorePress,
        convReplyLevel: convReplyLevel + 1,
        parentIsLast: parentIsLast && isLastVisibleReply,
        visited,
        excludedReplyHashes,
      });
    }
    const hasVisibleChildReplies = childReplies.length > 0;

    const threadPosition = ((): ThreadPosition => {
      if (
        !parentIsLast ||
        hasVisibleChildReplies ||
        hasMoreVisibleSiblingReplies
      ) {
        return 'middle';
      }

      return 'end_continuous';
    })();

    threadItems.push({
      cast: replyCast,
      showMoreInfo: undefined,
      threadPosition,
      isFocused: false,
      omitReplyingTo: true,
    });

    threadItems.push(...childReplies);
  });

  visited.delete(cast.hash);
  return threadItems;
}

export const castIsParentUrlHeader = (cast: ApiCast): boolean | undefined => {
  if (cast.castType !== 'root-embed') {
    return false;
  }

  if (cast.channel || cast.token) {
    return true;
  }

  if (cast.author.fid !== 12695) {
    return false;
  }

  if (!cast.embeds) {
    return true;
  }

  const hasTokenUrlEmbed = cast.embeds.urls.some((url) => {
    const caip19url = parseCaip19Url(url.openGraph.url, false);
    return caip19url && caip19url.assetNamespace === 'erc20';
  });

  const hasTokenUnknownEmbed = cast.embeds.unknowns.some((unknown) => {
    const caip19url = parseCaip19Url(unknown.source, false);
    return caip19url && caip19url.assetNamespace === 'erc20';
  });

  return hasTokenUrlEmbed || hasTokenUnknownEmbed;
};

export const extractCastKey = (cast: ApiCast) =>
  [cast.author?.fid || -1, cast.hash, !!cast.recast].join('|');

interface SlimUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export interface CastShareContext {
  type: 'cast_share';
  cast: {
    author: SlimUser;
    hash: string;
    parentHash?: string;
    parentFid?: number;
    timestamp: number;
    mentions: SlimUser[];
    embeds: string[];
    channelKey?: string;
    text: string;
  };
}

function slimUserForMiniApp(user: ApiUser): SlimUser {
  return {
    fid: user.fid,
    username: user.username,
    displayName: user.displayName,
    pfpUrl: user.pfp?.url,
  };
}

export const convertCastForMiniAppLaunch = (
  cast: ApiCast,
): CastShareContext['cast'] => {
  const result = {
    hash: cast.hash,
    author: slimUserForMiniApp(cast.author),
    parentHash: cast.parentHash,
    parentFid: cast.parentAuthor?.fid,
    text: cast.text,
    timestamp: cast.timestamp,
    mentions:
      cast.mentions?.map((mention) => slimUserForMiniApp(mention)) ?? [],
    channelKey: cast.channel?.key,
    embeds: [
      ...(cast.embeds?.casts?.map((cast) => cast.hash) ?? []),
      ...(cast.embeds?.images?.map((image) => image.url) ?? []),
      ...(cast.embeds?.videos?.map((video) => video.url) ?? []),
      ...(cast.embeds?.urls?.map((url) => url.openGraph.url) ?? []),
    ],
  };
  return result;
};

export const convertCastToCastShareContext = (
  cast: ApiCast,
): CastShareContext => {
  return {
    type: 'cast_share',
    cast: convertCastForMiniAppLaunch(cast),
  };
};

export const buildApiCastUrlEmbedFromMetadata = ({
  requestedUrl,
  result,
}: {
  requestedUrl: string;
  result: FetchOpenGraphMetadataCardFoundResult;
}): ApiCastUrlEmbed => {
  const { metadata, finalUrl } = result;
  const resolvedUrl = finalUrl ?? requestedUrl;

  const openGraph: ApiOpenGraphMetadata = {
    url: resolvedUrl,
  };

  if (finalUrl && finalUrl !== requestedUrl) {
    openGraph.sourceUrl = requestedUrl;
  }

  const title = metadata.ogTitle ?? metadata.titleTag;
  if (title) {
    openGraph.title = title;
  }

  const description = metadata.ogDescription ?? metadata.description;
  if (description) {
    openGraph.description = description;
  }

  const image = metadata.ogImageUrlString ?? metadata.faviconUrlString;
  if (image) {
    openGraph.image = image;
  }

  try {
    openGraph.domain = new URL(resolvedUrl).hostname || undefined;
  } catch {
    // ignore
  }

  return { type: 'url', openGraph };
};
