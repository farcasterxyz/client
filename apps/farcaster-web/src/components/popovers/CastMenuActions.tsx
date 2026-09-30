import {
  BookmarkIcon,
  BookmarkSlashIcon,
  CheckIcon,
  CircleSlashIcon,
  CopyIcon,
  EyeClosedIcon,
  InfoIcon,
  KebabHorizontalIcon,
  NorthStarIcon,
  PeopleIcon,
  PinIcon,
  PinSlashIcon,
  ReportIcon,
  ThumbsdownIcon,
  TrashIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getCastURL, NEYNAR_MINIAPP_URL } from 'farcaster-client-data';
import {
  CastClickType,
  CastReactionType,
  convertCastToCastShareContext,
  resolveUsername,
  resolveUsernameShort,
  useBanUserFromChannel,
  useBookmarkCast,
  useChannelCastAbilities,
  useDeleteCast,
  useDevToolsDomainsOwned,
  useDevToolsForceRefreshCastAttachments,
  useDownvoteCast,
  useMergeIntoGloballyCachedCast,
  usePinCastOnUserProfile,
  useRecordCastFeedback,
  useRemoveCastBookmark,
  useTrackCastClick,
  useTrackCastReaction,
  useTrackEvent,
  useUnpinCast,
  useUnpinCastOnUserProfile,
} from 'farcaster-client-hooks';
import { RotateCwIcon } from 'lucide-react';
import { FC, memo, Suspense, useCallback, useMemo, useState } from 'react';

import { RecastLabel } from '~/components/casts/RecastLabel';
import { SourceLabel } from '~/components/casts/SourceLabel';
import { InviteToChannelMenuItem } from '~/components/channels/InviteToChannelDropdownMenuItem';
import { ConfirmRemoveMemberModal } from '~/components/channelUsers/ManageChannelUserDropdown';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { NeynarIconThick } from '~/components/icons/NeynarIconThick';
import { PersonXIcon } from '~/components/icons/PersonXIcon';
import {
  ConfirmationModal,
  useConfirmationModal,
} from '~/components/modals/ConfirmationModal';
import { ConfirmBanFromChannelModal } from '~/components/modals/ConfirmBanFromChannelModal';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { PinCastModal } from '~/components/modals/PinCastModal';
import { ReportCastModal } from '~/components/modals/ReportCastModal';
import { UserVisibilityActions } from '~/components/popovers/UserVisibilityActions';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useCurrentRoute } from '~/hooks/navigation/useCurrentRoute';
import { useNavigateToAdminEngagementRingCandidates } from '~/hooks/navigation/useNavigateToAdminEngagementRingCandidates';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';
import { ApiCastWithContext } from '~/types';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type CastMenuActionsProps = {
  cast: ApiCastWithContext;
};

const CastMenuActions: FC<CastMenuActionsProps> = memo((props) => {
  return (
    <Suspense>
      <CastMenuActionsContent {...props} />
    </Suspense>
  );
});

