import {
  CalendarIcon,
  KebabHorizontalIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
} from '@primer/octicons-react';
import * as Popover from '@radix-ui/react-popover';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCaststormDraft } from 'farcaster-client-data';
import {
  resolveUsername,
  useDiscardDraftCast,
  useDraftCaststormsWithRefreshOnMount,
  useThread,
} from 'farcaster-client-hooks';
import React from 'react';

import { CommentFillIcon } from '~/components/casts/actions/icons/CommentFillIcon';
import {
  getActiveDraftLocalDraftKey,
  setLocalDraft,
} from '~/components/composer/LocalDrafts';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { MenuItem } from '~/components/popovers/MenuItem';
import { popoverRootId } from '~/constants/popovers';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type NoDraftsEmptyStateProps = {};

const NoDraftsEmptyState: React.FC<NoDraftsEmptyStateProps> = React.memo(() => {
  return (
    <div className="m-auto flex w-[85%] flex-col items-center justify-center space-y-2 py-4 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="87"
        height="93"
        viewBox="0 0 87 93"
        fill="none"
      >
        <rect
          x="0.75"
          y="0.75"
          width="62.5"
          height="70.5"
          rx="9.25"
          stroke="#546473"
          strokeOpacity="0.2"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <rect
          x="23"
          y="21"
          width="64"
          height="72"
          rx="10"
          className="fill-app-light dark:fill-app-dark"
        />
        <rect
          x="23.75"
          y="21.75"
          width="62.5"
          height="70.5"
          rx="9.25"
          stroke="#546473"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
      </svg>
      <div className="text-default">No drafts yet</div>
      <div className="pb-2 text-sm text-faint">
        You can stash casts here to post later.
      </div>
    </div>
  );
});

type DraftsProps = {
  onEditClick: ({ draft }: { draft: ApiCaststormDraft }) => void;
};

const Drafts: React.FC<DraftsProps> = React.memo(({ onEditClick }) => {
  return (
    <React.Suspense
      fallback={
        <span className="flex h-[200px] w-full flex-row items-center justify-center py-8">
          <LoadingIndicator />
        </span>
      }
    >
      <DraftsContent onEditClick={onEditClick} />
    </React.Suspense>
  );
});

type DraftsContentProps = {
  onEditClick: ({ draft }: { draft: ApiCaststormDraft }) => void;
};

const DraftsContent: React.FC<DraftsContentProps> = React.memo(
  ({ onEditClick }) => {
    const { data, onEndReached, isFetchingNextPage, isLoading } =
      useDraftCaststormsWithRefreshOnMount();

    const drafts = React.useMemo(() => {
      return data?.pages.flatMap((o) => o.result.drafts) || [];
    }, [data?.pages]);

    const draftKeyExtractor = React.useCallback(
      (item: ApiCaststormDraft) => item.draftId,
      [],
    );

    const draftRenderItem = React.useCallback(
      ({ item, index }: { item: ApiCaststormDraft; index: number }) => {
        return (
          <Draft
            lastDraftInList={drafts.length - 1 === index}
            draft={item}
            onEditClick={() => {
              onEditClick({ draft: item });
            }}
          />
        );
      },
      [drafts.length, onEditClick],
    );

    return (
      <div className="flex min-h-[200px] flex-col justify-between pb-2 border-default">
        <FlatList
          data={drafts}
          keyExtractor={draftKeyExtractor}
          renderItem={draftRenderItem}
          emptyView={<NoDraftsEmptyState />}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage || isLoading}
          containerClassName="!animate-none max-h-[540px] overflow-y-auto scrollbar-vert"
        />
      </div>
    );
  },
);

type DraftReplyParentIndicatorProps = {
  parentCastHash: string;
};

const DraftReplyParentIndicator: React.FC<DraftReplyParentIndicatorProps> =
  React.memo(({ parentCastHash }) => {
    const { data } = useThread({ castHash: parentCastHash });

    const parentCast = React.useMemo(() => {
      return data?.pages
        .flatMap((page) => page.result.casts)
        .find((cast) => cast.hash === parentCastHash);
    }, [data, parentCastHash]);

    if (typeof parentCast === 'undefined') {
      return (
        <div className="flex flex-row items-center space-x-1 text-muted">
          <CommentFillIcon />
          <span className="text-sm text-muted">Reply</span>
        </div>
      );
    }

    return (
      <div className="flex flex-row items-center space-x-1 text-muted">
        <CommentFillIcon />
        <span className="text-sm text-muted">{`Replying to ${resolveUsername({
          username: parentCast.author.username,
          fid: parentCast.author.fid,
        })}`}</span>
      </div>
    );
  });

