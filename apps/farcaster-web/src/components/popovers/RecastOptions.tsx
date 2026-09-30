import { PencilIcon, SyncIcon } from '@primer/octicons-react';
import * as Popover from '@radix-ui/react-popover';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  CastReactionType,
  useCreateRecast,
  useProcessCastAttachments,
  useSetCastAttachmentPreviewCache,
  useTrackCastReaction,
  useUndoRecast,
} from 'farcaster-client-hooks';
import { FC, memo, useCallback, useEffect, useState } from 'react';

import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { MenuItem } from '~/components/popovers/MenuItem';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { trackError } from '~/utils/errorUtils';

type RecastOptionsProps = {
  cast: ApiCast;
  includeReason?: ApiCastFeedIncludeReason['type'];
  children: React.ReactNode;
};

const RecastOptions: FC<RecastOptionsProps> = memo(
  ({ children, cast, includeReason }) => {
    const { trackEvent } = useAnalytics();

    const [open, setOpen] = useState<boolean>(false);
    const [showCastComposer, setShowCastComposer] = useState<boolean>(false);

    const closePopover = useCallback(() => {
      setOpen(false);
    }, []);

    return (
      <>
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger className="h-full">
            <div
              className={
                'group flex w-9 cursor-pointer flex-row items-center justify-center text-sm text-faint'
              }
              onClick={(e) => {
                e.stopPropagation();

                trackEvent(
                  AnalyticsEvent.ShowRecastOrQuoteCastPrompt,
                  undefined,
                );

                setOpen(true);
              }}
              onBlur={() => {
                setOpen(false);
              }}
            >
              {children}
            </div>
          </Popover.Trigger>
          <Popover.Portal
            container={document.getElementById('popover-root') || undefined}
          >
            <Popover.Content
              className={`outline-hidden z-50 flex w-48 flex-col rounded-md border shadow-lg bg-app border-default`}
              side="bottom"
              sideOffset={4}
              align="start"
            >
              <RecastOptionsPopoverContent
                cast={cast}
                includeReason={includeReason}
                closePopover={closePopover}
                showCastComposer={() => {
                  setShowCastComposer(true);
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {showCastComposer && (
          <ComposeCastModal
            intent={{
              embeds: [cast.hash],
              ...(includeReason ? { includeReason } : {}),
            }}
            onClose={() => {
              setShowCastComposer(false);
            }}
          />
        )}
      </>
    );
  },
);

type RecastOptionsPopoverContentProps = {
  cast: ApiCast;
  includeReason?: ApiCastFeedIncludeReason['type'];
  closePopover: () => void;
  showCastComposer: () => void;
};

const RecastOptionsPopoverContent: React.FC<
  RecastOptionsPopoverContentProps
> = ({ cast, includeReason, closePopover, showCastComposer }) => {
  const currentUser = useCurrentUser();
  const includeReasonType = includeReason;

  const trackCastReaction = useTrackCastReaction();

  const createRecast = useCreateRecast();
  const undoRecast = useUndoRecast();

  const processCastAttachment = useProcessCastAttachments();
  const setCastAttachmentPreviewCache = useSetCastAttachmentPreviewCache();

  const isRecasted = !!cast.viewerContext?.recast;

  const onRecastClick = useCallback(
    async (e: React.SyntheticEvent) => {
      e.stopPropagation();

      trackCastReaction({
        castHash: cast.hash,
        type: CastReactionType.Recast,
        undo: isRecasted,
        castFid: cast.author.fid,
        ...(includeReasonType ? { includeReason: includeReasonType } : {}),
      });

      try {
        closePopover();

        if (isRecasted) {
          await undoRecast({
            cast,
            viewerFid: currentUser.fid,
          });
        } else {
          await createRecast({
            cast,
            viewerFid: currentUser.fid,
            viewerUsername: currentUser.username,
            viewerDisplayName: currentUser.displayName,
          });
        }
      } catch (error) {
        trackError(error);
        alert(error);
      }
    },
    [
      cast,
      createRecast,
      undoRecast,
      currentUser.displayName,
      currentUser.fid,
      currentUser.username,
      trackCastReaction,
      isRecasted,
      closePopover,
      includeReasonType,
    ],
  );

  const onQuoteClick = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();

      closePopover();

      showCastComposer();
    },
    [closePopover, showCastComposer],
  );

  const prefetchCastAssetAttachmentPreview = useCallback(async () => {
    const data = await processCastAttachment({
      text: '',
      embeds: [cast.hash],
    });
    setCastAttachmentPreviewCache({
      embeds: data.result.embeds,
    });
  }, [cast.hash, processCastAttachment, setCastAttachmentPreviewCache]);

  useEffect(() => {
    prefetchCastAssetAttachmentPreview();
  }, [prefetchCastAssetAttachmentPreview]);

  return (
    <>
      <MenuItem
        name={isRecasted ? 'Undo recast' : 'Recast'}
        icon={<SyncIcon size={16} className={'text-faint'} />}
        onClick={onRecastClick}
      />
      <MenuItem
        name="Quote"
        icon={<PencilIcon size={16} className={'text-faint'} />}
        onClick={onQuoteClick}
      />
    </>
  );
};

RecastOptions.displayName = 'RecastOptions';

export { RecastOptions };