const CastMenuActionsContent: FC<CastMenuActionsProps> = memo(
  ({ cast: { cast, context } }) => {
    const currentUserFid = useCachedCurrentUser()?.fid;
    const isAdmin = useIsAdmin();
    const navigateToAdminEngagementRingCandidates =
      useNavigateToAdminEngagementRingCandidates();
    const { launchMiniApp } = useMinimizableWindowContext();
    const trackCastClick = useTrackCastClick();
    const { developerModeEnabled } = useUserAppContext();
    const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();
    const unpinCast = useUnpinCast();
    const deleteCast = useDeleteCast();
    const downvoteCast = useDownvoteCast();
    const recordCastFeedback = useRecordCastFeedback();
    const { trackEvent } = useTrackEvent();
    const route = useCurrentRoute();
    const forceRefreshCastAttachments =
      useDevToolsForceRefreshCastAttachments();
    const { data: domainsOwned } = useDevToolsDomainsOwned({
      enabled: developerModeEnabled,
    });
    const [showConfirmRemoveMemberModal, setShowConfirmRemoveMemberModal] =
      useState(false);
    const [showConfirmHideModal, setShowConfirmHideModal] = useState(false);
    const [showConfirmWarnModal, setShowConfirmWarnModal] = useState(false);
    const [showCastInfoModal, setShowCastInfoModal] = useState(false);
    const [showEmbedDetailsModal, setShowEmbedDetailsModal] = useState(false);
    const [showReportCastModal, setShowReportCastModal] = useState(false);
    const [showPinCastModal, setShowPinCastModal] = useState(false);
    const [embedDetailsCopied, setEmbedDetailsCopied] = useState(false);
    // Derived from props/hooks — never user-toggled, so compute synchronously
    // to avoid stale `true` after deps change to an ineligible state.
    const showForceRefreshCastAttachmentsAction = useMemo(() => {
      // Admins can always trigger a refresh — useful when processing dropped
      // a URL embed entirely (e.g. transient OG fetch failure for a frame),
      // because in that state `cast.embeds.urls` is empty.
      if (isAdmin) {
        return true;
      }
      if (!cast.embeds?.urls.length) {
        return false;
      }
      if (currentUserFid === cast.author.fid) {
        return true;
      }
      return cast.embeds.urls.some(
        (url) =>
          url.openGraph.domain && domainsOwned?.includes(url.openGraph.domain),
      );
    }, [cast.embeds, domainsOwned, currentUserFid, cast.author.fid, isAdmin]);

    const channelKey = cast.channel?.key;

    const shouldShowPinToProfileOption = useMemo(() => {
      return (
        typeof currentUserFid !== 'undefined' &&
        cast.author.fid === currentUserFid
      );
    }, [cast.author.fid, currentUserFid]);

    const shouldHaveFeedCastRelatedActions = useMemo(() => {
      return typeof route !== 'undefined' && route.routeName === 'homeFeed';
    }, [route]);

    const viewerRole = useChannelModOrOwner(channelKey ?? '');
    const channelAbilities = useChannelCastAbilities({
      viewerFid: currentUserFid!,
      viewerRole,
      cast,
    });

    const trackCastAction = useCallback(
      (event: AnalyticsEvent) => {
        trackEvent(event, {
          castHash: cast.hash,
          castFid: cast.author.fid,
          castUsername: cast.author.username || cast.author.displayName,
          castChannelKey: cast?.channel?.key ?? 'no channel',
        });
      },
      [
        cast.author.displayName,
        cast.author.fid,
        cast.author.username,
        cast?.channel?.key,
        cast.hash,
        trackEvent,
      ],
    );

    const onPinCastClick = useCallback(async () => {
      if (!channelKey) {
        return;
      }

      if (context.isPinned) {
        try {
          trackCastAction(AnalyticsEvent.ClickUnpinCast);
          await unpinCast({ castHash: cast.hash, channelKey });

          toast({ message: 'Cast unpinned', type: 'success' });
        } catch (error) {
          trackError(error);
          toast({
            message: 'Error unpinning cast, please try again later',
            type: 'error',
          });
        }

        return;
      }

      setShowPinCastModal(true);
    }, [cast.hash, channelKey, context.isPinned, unpinCast, trackCastAction]);

    const pinCastOnUserProfile = usePinCastOnUserProfile();

    const unpinCastOnUserProfile = useUnpinCastOnUserProfile();

    const [showPinCastToProfileModal, setShowPinCastToProfileModal] =
      useState<boolean>(false);

    const onPinCastOnUserProfileClick = useCallback(async () => {
      if (cast.author.fid !== currentUserFid) {
        return;
      }

      if (cast.pinned) {
        trackCastAction(AnalyticsEvent.ClickUnpinCastFromProfile);

        unpinCastOnUserProfile({ cast });
      } else {
        setShowPinCastToProfileModal(true);
      }
    }, [cast, currentUserFid, trackCastAction, unpinCastOnUserProfile]);

    const onRemoveMember = useCallback(async () => {
      setShowConfirmRemoveMemberModal(true);
    }, []);

    const onInvestigateRingClick = useCallback(() => {
      navigateToAdminEngagementRingCandidates({ fid: cast.author.fid });
    }, [cast.author.fid, navigateToAdminEngagementRingCandidates]);

    const banUserFromChannel = useBanUserFromChannel();
    const banFromChannel = useCallback(async () => {
      if (!channelKey) {
        trackError(new Error('banFromChannel called without a channelKey'));
        return;
      }

      try {
        await banUserFromChannel({
          channelKey,
          banFid: cast.author.fid,
        });

        toast({
          message: (
            <>
              <span className="font-semibold">
                {resolveUsername(cast.author)}
              </span>{' '}
              was banned
            </>
          ),
          type: 'success',
        });
      } catch (e) {
        trackError(new Error('Failed to ban user from channel', { cause: e }));
        toast({
          message: (
            <>
              Failed to ban{' '}
              <span className="font-semibold">
                {resolveUsername(cast.author)}
              </span>
            </>
          ),
          type: 'error',
        });
      }
    }, [cast.author, channelKey, banUserFromChannel]);

    const confirmBanModal = useConfirmationModal({
      onConfirm: banFromChannel,
      extraData: {
        username: resolveUsername(cast.author),
        channelKey: channelKey ?? '',
      },
      ConfirmModal: ConfirmBanFromChannelModal,
    });

    const onHideCastClick = useCallback(async () => {
      setShowConfirmHideModal(true);
    }, []);

    const onDeleteCastClick = useCallback(async () => {
      try {
        // Can't delete if not self cast
        if (currentUserFid !== cast.author.fid) {
          return;
        }

        trackEvent(AnalyticsEvent.CastDelete, {
          castHash: cast.hash,
          castFid: cast.author.fid,
        });

        await deleteCast({ cast });

        toast({ message: 'Cast deleted', type: 'success' });
      } catch (error) {
        trackError(error);
        toast({
          message: 'Error deleting cast, please try again later',
          type: 'error',
        });
      }
    }, [cast, currentUserFid, deleteCast, trackEvent]);

    const onReportCastClick = useCallback(() => {
      setShowReportCastModal(true);
    }, []);

    const bookmarked = useMemo(() => {
      return cast.viewerContext?.bookmarked || false;
    }, [cast.viewerContext?.bookmarked]);
    const bookmarkCast = useBookmarkCast();
    const removeCastBookmark = useRemoveCastBookmark();
    const trackCastReaction = useTrackCastReaction();

    const onBookmarkMenuActionClick = useCallback(async () => {
      trackCastReaction({
        castHash: cast.hash,
        type: CastReactionType.Bookmark,
        undo: !!bookmarked,
        castFid: cast.author.fid,
        ...(context.includeReason?.type
          ? { includeReason: context.includeReason.type }
          : {}),
      });

      if (bookmarked) {
        try {
          await removeCastBookmark({ cast });

          toast({
            message: 'Removed from bookmarks',
            toastId: 'bookmarking-toast',
          });
        } catch (error) {
          // TODO: Add proper UI for error
          trackError(error);
          alert(error);
        }
      } else {
        try {
          await bookmarkCast({ cast });

          toast({
            message: 'Added to bookmarks',
            toastId: 'bookmarking-toast',
          });
        } catch (error) {
          // TODO: Add proper UI for error
          trackError(error);
          alert(error);
        }
      }
    }, [
      bookmarkCast,
      bookmarked,
      cast,
      context.includeReason?.type,
      removeCastBookmark,
      trackCastReaction,
    ]);

    const [castHashCopied, setCastHashCopied] = useState<boolean>(false);

    const copyCastHashToClipboard = useCallback(
      (e: Event) => {
        e.preventDefault();
        navigator.clipboard.writeText(cast.hash);
        setCastHashCopied(true);
        setTimeout(() => setCastHashCopied(false), 3000);
      },
      [cast.hash],
    );

    const onCastInfoClick = useCallback(() => {
      setShowCastInfoModal(true);
    }, []);

    const onEmbedDetailsClick = useCallback(() => {
      setShowEmbedDetailsModal(true);
    }, []);

    const copyEmbedDetailsToClipboard = useCallback(() => {
      navigator.clipboard.writeText(JSON.stringify(cast.embeds ?? {}, null, 2));
      setEmbedDetailsCopied(true);
      setTimeout(() => setEmbedDetailsCopied(false), 3000);
    }, [cast.embeds]);

    const onShowLessLikeThisClick = useCallback(async () => {
      toast({
        message: 'Fewer casts like this will appear in your home feed',
      });

      await recordCastFeedback({ castHash: cast.hash });

      trackEvent(AnalyticsEvent.ClickShowFewerLikeThis);
    }, [cast.hash, recordCastFeedback, trackEvent]);

    const combinedReasons = useMemo(() => {
      const reasons = [];

      if (cast.author.viewerContext?.following) {
        reasons.push({
          Component: (
            <div className="flex flex-row items-center">
              <div className="flex size-9 flex-row items-center justify-center rounded-full bg-overlay-light">
                <PeopleIcon size={18} className={'text-faint'} />
              </div>
              <div className="ml-2 text-base text-muted">
                You are following the cast author
              </div>
            </div>
          ),
        });
      }

      if (context.shouldShowRecastLabel) {
        reasons.push({
          Component: (
            <RecastLabel
              recasters={cast.recasts.recasters || []}
              isFocusedCast={false}
            />
          ),
        });
      }

      if (context.includeReason) {
        reasons.push({
          Component: (
            <SourceLabel
              includeReason={context.includeReason}
              isFocusedCast={false}
              castChannel={cast.channel}
            />
          ),
        });
      }

      if (reasons.length === 0) {
        reasons.push({
          Component: (
            <div className="flex flex-row items-center">
              <div className="flex size-9 flex-row items-center justify-center rounded-full bg-overlay-light">
                <NorthStarIcon size={18} className={'text-faint'} />
              </div>
              <div className="ml-2 text-base text-muted">Suggested author</div>
            </div>
          ),
        });
      }

      return reasons;
    }, [
      cast.author.viewerContext?.following,
      cast.channel,
      cast.recasts.recasters,
      context.includeReason,
      context.shouldShowRecastLabel,
    ]);

    const onForceRefreshCastAttachmentsClick = useCallback(async () => {
      try {
        const refreshedCast = await forceRefreshCastAttachments({
          hash: cast.hash,
        });
        mergeIntoGloballyCachedCast({ updates: refreshedCast });

        trackEvent(AnalyticsEvent.ClickRefreshCastEmbeds);
        toast({ message: 'Cast embeds refreshed' });
      } catch (error) {
        trackError(error);
        toast({
          message:
            'Error refreshing cast embeds. Only one refresh request per cast per day.',
          type: 'error',
        });
      }
    }, [
      cast,
      forceRefreshCastAttachments,
      mergeIntoGloballyCachedCast,
      trackEvent,
    ]);

    const onAskNeynarClick = useCallback(
      (_e: Event) => {
        const url = new URL(NEYNAR_MINIAPP_URL);
        url.searchParams.set('source', 'cast_button');
        url.searchParams.set(
          'cast_url',
          getCastURL({
            castUsername: cast.author?.username,
            castHash: cast.hash,
          }),
        );
        trackCastClick({
          type: CastClickType.NeynarMiniappCastButton,
          castHash: cast.hash,
        });
        trackEvent(AnalyticsEvent.ClickNeynarMiniappCastButton, {
          castHash: cast.hash,
        });
        launchMiniApp({
          context: convertCastToCastShareContext(cast),
          launchConfig: {
            type: 'standalone',
            url: url.toString(),
            name: 'Neynar',
          },
        });
      },
      [cast, launchMiniApp, trackCastClick, trackEvent],
    );

    return (
      <>
        <div className="flex flex-row items-center">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <div
                // ref={triggerRef}
                className="rounded-full px-1 text-muted hover:bg-gray-200"
                // onClick={onPopoverTriggerClick}
              >
                <KebabHorizontalIcon />
              </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              sideOffset={4}
              // alignOffset={-16}
              className="outline-hidden z-20 w-52 rounded-md p-1 shadow-lg bg-app border-default"
              onClick={(e) => e.stopPropagation()}
              // On close Dropdown trigger gets a focus making it work a bit wierd, disabling it for now.
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem
                name="Ask Neynar"
                icon={<NeynarIconThick size={16} />}
                onSelect={onAskNeynarClick}
              />
              <DropdownMenuItem
                name={bookmarked ? 'Unbookmark' : 'Bookmark'}
                icon={
                  bookmarked ? (
                    <BookmarkSlashIcon size={16} />
                  ) : (
                    <BookmarkIcon size={16} />
                  )
                }
                onSelect={onBookmarkMenuActionClick}
              />
              {currentUserFid !== cast.author.fid && (
                <>
                  {shouldHaveFeedCastRelatedActions && (
                    <>
                      <DropdownMenuItem
                        name="Why is this cast here?"
                        icon={<InfoIcon size="small" />}
                        onSelect={onCastInfoClick}
                      />
                      <DropdownMenuItem
                        name="Show fewer like this"
                        icon={<ThumbsdownIcon size="small" />}
                        onSelect={onShowLessLikeThisClick}
                      />
                    </>
                  )}
                </>
              )}
              {channelAbilities.canAddAsMember && channelKey && (
                <InviteToChannelMenuItem
                  invited={
                    cast.channel?.authorContext?.pendingRole === 'member'
                  }
                  fid={cast.author.fid}
                  channelKey={channelKey}
                  username={resolveUsernameShort(cast.author)}
                  restricted={cast.channel?.authorContext?.restricted}
                />
              )}
              {channelAbilities.canPinCast && (
                <DropdownMenuItem
                  name={
                    context.isPinned ? 'Unpin from channel' : 'Pin to channel'
                  }
                  icon={
                    context.isPinned ? (
                      <PinSlashIcon size="small" />
                    ) : (
                      <PinIcon size="small" />
                    )
                  }
                  onSelect={onPinCastClick}
                />
              )}
              {shouldShowPinToProfileOption && (
                <DropdownMenuItem
                  name={cast.pinned ? 'Unpin from profile' : 'Pin to profile'}
                  icon={
                    cast.pinned ? (
                      <PinSlashIcon size="small" />
                    ) : (
                      <PinIcon size="small" />
                    )
                  }
                  onSelect={onPinCastOnUserProfileClick}
                />
              )}
              <DropdownMenuItem
                name={castHashCopied ? 'Copied' : 'Copy cast hash'}
                icon={
                  castHashCopied ? (
                    <CheckIcon size={16} />
                  ) : (
                    <CopyIcon size={16} />
                  )
                }
                onSelect={copyCastHashToClipboard}
              />
              {showForceRefreshCastAttachmentsAction && (
                <DropdownMenuItem
                  name="Refresh embeds"
                  icon={<RotateCwIcon size="small" />}
                  onSelect={onForceRefreshCastAttachmentsClick}
                />
              )}
              {isAdmin && cast.embeds && (
                <DropdownMenuItem
                  name="View embed details"
                  icon={<InfoIcon size="small" />}
                  onSelect={onEmbedDetailsClick}
                />
              )}
              {isAdmin && (
                <DropdownMenuItem
                  name="Investigate ring"
                  icon={<NorthStarIcon size="small" />}
                  onSelect={onInvestigateRingClick}
                />
              )}
              {channelAbilities.canHideCast && (
                <DropdownMenuItem
                  name="Hide from channel"
                  icon={<EyeClosedIcon size="small" />}
                  onSelect={onHideCastClick}
                />
              )}
              {!channelAbilities.canHideCast && !channelKey && isAdmin && (
                <DropdownMenuItem
                  name="Hide"
                  icon={<EyeClosedIcon size="small" />}
                  onSelect={onHideCastClick}
                />
              )}
              <UserVisibilityActions user={cast.author} source="cast" />
              {currentUserFid !== cast.author.fid && (
                <DropdownMenuItem
                  name="Report cast"
                  icon={<ReportIcon size="small" />}
                  onSelect={onReportCastClick}
                  destructive
                />
              )}
              {channelAbilities.canRemoveAsMember && (
                <DropdownMenuItem
                  name="Remove member"
                  icon={<CircleSlashIcon size="small" />}
                  onSelect={onRemoveMember}
                  destructive
                />
              )}
              {channelAbilities.canBanFromChannel && (
                <DropdownMenuItem
                  name="Ban from channel"
                  icon={<PersonXIcon size={16} />}
                  onSelect={confirmBanModal.open}
                  destructive
                />
              )}
              {currentUserFid === cast.author.fid && (
                <DropdownMenuItem
                  name="Delete cast"
                  icon={<TrashIcon size="small" />}
                  onSelect={onDeleteCastClick}
                  destructive
                />
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
        {showConfirmHideModal && (
          <ConfirmationModal
            onCancel={() => {
              setShowConfirmHideModal(false);
            }}
            onConfirm={async () => {
              try {
                trackCastAction(AnalyticsEvent.ClickHideCast);
                await downvoteCast({
                  castHash: cast.hash,
                  channelKey,
                  downvote: true,
                });
                toast({ message: 'Cast hidden' });
              } catch (error) {
                trackError(error);
                toast({
                  message: 'Error hiding cast, please try again later',
                  type: 'error',
                });
              }
              setShowConfirmHideModal(false);
            }}
            title="Hide cast"
            confirmText="Hide"
          />
        )}
        {showConfirmWarnModal && (
          <ConfirmationModal
            onCancel={() => {
              setShowConfirmWarnModal(false);
            }}
            onConfirm={async () => {
              try {
                trackCastAction(AnalyticsEvent.ClickWarnAndHideCast);
                await downvoteCast({
                  castHash: cast.hash,
                  channelKey,
                  downvote: true,
                  isWarning: true,
                });
                toast({ message: 'Author warned & cast hidden' });
              } catch (error) {
                trackError(error);
                toast({
                  message:
                    'Error warning author & hiding cast, please try again later',
                  type: 'error',
                });
              }
              setShowConfirmWarnModal(false);
            }}
            title="Warn"
            confirmText="Warn"
            body="This will warn the cast author and hide the cast."
          />
        )}
        {showCastInfoModal && (
          <DefaultModalContainer
            onClose={() => {
              setShowCastInfoModal(false);
            }}
          >
            <div className="flex size-full flex-col items-center justify-center p-4">
              <div
                className="flex w-96 flex-col items-start justify-center rounded-lg p-4 bg-app border-default"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="flex size-full max-h-[75vh] flex-col justify-between space-y-5">
                  <span className="flex w-full flex-col items-start text-sm">
                    <div className="flex w-full flex-row items-center justify-between">
                      <span className="text-xl font-semibold text-default">
                        Why is this cast here?
                      </span>
                    </div>
                  </span>
                  <div className="scroll-vert flex w-full flex-col space-y-2 overflow-y-auto">
                    {combinedReasons.map(({ Component }, index) => (
                      <div key={index} className={classNames('text-sm')}>
                        {Component}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <DefaultButton
                      title="Return to feed"
                      className={classNames(
                        'flex flex-row items-center !justify-center space-x-1 px-[10px] py-[12px] !text-base !font-normal',

                        '!bg-[#7C65C1] hover:!bg-[#7C65C1F0]',
                      )}
                      onClick={() => {
                        setShowCastInfoModal(false);
                      }}
                    >
                      <span className="flex flex-row items-center">
                        <span className="text-light">Return to feed</span>
                      </span>
                    </DefaultButton>
                    <DefaultButton
                      title="Show fewer casts like this"
                      className="flex h-10 w-max flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-muted"
                      onClick={onShowLessLikeThisClick}
                    >
                      <span className="flex flex-row items-center">
                        <span className="">Show fewer casts like this</span>
                      </span>
                    </DefaultButton>
                  </div>
                </div>
              </div>
            </div>
          </DefaultModalContainer>
        )}
        {showEmbedDetailsModal && (
          <DefaultModalContainer
            className="fixed inset-0 z-30 bg-overlay"
            onClose={() => {
              setShowEmbedDetailsModal(false);
            }}
          >
            <div className="flex size-full flex-col items-center justify-center p-4">
              <div
                className="flex max-h-[80vh] w-[min(720px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg bg-app border-default"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="flex items-start justify-between gap-4 border-b p-4 border-default">
                  <div className="min-w-0">
                    <div className="text-xl font-semibold text-default">
                      Embed details
                    </div>
                    <div className="font-mono mt-1 break-all text-xs text-muted">
                      {cast.hash}
                    </div>
                  </div>
                  <DefaultButton
                    title={embedDetailsCopied ? 'Copied' : 'Copy embed details'}
                    className="shrink-0 px-3 py-2 text-sm"
                    onClick={copyEmbedDetailsToClipboard}
                  >
                    <span>{embedDetailsCopied ? 'Copied' : 'Copy JSON'}</span>
                  </DefaultButton>
                </div>
                <pre className="font-mono min-h-0 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-default">
                  {JSON.stringify(cast.embeds ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </DefaultModalContainer>
        )}
        {showReportCastModal && (
          <ReportCastModal
            onClose={() => setShowReportCastModal(false)}
            castHash={cast.hash}
            targetUser={cast.author}
          />
        )}
        {showPinCastModal && channelKey && (
          <PinCastModal
            onClose={() => setShowPinCastModal(false)}
            castHash={cast.hash}
            channelKey={channelKey}
          />
        )}
        {showConfirmRemoveMemberModal && channelKey && (
          <ConfirmRemoveMemberModal
            channelKey={channelKey}
            user={cast.author}
            close={() => setShowConfirmRemoveMemberModal(false)}
          />
        )}
        {showPinCastToProfileModal && (
          <ConfirmationModal
            onBackdropClose={() => {
              setShowPinCastToProfileModal(false);
            }}
            onCancel={() => {
              setShowPinCastToProfileModal(false);
            }}
            onConfirm={() => {
              trackCastAction(AnalyticsEvent.ClickPinCastToProfile);

              pinCastOnUserProfile({ cast });

              setShowPinCastToProfileModal(false);
            }}
            title="Pin this cast"
            confirmText="Pin"
            destructive={false}
            body={
              <>
                This will appear at the top of your profile and replace any
                previously pinned cast.
              </>
            }
          />
        )}
        {confirmBanModal.Component}
      </>
    );
  },
);

CastMenuActions.displayName = 'CastMenuActions';

export { CastMenuActions };
