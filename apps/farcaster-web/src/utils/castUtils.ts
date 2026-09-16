import {
  ApiCast,
  ApiCastEmbeds,
  ApiCastFeedItemMeta,
  ApiCastImageEmbed,
  ApiCastUrlEmbed,
  ApiCastVideoEmbed,
  ApiGroupInviteEmbed,
  ApiOpenGraphMetadata,
  ApiQuoteCastEmbed,
  ApiUser,
  isDomainOrSubdomain,
  isExactDomain,
} from 'farcaster-client-data';
import {
  buildDirectReplyHashesByParentHash,
  buildQuoteCastUrlSet,
  castIsParentUrlHeader,
  CastWrapper,
  FetchMoreReplies,
  getLoadedDirectReplyHashes,
  getRemainingDirectReplyCount,
  isQuoteCastUrl,
  urlEmbedFromHoistedSnap,
} from 'farcaster-client-hooks';
import { useEffect, useRef } from 'react';

import { ShowMoreProps } from '~/components/casts/ShowMore';
import { getOpenGraphType } from '~/hooks/openGraph/useOpenGraphType';
import {
  ApiCastWithContext,
  BuildCastWithContextOptions,
  ThreadPosition,
} from '~/types';

const getThreadPosition = ({
  hasReplies,
  isFocused,
  isReplyingToFocusedCast,
  isReplyingToDisconnectedCast,
  isReplyingToContinuousCast,
  isReplyingToEmbed,
}: {
  hasReplies: boolean;
  isFocused: boolean;
  isReplyingToFocusedCast: boolean;
  isReplyingToDisconnectedCast: boolean;
  isReplyingToContinuousCast: boolean;
  isReplyingToEmbed: boolean;
}): ThreadPosition => {
  if (isFocused) {
    if (isReplyingToContinuousCast && !isReplyingToEmbed) {
      return 'end_continuous';
    }

    return 'start_and_end';
  }

  if (isReplyingToFocusedCast) {
    if (hasReplies) {
      return 'start';
    } else {
      return 'start_and_end';
    }
  }

  if (isReplyingToContinuousCast) {
    if (hasReplies) {
      if (isReplyingToEmbed) {
        return 'start';
      }
      return 'middle_continuous';
    } else {
      return 'end_continuous';
    }
  }

  if (isReplyingToDisconnectedCast) {
    return 'end_disconnected';
  }

  if (hasReplies) {
    return 'start';
  }

  return 'start_and_end';
};

