import { XIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { ApiDirectCastMessageV3, ApiUser } from 'farcaster-client-data';
import { formatTimeAgo, resolveUsername } from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { Image } from '~/components/images/Image';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';

type RepliedDirectCastProps = {
  directCast: ApiDirectCastMessageV3;
  directCastSender: ApiUser;
  parentIsSelfDirectCast: boolean;
  renderingInMessage: boolean;
  composerMode: boolean;
  scrollToReply: (({ messageId }: { messageId: string }) => void) | undefined;
  dismissReply: (() => void) | undefined;
};

const RepliedDirectCast: React.FC<RepliedDirectCastProps> = ({
  directCast,
  directCastSender,
  renderingInMessage,
  composerMode,
  scrollToReply,
  dismissReply,
  parentIsSelfDirectCast: _,
}) => {
  const { fid: currentUserFid } = useCurrentUser();
  const selfDirectCast = directCast.senderFid === currentUserFid;

  const repliedDirectCastIsSelf = React.useMemo(() => {
    return directCast.senderFid === currentUserFid;
  }, [currentUserFid, directCast.senderFid]);

  const containsImageEmbeds = React.useMemo(
    () =>
      typeof directCast.metadata !== 'undefined' &&
      typeof directCast.metadata.medias !== 'undefined' &&
      directCast.metadata.medias.length !== 0,
    [directCast.metadata],
  );

  const onRepliedDirectCastClick = React.useCallback(() => {
    if (typeof scrollToReply === 'function') {
      scrollToReply({ messageId: directCast.messageId });
    }
  }, [directCast.messageId, scrollToReply]);

  const senderIsProUser = useUserLevel(directCastSender) === 'pro';

  return (
    <div
      className={cn([
        'relative',
        'mb-2 flex w-full flex-row rounded-md',
        typeof scrollToReply !== 'undefined' && 'cursor-pointer',
        renderingInMessage
          ? selfDirectCast
            ? 'bg-self-reply-direct-cast'
            : 'bg-reply-direct-cast'
          : 'bg-overlay-light',
      ])}
      onClick={onRepliedDirectCastClick}
    >
      <div
        className={cn([
          'w-2 rounded-l-md bg-reply-direct-cast-left-wrapper',
          selfDirectCast ? 'bg-self-reply-direct-cast' : 'bg-reply-direct-cast',
        ])}
      />
      <div className={cn(['flex w-full flex-col justify-start p-2'])}>
        <div
          className={cn([
            'mb-1 flex flex-row gap-x-1 text-xs font-semibold text-default',
          ])}
        >
          <Avatar
            user={directCastSender}
            className="relative mr-1"
            size="xs2"
          />
          <div className={cn(['opacity-75'])}>
            {repliedDirectCastIsSelf
              ? 'You'
              : resolveUsername({
                  username: directCastSender.username,
                  fid: directCastSender.fid,
                }).replace('@', '')}
          </div>
          {senderIsProUser && <FarcasterProBadge size={14} className="mb-px" />}
          <div className={cn('text-xs opacity-75 text-default')}>·</div>
          <div className={cn('text-xs opacity-75 text-default')}>
            {formatTimeAgo(directCast.serverTimestamp, 'floor')}
          </div>
        </div>
        <div
          className={cn([
            'line-clamp-2 break-gracefully',
            'text-default',
            containsImageEmbeds ? 'max-w-[20rem]' : 'max-w-[24rem]',
          ])}
        >
          {containsImageEmbeds &&
          typeof directCast.metadata !== 'undefined' &&
          typeof directCast.metadata.medias !== 'undefined'
            ? directCast.message.startsWith(
                directCast.metadata.medias[0].staticRaster,
              )
              ? directCast.message
                  .split(directCast.metadata.medias[0].staticRaster)[1]
                  .trim()
              : 'Photo'
            : directCast.message}
        </div>
      </div>
      {containsImageEmbeds &&
        typeof directCast.metadata !== 'undefined' &&
        typeof directCast.metadata.medias !== 'undefined' && (
          <div
            className={cn([
              'flex max-h-[64px] max-w-[64px] flex-col overflow-hidden',
            ])}
          >
            <Image
              alt={'Direct cast image embed'}
              className={'h-full rounded-r-md object-cover object-left-top'}
              src={directCast.metadata.medias[0].staticRaster}
            />
          </div>
        )}
      {composerMode && (
        <div
          className="absolute right-0 top-0 mr-1 mt-1 flex size-4 cursor-pointer items-center justify-center rounded-full bg-overlay-heavy"
          onClick={dismissReply}
        >
          <XIcon size={12} className="text-white" />
        </div>
      )}
    </div>
  );
};

export { RepliedDirectCast };
