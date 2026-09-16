import {
  CircleSlashIcon,
  KebabHorizontalIcon,
  PinIcon,
  SmileyIcon,
} from '@primer/octicons-react';
import classNames from 'classnames';
import {
  type ApiDirectCastConversationInfoV3,
  type ApiDirectCastMessageV3,
  ApiMediaV2,
} from 'farcaster-client-data';
import {
  assertDirectCastMessageTypeOrThrow,
  determineEmbedRenders,
  resolveUsername,
} from 'farcaster-client-hooks';
import React from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { DirectCastReactionsPopover } from '~/components/modals/DirectCastReactionsPopover';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useDirectCastCheckmarks } from '~/hooks/directCasts/useDirectCastCheckmarks';
import { useDirectCastFormattedTimestamp } from '~/hooks/directCasts/useDirectCastFormattedTimestamp';
import { useDirectCastText } from '~/hooks/directCasts/useDirectCastText';
import {
  hideDirectCastUrlEmbedForViewer,
  isDirectCastUrlEmbedHidden,
} from '~/utils/directCastUrlEmbedPreviewStorage';

import { AnnouncementDirectCast } from './AnnouncementDirectCast';
import { DirectCastAvatar } from './DirectCastAvatar';
import { DirectCastReactionContextMenu } from './DirectCastReactionContextMenu';
import { DirectCastReactions } from './DirectCastReactions';
import { DirectCastRichAnnouncementCTA } from './DirectCastRichAnnouncementCTA';
import { DirectCastCastEmbeds } from './embeds/DirectCastCastEmbeds';
import { DirectCastGroupInvites } from './embeds/DirectCastGroupInvites';
import { DirectCastImageEmbed } from './embeds/DirectCastImageEmbed';
import { DirectCastURLEmbeds } from './embeds/DirectCastURLEmbeds';
import { DirectCastVideoEmbed } from './embeds/DirectCastVideoEmbed';
import { NewMessagesMarker } from './NewMessagesMarker';
import { NotSupportedDirectCast } from './NotSupportedDirectCast';
import { RepliedDirectCast } from './RepliedDirectCast';
import { TimelineDateMarker } from './TimelineDateMarker';

type DirectCastProps = {
  directCast: ApiDirectCastMessageV3;
  conversation: ApiDirectCastConversationInfoV3;
  readOnly?: boolean;
  shouldCollapseAbove: boolean;
  shouldCollapseBelow: boolean;
  shouldOmitMarginBelow: boolean;
  shouldRenderNewMessageMarker: boolean;
  shouldShowDateMarker: boolean;
  showAvatar: boolean;
  setReplyTo: (replyTo: ApiDirectCastMessageV3 | undefined) => void;
  scrollToReply: ({ messageId }: { messageId: string }) => void;
};