const buildCastsWithContext = (
  items: {
    cast: ApiCast;
    otherParticipants?: ApiUser[];
    replies?: ApiCast[];
    meta?: ApiCastFeedItemMeta;
    timestamp?: number;
    pinned?: boolean;
  }[],
  {
    focusedCastHash,
    forceThreadPosition,
    showPinnedAsAnnouncement,
    showChannelTag: showChannelTagOption = true,
    isHighlighted = false,
  }: BuildCastWithContextOptions = {},
): ApiCastWithContext[] => {
  const castsWithContext: ApiCastWithContext[] = [];

  // Remove the fake root embed for channels. We render a special header triggered by the
  // channel tag on the first cast
  const cleanItems = items.filter((item) => !castIsParentUrlHeader(item.cast));

  cleanItems.forEach(
    (
      { cast, replies: repliesParam, meta, timestamp: itemTimestamp, pinned },
      index,
    ) => {
      const isFirstInList = index === 0;
      const isFocused = focusedCastHash
        ? cast.hash.includes(focusedCastHash)
        : false;

      const prevCastWithContext: ApiCastWithContext | undefined =
        castsWithContext[castsWithContext.length - 1];

      const nextCast: ApiCast | undefined =
        index < cleanItems.length - 1 ? cleanItems[index + 1].cast : undefined;

      const replies: ApiCast[] = repliesParam || cast.replies.casts || [];

      const lastReply = replies.length
        ? replies[replies.length - 1]
        : undefined;

      const hasVisibleReplies = !!(
        lastReply || nextCast?.parentHash === cast.hash
      );

      // const hasMultipleRootReplies = cast.replies.count > 1;
      const hasCastsBetweenRootAndLastReply = !!(
        lastReply && lastReply.parentHash !== cast.hash
      );

      // Temp: this method is used only for non-conversation casts, and for now we want to show Show more
      // only when the reply is not a direct child of the main cast
      const shouldShowMore = hasCastsBetweenRootAndLastReply;
      // hasCastsBetweenRootAndLastReply ||
      // (lastReply && hasVisibleReplies && hasMultipleRootReplies);

      const showMore: ShowMoreProps | undefined = shouldShowMore
        ? { cast }
        : undefined;

      const isReplyingToContinuousCast = !!(
        cast.parentHash &&
        prevCastWithContext &&
        prevCastWithContext.cast.hash === cast.parentHash &&
        !prevCastWithContext.context.showMore
      );

      const isReplyingToDisconnectedCast = false;

      const isReplyingToFocusedCast = !!prevCastWithContext?.context.isFocused;

      const includeDetails =
        cast.replies.count !== 0 ||
        cast.recasts.count !== 0 ||
        cast.reactions.count !== 0 ||
        (typeof cast.quoteCount !== 'undefined' && cast.quoteCount !== 0) ||
        (cast.warpsTipped ?? 0) !== 0;

      const shouldShowRecastLabel =
        typeof cast.recasts.recasters !== 'undefined' &&
        cast.recasts.recasters.length !== 0;

      const isReplyingToEmbed = cast.parentSource?.type === 'url';

      const showChannelTag = (() => {
        if (typeof showChannelTagOption === 'boolean') {
          return showChannelTagOption;
        } else if (typeof showChannelTagOption === 'function') {
          return showChannelTagOption(cast);
        } else {
          return true;
        }
      })();

      castsWithContext.push({
        cast,
        context: {
          index,
          hasVisibleReplies,
          isFirstInList,
          isLastInList: false,
          isFocused,
          isReplyingToDisconnectedCast,
          isReplyingToContinuousCast,
          isReplyingToFocusedCast,
          forceShowReplyingTo: false,
          truncateCastText: true,
          showMore,
          threadPosition:
            forceThreadPosition ||
            getThreadPosition({
              hasReplies: hasVisibleReplies,
              isFocused,
              isReplyingToFocusedCast,
              isReplyingToDisconnectedCast,
              isReplyingToContinuousCast,
              isReplyingToEmbed,
            }),
          includeDetails,
          shouldShowRecastLabel,
          isReplyingToEmbed,
          shouldShowChannelTag: showChannelTag,
          includeReason: meta?.includeReason,
          labelReason: meta?.labelReason,
          itemTimestamp,
          isPinned: pinned,
          showPinnedAsAnnouncement,
          isHighlighted,
          score: meta?.score,
          topHat: meta?.topHat,
        },
      });

      if (lastReply) {
        const isReplyFocused = lastReply.hash === focusedCastHash;
        const isReplyReplyingToDisconnectedCast = !!showMore;
        const isReplyReplyingToContinuousCast =
          lastReply.parentHash === cast.hash &&
          !isReplyReplyingToDisconnectedCast;
        const isReplyReplyingToFocusedCast = isFocused;
        const replyHasVisibleReplies = false;
        const replyIsFirstInList = false;
        const isReplyingToEmbed = lastReply.parentSource?.type === 'url';

        castsWithContext.push({
          cast: lastReply,
          context: {
            index,
            hasVisibleReplies: replyHasVisibleReplies,
            isFirstInList: replyIsFirstInList,
            isLastInList: false,
            isFocused: isReplyFocused,
            isReplyingToDisconnectedCast: isReplyReplyingToDisconnectedCast,
            isReplyingToContinuousCast: isReplyReplyingToContinuousCast,
            isReplyingToFocusedCast: isReplyReplyingToFocusedCast,
            forceShowReplyingTo: false,
            showMore: undefined,
            truncateCastText: true,
            threadPosition:
              forceThreadPosition ||
              getThreadPosition({
                hasReplies: replyHasVisibleReplies,
                isFocused: isReplyFocused,
                isReplyingToFocusedCast: isReplyReplyingToFocusedCast,
                isReplyingToDisconnectedCast: isReplyReplyingToDisconnectedCast,
                isReplyingToContinuousCast: isReplyReplyingToContinuousCast,
                isReplyingToEmbed,
              }),
            includeDetails,
            shouldShowRecastLabel: false,
            isReplyingToEmbed,
            shouldShowChannelTag: false,
            includeReason: meta?.includeReason,
            itemTimestamp,
            score: meta?.score,
          },
        });
      }
    },
  );

  const lastCastWithContext = castsWithContext[castsWithContext.length - 1];
  if (lastCastWithContext) {
    lastCastWithContext.context.isLastInList = true;
  }

  return castsWithContext;
};