const DraftScheduledAtIndicator: React.FC = React.memo(() => {
  return (
    <div className="flex flex-row items-center space-x-1 text-muted">
      <CalendarIcon />
      <span className="text-sm text-muted">Scheduled</span>
    </div>
  );
});

type DraftProps = {
  lastDraftInList: boolean;
  draft: ApiCaststormDraft;
  onEditClick: () => void;
};

const Draft: React.FC<DraftProps> = ({
  lastDraftInList,
  draft,
  onEditClick,
}) => {
  const [optionsOpen, setOptionsOpen] = React.useState<boolean>(false);
  const popoverPortalContainer =
    document.getElementById(popoverRootId) ?? undefined;
  const { trackEvent } = useAnalytics();

  const discardDraftCast = useDiscardDraftCast();

  const onEditDraftClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();

      trackEvent(AnalyticsEvent.CastComposerDraftOpened, {
        hasChannel: Boolean(draft.channelKey),
        isReply: Boolean(draft.parent),
        isScheduled: Boolean(draft.scheduledAt),
        castCount: draft.casts.length,
      });
      onEditClick();
    },
    [draft, onEditClick, trackEvent],
  );

  const onDeleteDraftClick = React.useCallback(
    async (e: React.SyntheticEvent) => {
      e.stopPropagation();

      trackEvent(AnalyticsEvent.CastComposerDraftDeleted, {
        hasChannel: Boolean(draft.channelKey),
        isReply: Boolean(draft.parent),
        isScheduled: Boolean(draft.scheduledAt),
        castCount: draft.casts.length,
      });
      await discardDraftCast({
        draftId: draft.draftId,
        castChannelKey: undefined,
      });
      setLocalDraft(undefined, getActiveDraftLocalDraftKey(draft.draftId));
    },
    [discardDraftCast, draft, trackEvent],
  );

  const firstNonemptyCast = draft.casts.find((draft) => draft.text.trim());
  const firstNonemptyCastText = firstNonemptyCast?.text ?? '';
  const firstCastEmbeds = draft.casts[0].embeds;

  return (
    <div
      className={classNames(
        'flex cursor-pointer flex-row items-center justify-between p-2 border-default hover:bg-overlay-light',
        !lastDraftInList && 'border-b',
      )}
      onClick={onEditDraftClick}
    >
      <div className="flex flex-col">
        <div className="flex flex-row items-center gap-4">
          {typeof draft.parent !== 'undefined' && (
            <DraftReplyParentIndicator parentCastHash={draft.parent.hash} />
          )}
          {typeof draft.scheduledAt !== 'undefined' && (
            <DraftScheduledAtIndicator />
          )}
        </div>
        {typeof firstCastEmbeds !== 'undefined' && (
          <div className="flex flex-row items-center space-x-1 text-muted">
            <LinkIcon size={8} />
            <span className="text-sm text-muted">Contains attachments</span>
          </div>
        )}
        <div className="line-clamp-2 text-ellipsis text-base break-gracefully text-default">
          {firstNonemptyCastText}
        </div>
        {draft.channelKey && (
          <div className="text-sm text-faint">/{draft.channelKey}</div>
        )}
      </div>
      <Popover.Root
        modal={true}
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
      >
        <Popover.Trigger
          asChild
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex">
            <KebabHorizontalIcon
              size={12}
              className="rotate-90 cursor-pointer text-faint hover:text-default"
            />
          </div>
        </Popover.Trigger>
        <Popover.Portal container={popoverPortalContainer}>
          <Popover.Content
            className="outline-hidden z-20 flex w-max cursor-default flex-col rounded-md border p-1 shadow-lg bg-app border-default"
            side="bottom"
            sideOffset={4}
            align="end"
          >
            <MenuItem
              name="Edit"
              icon={<PencilIcon />}
              onClick={() => {
                setOptionsOpen(false);

                onEditClick();
              }}
            />
            <MenuItem
              name="Delete"
              icon={<TrashIcon />}
              onClick={(e) => {
                setOptionsOpen(false);

                onDeleteDraftClick(e);
              }}
              version="danger"
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export { Drafts };