const DirectCast: React.FC<DirectCastProps> = React.memo(
  ({
    directCast,
    conversation,
    readOnly = false,
    shouldCollapseAbove,
    shouldCollapseBelow,
    shouldOmitMarginBelow,
    shouldRenderNewMessageMarker,
    shouldShowDateMarker,
    showAvatar,
    setReplyTo,
    scrollToReply,
  }) => {
    const { fid: currentUserFid } = useCurrentUser();

    const selfDirectCast = directCast.senderFid === currentUserFid;

    const checkmarks = useDirectCastCheckmarks({
      directCast,
      conversation,
      applyInboxStyles: false,
    });

    const formattedTimestamp = useDirectCastFormattedTimestamp({
      selfDirectCast,
      timestamp: directCast.serverTimestamp,
      hasUnread: false,
      applyInboxStyles: false,
      muted: false,
    });

    const { text } = useDirectCastText({
      conversation,
      directCast,
      applyInboxStyles: false,
    });

    const possiblyTitleText = React.useMemo(() => {
      if (
        typeof directCast.payload === 'undefined' ||
        directCast.payload.type !== 'rich_announcement'
      ) {
        return undefined;
      }

      return directCast.payload.payload.title;
    }, [directCast.payload]);

    const MetadataFooter = React.useMemo(() => {
      return (
        <>
          <div className="mb-[2px] ml-2 inline-flex space-x-1 text-right opacity-0">
            {directCast.isPinned && (
              <div className="flex flex-row items-center">
                <PinIcon size={10} />
              </div>
            )}
            {formattedTimestamp}
            {checkmarks}
          </div>
          <div className="absolute bottom-[-4pt] right-[-2pt] mb-[2px] ml-2 inline-flex space-x-1 text-right">
            {directCast.isPinned && (
              <div className="flex flex-row items-center">
                <PinIcon size={10} />
              </div>
            )}
            {formattedTimestamp}
            {checkmarks}
          </div>
        </>
      );
    }, [checkmarks, directCast.isPinned, formattedTimestamp]);

    const { renderEmbedType: baseEmbedType } = determineEmbedRenders({
      directCast,
    });

    const [urlEmbedHiddenLocally, setUrlEmbedHiddenLocally] = React.useState(
      () => isDirectCastUrlEmbedHidden(directCast.messageId),
    );

    React.useEffect(() => {
      const onHidden = (ev: Event) => {
        const detail = (ev as CustomEvent<{ messageId: string }>).detail;
        if (detail?.messageId === directCast.messageId) {
          setUrlEmbedHiddenLocally(true);
        }
      };
      window.addEventListener('dc-url-embed-hidden', onHidden);
      return () => window.removeEventListener('dc-url-embed-hidden', onHidden);
    }, [directCast.messageId]);

    const renderEmbedType =
      baseEmbedType === 'url' && urlEmbedHiddenLocally
        ? undefined
        : baseEmbedType;

    const hideUrlPreviewForViewer = React.useCallback(() => {
      if (baseEmbedType !== 'url' || urlEmbedHiddenLocally) {
        return;
      }
      hideDirectCastUrlEmbedForViewer(directCast.messageId);
      setUrlEmbedHiddenLocally(true);
    }, [baseEmbedType, directCast.messageId, urlEmbedHiddenLocally]);

    const castEmbeds = React.useMemo(() => {
      if (
        typeof directCast.metadata === 'undefined' ||
        typeof directCast.metadata.casts === 'undefined'
      ) {
        return [];
      }

      return directCast.metadata.casts;
    }, [directCast.metadata]);

    const urlEmbeds = React.useMemo(() => {
      if (
        typeof directCast.metadata === 'undefined' ||
        typeof directCast.metadata.urls === 'undefined'
      ) {
        return [];
      }

      return directCast.metadata.urls;
    }, [directCast.metadata]);

    const mediaEmbeds = React.useMemo(() => {
      if (
        typeof directCast.payload !== 'undefined' &&
        directCast.payload.type === 'rich_announcement' &&
        directCast.payload.payload.imageUrl
      ) {
        return [
          {
            version: '2',
            height: 600,
            width: 600,
            staticRaster: directCast.payload.payload.imageUrl,
          } satisfies ApiMediaV2,
        ];
      }

      if (
        typeof directCast.metadata === 'undefined' ||
        typeof directCast.metadata.medias === 'undefined'
      ) {
        return [];
      }

      return directCast.metadata.medias;
    }, [directCast.metadata, directCast.payload]);

    const videoEmbeds = React.useMemo(() => {
      if (
        typeof directCast.metadata === 'undefined' ||
        typeof directCast.metadata.videos === 'undefined'
      ) {
        return [];
      }

      return directCast.metadata.videos;
    }, [directCast.metadata]);

    const groupInviteEmbeds = React.useMemo(() => {
      if (
        typeof directCast.metadata === 'undefined' ||
        typeof directCast.metadata.groupInvites === 'undefined'
      ) {
        return [];
      }

      return directCast.metadata.groupInvites;
    }, [directCast.metadata]);

    const shouldNotRenderTheDirectCastBody = React.useMemo(() => {
      const trimmedMessage = directCast.message.trim();

      if (mediaEmbeds.length === 1) {
        const mediaEmbed = mediaEmbeds[0].staticRaster;
        return mediaEmbed === trimmedMessage;
      }

      if (videoEmbeds.length === 1) {
        const videoEmbed = videoEmbeds[0].sourceUrl;
        return videoEmbed === trimmedMessage;
      }

      return false;
    }, [directCast.message, mediaEmbeds, videoEmbeds]);

    const shouldShowUserDisplayName = React.useMemo(() => {
      return (
        conversation.isGroup &&
        !selfDirectCast &&
        ((!shouldCollapseAbove && shouldCollapseBelow) ||
          (!shouldCollapseAbove && !shouldCollapseBelow))
      );
    }, [
      conversation.isGroup,
      selfDirectCast,
      shouldCollapseAbove,
      shouldCollapseBelow,
    ]);

    const sender = React.useMemo(
      () =>
        conversation.participants.find(
          ({ fid }) => fid === directCast.senderFid,
        ),
      [conversation.participants, directCast.senderFid],
    );

    const senderIsProUser = useUserLevel(sender) === 'pro';

    const repliedSender = React.useMemo(() => {
      return conversation.participants.find(
        ({ fid }) => fid === directCast.inReplyTo?.senderFid,
      );
    }, [conversation.participants, directCast.inReplyTo?.senderFid]);

    const [showContextMenu, setShowContextMenu] = React.useState(false);
    const [showReactionMenu, setShowReactionMenu] = React.useState(false);

    const [imageExpanded, setImageExpanded] = React.useState(false);

    const reactionsRef = React.useRef<HTMLDivElement>(null);

    const reactionsPopoverRef = React.useRef<{ forceOpen: () => void }>(null);

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
      if (imageExpanded) {
        return;
      }

      e.preventDefault();

      if (
        reactionsRef.current &&
        reactionsRef.current.contains(e.target as Node)
      ) {
        // This is handled by the reacions context menu popover
      } else {
        setShowContextMenu(true);
      }
    };

    if (typeof sender === 'undefined') {
      return null;
    }

    try {
      assertDirectCastMessageTypeOrThrow({ type: directCast.type });
    } catch {
      return (
        <>
          {shouldShowDateMarker && (
            <TimelineDateMarker
              messageServerTimestamp={directCast.serverTimestamp}
            />
          )}
          <NotSupportedDirectCast />
          {shouldRenderNewMessageMarker && <NewMessagesMarker />}
        </>
      );
    }

    const announcementTypeSet = new Set([
      'pin_message',
      'group_membership_addition',
      'group_membership_removal',
      'group_name_change',
      'message_ttl_change',
    ]);

    if (announcementTypeSet.has(directCast.type)) {
      return (
        <>
          {shouldShowDateMarker && (
            <TimelineDateMarker
              messageServerTimestamp={directCast.serverTimestamp}
            />
          )}
          <AnnouncementDirectCast text={text} />
          {shouldRenderNewMessageMarker && <NewMessagesMarker />}
        </>
      );
    }

    if (directCast.type === 'rich_announcement') {
      return (
        <>
          {shouldShowDateMarker && (
            <TimelineDateMarker
              messageServerTimestamp={directCast.serverTimestamp}
            />
          )}
          <div
            className={classNames([
              'group flex max-w-[85%]',
              selfDirectCast ? 'flex-row-reverse' : 'flex-row',
              selfDirectCast ? 'self-end' : 'self-start',
              shouldCollapseBelow
                ? 'mb-1'
                : shouldOmitMarginBelow
                  ? 'mb-0'
                  : 'mb-3',
            ])}
            onContextMenu={handleContextMenu}
          >
            <div className="flex flex-col">
              <div
                className={classNames([
                  'flex',
                  selfDirectCast ? 'flex-row-reverse' : 'flex-row',
                ])}
              >
                {showAvatar && !shouldCollapseAbove && (
                  <DirectCastAvatar user={sender} className="mr-2 mt-px" />
                )}
                {showAvatar && shouldCollapseAbove && (
                  <DirectCastAvatar user={sender} className="mr-2" hide />
                )}
                <div className={classNames('flex flex-col')}>
                  <span
                    id="w-dc-message"
                    className={classNames(
                      'rounded-lg text-default',
                      selfDirectCast ? 'bg-self-direct-cast' : 'bg-direct-cast',
                    )}
                  >
                    {shouldShowUserDisplayName && (
                      <LinkToProfileWithSummaryTooltip
                        title={sender.displayName}
                        user={sender}
                      >
                        <div
                          className={classNames(
                            'text-sm !font-semibold text-link hover:underline',
                            typeof renderEmbedType === 'undefined'
                              ? 'p-2 pb-0'
                              : 'p-2 pb-2',
                          )}
                        >
                          {resolveUsername({
                            username: sender.username,
                            fid: sender.fid,
                          }).replace('@', '')}
                        </div>
                      </LinkToProfileWithSummaryTooltip>
                    )}
                    {renderEmbedType === 'image' && (
                      <DirectCastImageEmbed
                        conversation={conversation}
                        shouldRenderMetadataFooter={
                          shouldNotRenderTheDirectCastBody
                        }
                        directCast={directCast}
                        mediaEmbeds={mediaEmbeds}
                        shouldShowUserDisplayName={shouldShowUserDisplayName}
                        senderDisplayName={sender.displayName}
                        senderFid={sender.fid}
                        senderUsername={sender.username}
                        selfDirectCast={selfDirectCast}
                        onExpandedStateChange={setImageExpanded}
                        wrapperHasContentAboveEmbed={shouldShowUserDisplayName}
                      />
                    )}
                    {!shouldNotRenderTheDirectCastBody && (
                      <div className={classNames(['flex flex-row p-2'])}>
                        <pre className="relative grow justify-stretch place-self-start whitespace-pre-wrap font-sans text-[.95rem] leading-[1.3rem] break-gracefully">
                          {typeof possiblyTitleText !== 'undefined' && (
                            <span className="mb-1 flex font-semibold">
                              {possiblyTitleText}
                            </span>
                          )}
                          {text}
                          {MetadataFooter}
                        </pre>
                      </div>
                    )}
                    {typeof directCast.payload !== 'undefined' &&
                      directCast.payload.type === 'rich_announcement' && (
                        <DirectCastRichAnnouncementCTA
                          payload={directCast.payload.payload}
                        />
                      )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {shouldRenderNewMessageMarker && <NewMessagesMarker />}
        </>
      );
    }

    return (
      <>
        {shouldShowDateMarker && (
          <TimelineDateMarker
            messageServerTimestamp={directCast.serverTimestamp}
          />
        )}
        <div
          className={classNames([
            'group flex max-w-[85%]',
            selfDirectCast ? 'flex-row-reverse' : 'flex-row',
            selfDirectCast ? 'self-end' : 'self-start',
            shouldCollapseBelow
              ? 'mb-1'
              : shouldOmitMarginBelow
                ? 'mb-0'
                : 'mb-3',
          ])}
          onContextMenu={handleContextMenu}
        >
          <div className="flex min-w-0 flex-col">
            <div
              className={classNames([
                'flex',
                selfDirectCast ? 'flex-row-reverse' : 'flex-row',
              ])}
            >
              {showAvatar && !shouldCollapseAbove && (
                <DirectCastAvatar user={sender} className="mr-2 mt-px" />
              )}
              {showAvatar && shouldCollapseAbove && (
                <DirectCastAvatar user={sender} className="mr-2" hide />
              )}
              <div className={classNames('flex min-w-0 flex-col')}>
                <span
                  id="w-dc-message"
                  className={classNames(
                    'rounded-lg text-default',
                    selfDirectCast ? 'bg-self-direct-cast' : 'bg-direct-cast',
                  )}
                >
                  {shouldShowUserDisplayName && (
                    <div
                      className={classNames(
                        'flex h-[22px] w-full min-w-0 flex-row items-center gap-1',
                        typeof renderEmbedType === 'undefined'
                          ? 'p-2 pb-0'
                          : 'p-2 pb-3 pt-4',
                      )}
                    >
                      <LinkToProfileWithSummaryTooltip
                        title={sender.username || ''}
                        user={sender}
                      >
                        <div
                          className={classNames(
                            'text-sm !font-semibold text-direct-casts-username hover:underline',
                          )}
                        >
                          {resolveUsername({
                            username: sender.username,
                            fid: sender.fid,
                          }).replace('@', '')}
                        </div>
                      </LinkToProfileWithSummaryTooltip>
                      {senderIsProUser && (
                        <FarcasterProBadge size={18} className="mb-px" />
                      )}
                    </div>
                  )}
                  {renderEmbedType === 'cast' && (
                    <DirectCastCastEmbeds
                      conversation={conversation}
                      directCast={directCast}
                      castEmbeds={castEmbeds}
                      wrapperHasContentAboveEmbed={shouldShowUserDisplayName}
                    />
                  )}
                  {renderEmbedType === 'url' && (
                    <DirectCastURLEmbeds
                      embeds={urlEmbeds}
                      conversation={conversation}
                      directCast={directCast}
                      wrapperHasContentAboveEmbed={shouldShowUserDisplayName}
                    />
                  )}
                  {renderEmbedType === 'image' && (
                    <DirectCastImageEmbed
                      conversation={conversation}
                      shouldRenderMetadataFooter={
                        shouldNotRenderTheDirectCastBody
                      }
                      directCast={directCast}
                      mediaEmbeds={mediaEmbeds}
                      shouldShowUserDisplayName={shouldShowUserDisplayName}
                      senderDisplayName={sender.displayName}
                      senderFid={sender.fid}
                      senderUsername={sender.username}
                      selfDirectCast={selfDirectCast}
                      onExpandedStateChange={setImageExpanded}
                      wrapperHasContentAboveEmbed={shouldShowUserDisplayName}
                    />
                  )}
                  {renderEmbedType === 'video' && (
                    <DirectCastVideoEmbed
                      conversation={conversation}
                      shouldRenderMetadataFooter={
                        shouldNotRenderTheDirectCastBody
                      }
                      directCast={directCast}
                      shouldShowUserDisplayName={shouldShowUserDisplayName}
                      senderDisplayName={sender.displayName}
                      senderFid={sender.fid}
                      senderUsername={sender.username}
                      selfDirectCast={selfDirectCast}
                      onExpandedStateChange={setImageExpanded}
                      wrapperHasContentAboveEmbed={shouldShowUserDisplayName}
                    />
                  )}
                  {renderEmbedType === 'group-invite' && (
                    <DirectCastGroupInvites groupInvites={groupInviteEmbeds} />
                  )}
                  {!shouldNotRenderTheDirectCastBody && (
                    <div className={classNames(['flex flex-row p-2'])}>
                      <pre className="relative grow justify-stretch place-self-start whitespace-pre-wrap font-sans text-[.95rem] leading-[1.3rem] break-gracefully">
                        <>
                          {directCast.inReplyTo &&
                            repliedSender &&
                            !directCast.isDeleted && (
                              <RepliedDirectCast
                                directCast={directCast.inReplyTo}
                                composerMode={false}
                                directCastSender={repliedSender}
                                dismissReply={undefined}
                                scrollToReply={scrollToReply}
                                parentIsSelfDirectCast={selfDirectCast}
                                renderingInMessage={true}
                              />
                            )}
                          {directCast.isDeleted ? (
                            <span
                              className={classNames(
                                'flex flex-row items-center italic',
                                selfDirectCast
                                  ? 'text-[#C7D1DB]'
                                  : 'text-muted',
                              )}
                            >
                              <CircleSlashIcon className="mr-1" />
                              {text}
                            </span>
                          ) : (
                            text
                          )}
                          {MetadataFooter}
                        </>
                      </pre>
                    </div>
                  )}
                </span>
                {directCast.reactions.length > 0 && (
                  <span
                    className={classNames(
                      'flex w-full',
                      !selfDirectCast ? 'flex-row' : 'flex-row-reverse',
                    )}
                  >
                    <DirectCastReactionsPopover
                      directCast={directCast}
                      conversation={conversation}
                      selfDirectCast={selfDirectCast}
                      wrapperRef={reactionsPopoverRef}
                    >
                      <div ref={reactionsRef}>
                        <DirectCastReactions
                          directCast={directCast}
                          onCollapsedStateClick={() => {
                            if (
                              typeof reactionsPopoverRef.current !==
                                'undefined' &&
                              reactionsPopoverRef.current !== null
                            ) {
                              reactionsPopoverRef.current.forceOpen();
                            }
                          }}
                        />
                      </div>
                    </DirectCastReactionsPopover>
                  </span>
                )}
              </div>
              {!readOnly && !directCast.isDeleted && (
                <div className="flex flex-row items-center">
                  <DirectCastReactionContextMenu
                    directCast={directCast}
                    conversation={conversation}
                    setReplyTo={setReplyTo}
                    open={showContextMenu || showReactionMenu}
                    onClose={() => {
                      setShowContextMenu(false);
                      setShowReactionMenu(false);
                    }}
                    mode={showReactionMenu ? 'emoji-reactions-only' : 'default'}
                    hideUrlPreviewForViewer={
                      baseEmbedType === 'url' && !urlEmbedHiddenLocally
                        ? hideUrlPreviewForViewer
                        : undefined
                    }
                  >
                    <div
                      className={classNames(
                        'hover:text-muted-light flex cursor-pointer items-center space-x-2 opacity-0 transition-all group-hover:opacity-100',
                        selfDirectCast
                          ? 'mr-2 flex-row-reverse space-x-reverse'
                          : 'ml-2 flex-row',
                        directCast.reactions.length !== 0 && 'mb-8',
                      )}
                    >
                      <span onClick={() => setShowReactionMenu(true)}>
                        <SmileyIcon size={14} className="mt-0.5 text-muted" />
                      </span>
                      <span onClick={() => setShowContextMenu(true)}>
                        <KebabHorizontalIcon
                          size={14}
                          className="mt-0.5 text-muted"
                        />
                      </span>
                    </div>
                  </DirectCastReactionContextMenu>
                </div>
              )}
            </div>
          </div>
        </div>
        {shouldRenderNewMessageMarker && <NewMessagesMarker />}
      </>
    );
  },
);

DirectCast.displayName = 'DirectCast';

export { DirectCast };