const buildCastsWithConversationContext: CastWrapper<ApiCastWithContext> = ({
  focusedCastHash,
  casts,
  onShowMorePress,
  castHashesWithNoMoreReplies,
  hasHiddenReplies,
  hiddenRepliesVisible,
  numMainCasts,
  channelDisallowed,
}): ApiCastWithContext[] => {
  const castsWithContext: ApiCastWithContext[] = [];

  const focusedCastIndexRaw = casts.findIndex(
    (cast) => focusedCastHash && cast.hash.includes(focusedCastHash),
  );
  const focusedCastIndex =
    focusedCastIndexRaw !== -1 ? focusedCastIndexRaw : undefined;

  const directReplyHashesByParentHash =
    buildDirectReplyHashesByParentHash(casts);

  casts.forEach((cast, index) => {
    // Add line above first main reply and first hidden reply
    const isFirstInList =
      index === 0 || (hiddenRepliesVisible && index === numMainCasts);
    const isFocused = focusedCastHash
      ? cast.hash.includes(focusedCastHash)
      : false;

    const prevCastWithContext: ApiCastWithContext | undefined =
      castsWithContext[castsWithContext.length - 1];

    const nextCast: ApiCast | undefined =
      index < casts.length - 1 ? casts[index + 1] : undefined;

    const replies: ApiCast[] = cast.replies.casts || [];
    const loadedDirectReplyHashes = getLoadedDirectReplyHashes({
      cast,
      directReplyHashesByParentHash,
    });
    const remainingDirectReplyCount = getRemainingDirectReplyCount({
      cast,
      loadedDirectReplyHashes,
    });
    const lastReply = replies.length ? replies[replies.length - 1] : undefined;

    const hasVisibleReplies = !!(
      lastReply || nextCast?.parentHash === cast.hash
    );

    // This cast is part of a thread if the previous cast is its parent and is not focused,
    // or it is the root cast in a channel (as we'll show above it the channel header)
    const isReplyingToContinuousCast = !!(
      (prevCastWithContext &&
        cast.parentHash &&
        prevCastWithContext.cast.hash === cast.parentHash &&
        !prevCastWithContext.context.isFocused) ||
      (cast.parentSource?.type === 'url' && cast.channel)
    );

    const shouldShowMore =
      remainingDirectReplyCount > 0 &&
      castHashesWithNoMoreReplies?.includes(cast.hash) !== true;

    const showMore: ShowMoreProps | undefined = shouldShowMore
      ? {
          cast,
          onPress: onShowMorePress
            ? () =>
                onShowMorePress({
                  parentCastHash: cast.hash,
                  excludeReplyHashes: loadedDirectReplyHashes,
                })
            : undefined,
        }
      : undefined;

    const isReplyingToDisconnectedCast = false;

    // We consider this a reply to the focused cast if it appears after it (whether the focused
    // cast is still in the list or was removed)
    const isReplyingToFocusedCast =
      focusedCastIndex !== undefined && index >= focusedCastIndex;

    const includeDetails =
      cast.recasts.count !== 0 ||
      cast.reactions.count !== 0 ||
      (typeof cast.quoteCount !== 'undefined' && cast.quoteCount !== 0) ||
      (cast.warpsTipped ?? 0) !== 0;

    const shouldShowRecastLabel = false;

    const isReplyingToEmbed = cast.parentSource?.type === 'url';

    castsWithContext.push({
      cast,
      context: {
        hasVisibleReplies,
        isFirstInList,
        isLastInList: false,
        isFocused,
        isReplyingToDisconnectedCast,
        isReplyingToContinuousCast,
        isReplyingToFocusedCast,
        forceShowReplyingTo: false,
        truncateCastText: false,
        showMore,
        threadPosition: getThreadPosition({
          hasReplies: hasVisibleReplies,
          isFocused,
          isReplyingToFocusedCast,
          isReplyingToDisconnectedCast,
          isReplyingToContinuousCast,
          isReplyingToEmbed,
        }),
        includeDetails,
        shouldShowRecastLabel,
        isReplyingToEmbed,
        shouldShowChannelTag: false,
        channelDisallowed,
        showMemberBadge: true,
      },
    });

    castsWithContext.push(
      ...buildRepliesWithConversationContext({
        cast,
        castHashesWithNoMoreReplies,
        onShowMorePress,
        convReplyLevel: 0,
        parentIsLast: true,
      }),
    );
  });

  // When no hidden replies: add bottom border to last main cast (=last cast)
  // When we have hidden replies and they are visible: add bottom border to last hidden reply (=last cast)
  // We compare the number of casts to the number of main casts to not add the border while hidden replies are loading
  if (
    !hasHiddenReplies ||
    (hiddenRepliesVisible && casts.length > numMainCasts)
  ) {
    const lastCastWithContext = castsWithContext[castsWithContext.length - 1];
    if (lastCastWithContext) {
      lastCastWithContext.context.isLastInList = true;
    }
  }

  return castsWithContext;
};

function buildRepliesWithConversationContext({
  cast,
  castHashesWithNoMoreReplies,
  onShowMorePress,
  convReplyLevel,
  parentIsLast,
}: {
  cast: ApiCast;
  castHashesWithNoMoreReplies?: string[];
  onShowMorePress?: FetchMoreReplies;
  convReplyLevel: number;
  parentIsLast: boolean;
}) {
  const castsWithContext: ApiCastWithContext[] = [];

  const replies = cast.replies.casts || [];

  // Show more when the conversation root has casts that are not shown to the user,
  // and we specifically have not disabled show more, e.g. because the hidden casts
  // are by muted users. This is only shown after the last reply.

  replies.forEach((replyCast, index) => {
    const isLastVisibleReply = replies.length - 1 === index;
    const hasMoreVisibleSiblingReplies = !isLastVisibleReply;

    // In a storm, replies by the focused author to this cast would be flattened into the
    // parent chain of replies. If that's the case we don't want to show "Show more"
    // even if there are additional hidden replies as UI becomes confusing.
    const isParentInStorm = replies.find(
      (siblingReply) =>
        siblingReply.hash !== replyCast.hash &&
        siblingReply.parentHash === replyCast.hash,
    )!;

    const numVisibleReplies = replyCast.replies.casts?.length ?? 0;
    const showMoreForReply =
      convReplyLevel === 0 &&
      !isParentInStorm &&
      replyCast.replies.count > numVisibleReplies &&
      castHashesWithNoMoreReplies?.includes(replyCast.hash) !== true;
    const existingReplies = replyCast.replies.casts;

    const shouldShowMore = showMoreForReply;
    const showMore: ShowMoreProps | undefined = showMoreForReply
      ? {
          cast: replyCast,
          onPress: onShowMorePress
            ? () =>
                onShowMorePress({
                  parentCastHash: replyCast.hash,
                  excludeReplyHashes: existingReplies?.map(
                    (reply) => reply.hash,
                  ),
                })
            : undefined,
        }
      : undefined;
    const isReplyingToEmbed = replyCast.parentSource?.type === 'url';

    let childReplies: ApiCastWithContext[] = [];
    if (replyCast.replies.casts?.length ?? 0 > 0) {
      childReplies = buildRepliesWithConversationContext({
        cast: replyCast,
        castHashesWithNoMoreReplies,
        onShowMorePress,
        convReplyLevel: convReplyLevel + 1,
        parentIsLast: parentIsLast && isLastVisibleReply,
      });
    }
    const hasVisibleChildReplies = childReplies.length > 0;

    castsWithContext.push({
      cast: replyCast,
      context: {
        hasVisibleReplies: hasMoreVisibleSiblingReplies,
        isFirstInList: false,
        isLastInList: false,
        isFocused: false,
        isReplyingToDisconnectedCast: false,
        isReplyingToContinuousCast: true,
        isReplyingToFocusedCast: false,
        forceShowReplyingTo: false,
        truncateCastText: false,
        showMore: showMore,
        threadPosition: getThreadPosition({
          hasReplies:
            // Continue the line when this is the last 3rd level
            // reply to its parent, but there are more 2nd level replies after
            !parentIsLast ||
            hasVisibleChildReplies ||
            hasMoreVisibleSiblingReplies ||
            shouldShowMore,
          isFocused: false,
          isReplyingToFocusedCast: false,
          isReplyingToDisconnectedCast: false,
          isReplyingToContinuousCast: true,
          isReplyingToEmbed,
        }),
        includeDetails: false,
        shouldShowRecastLabel: false,
        isReplyingToEmbed,
        shouldShowChannelTag: false,
        showMemberBadge: true,
      },
    });

    castsWithContext.push(...childReplies);
  });

  return castsWithContext;
}

type RenderableEmbed =
  | { type: 'image'; data: ApiCastImageEmbed }
  | { type: 'video'; data: ApiCastVideoEmbed }
  | { type: 'non-carousel-bunched-og'; data: ApiCastUrlEmbed }
  | { type: 'og'; data: ApiCastUrlEmbed }
  | { type: 'quote'; data: ApiQuoteCastEmbed }
  | { type: 'groupInvite'; data: ApiGroupInviteEmbed }
  | { type: 'unsupported'; source: string };

export function shouldRenderRichOpenGraphAttachment(
  og: ApiOpenGraphMetadata,
): boolean {
  if (!og.domain || !og.url) {
    return false;
  }

  // Frame V1 embeds - deprecated: do not render
  if (
    typeof og.frame !== 'undefined' &&
    typeof og.domain !== 'undefined' &&
    typeof og.frameEmbedNext === 'undefined'
  ) {
    return false;
  }

  // Twitter/X
  if (
    isDomainOrSubdomain(og.domain, 'twitter.com') ||
    isExactDomain(og.domain, 'x.com')
  ) {
    return !!og.description;
  }

  // Warpcast/Farcaster logic
  const isWarpcastDomain =
    isDomainOrSubdomain(og.domain, 'warpcast.com') ||
    isDomainOrSubdomain(og.domain, 'farcaster.xyz');

  if (!isWarpcastDomain) {
    return false;
  }

  try {
    const openGraphType = getOpenGraphType({ urlEmbed: og });

    return openGraphType !== 'url';
  } catch {
    return false;
  }
}

function getRenderableEmbeds({
  embeds,
  castText,
}: {
  embeds?: ApiCastEmbeds;
  castText: string;
}): RenderableEmbed[] {
  if (!embeds) {
    return [];
  }

  const result: RenderableEmbed[] = [];

  const quoteCastUrls = buildQuoteCastUrlSet({ quotes: embeds.casts ?? [] });

  // --- Video embeds
  for (const v of embeds.videos ?? []) {
    result.push({ type: 'video', data: v });
  }

  // --- Image embeds
  for (const i of embeds.images ?? []) {
    result.push({ type: 'image', data: i });
  }

  // --- Quote casts
  for (const quote of embeds.casts ?? []) {
    result.push({ type: 'quote', data: quote });
  }

  // --- Group Invites
  for (const gi of embeds.groupInvites ?? []) {
    result.push({ type: 'groupInvite', data: gi });
  }

  const urls = embeds.urls.filter(
    (url) =>
      !isQuoteCastUrl({
        url: url.openGraph.url,
        sourceUrl: url.openGraph.sourceUrl,
        quoteCastUrls,
      }),
  );

  // --- OG embeds (skip quotes and deprecated)
  for (const urlEmbed of urls) {
    const og = urlEmbed.openGraph;

    if (shouldRenderRichOpenGraphAttachment(og)) {
      result.push({ type: 'non-carousel-bunched-og', data: urlEmbed });
    } else {
      result.push({ type: 'og', data: urlEmbed });
    }
  }

  // --- Hoisted snaps (`embeds.snap[]`) not already represented as legacy
  // `urls[*].openGraph.snap` rows (see NEYN-10204 / NEYN-10425). Always `og`
  // so snap-mode rendering uses `SnapEmbedAttachment`, not rich OG.
  const legacySnapManifestUrls = new Set(
    (embeds.urls ?? [])
      .map((u) => u.openGraph?.snap?.url)
      .filter((u): u is string => typeof u === 'string'),
  );
  for (const hoisted of embeds.snap ?? []) {
    if (!hoisted.url || legacySnapManifestUrls.has(hoisted.url)) {
      continue;
    }
    result.push({ type: 'og', data: urlEmbedFromHoistedSnap(hoisted) });
  }

  // --- Unknowns that are missing from text (as fallbacks)
  for (const unknown of embeds.unknowns ?? []) {
    const source = unknown.source;
    const textMissing =
      !castText.includes(source) &&
      !(source.startsWith('https://') && castText.includes(source.slice(8))) &&
      !(source.startsWith('http://') && castText.includes(source.slice(7)));
    if (textMissing) {
      result.push({ type: 'unsupported', source });
    }
  }

  return result;
}

function useHorizontalDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false); // Track if we actually dragged

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    // add/-remove grab cursor only when needed
    const setRestCursor = () => {
      const canScroll = el.scrollWidth > el.clientWidth;
      el.classList[canScroll ? 'add' : 'remove']('cursor-grab');
      if (canScroll) {
        el.style.cursor = 'grab';
      } else {
        el.style.cursor = 'pointer';
      }
    };

    setRestCursor();

    // re-evaluate on resize / content changes
    const ro = new ResizeObserver(setRestCursor);
    ro.observe(el);

    let startX = 0;
    let startScroll = 0;
    const DRAG_THRESHOLD = 5; // pixels before we consider it a drag

    const down = (e: PointerEvent) => {
      // Only handle left mouse button or touch
      if (e.button !== 0) {
        return;
      }

      draggingRef.current = true;
      draggedRef.current = false;
      el.classList.add('cursor-[grabbing]');
      el.style.cursor = 'grabbing';
      startX = e.clientX;
      startScroll = el.scrollLeft;

      // Add listeners to document instead of using setPointerCapture
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    };

    const move = (e: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }

      const deltaX = Math.abs(e.clientX - startX);

      // Only start dragging if we've moved beyond threshold
      if (deltaX > DRAG_THRESHOLD) {
        draggedRef.current = true;
        e.preventDefault(); // Prevent text selection
        el.scrollLeft = startScroll - (e.clientX - startX);
      }
    };

    const up = () => {
      if (!draggingRef.current) {
        return;
      }

      draggingRef.current = false;
      el.classList.remove('cursor-[grabbing]');

      const canScroll = el.scrollWidth > el.clientWidth;
      el.style.cursor = canScroll ? 'grab' : 'pointer';

      // Remove document listeners
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);

      // If we dragged, prevent any click events from firing
      if (draggedRef.current) {
        // Add a temporary click capture to prevent clicks
        const preventClick = (e: Event) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          document.removeEventListener('click', preventClick, true);
        };

        // Use capture phase to catch clicks before they reach targets
        document.addEventListener('click', preventClick, true);

        // Remove the listener after a short delay as backup
        setTimeout(() => {
          document.removeEventListener('click', preventClick, true);
        }, 10);
      }

      draggedRef.current = false;
    };

    el.addEventListener('pointerdown', down);

    return () => {
      el.removeEventListener('pointerdown', down);
      // Clean up document listeners in case component unmounts during drag
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      ro.disconnect();
    };
  }, []);

  return { ref, draggingRef, draggedRef };
}

export {
  buildCastsWithContext,
  buildCastsWithConversationContext,
  getRenderableEmbeds,
  useHorizontalDragScroll,
};
