import * as Popover from '@radix-ui/react-popover';
import * as Portal from '@radix-ui/react-portal';
import cn from 'classnames';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
  ApiUser,
} from 'farcaster-client-data';
import {
  resolveUsername,
  useInvalidatePlaintextDirectCastReactions,
  usePlaintextDirectCastReactions,
  useRemoveReactionFromPlaintextDirectCast,
} from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { ReactionEmoji } from '~/components/directCasts/ReactionEmoji';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { FlatList } from '~/components/lists/FlatList';
import { UserDisplayNameWithBadges } from '~/components/users/UserDisplayNameWithBadges';
import { useDirectCastsScrollLocks } from '~/contexts/DirectCastsScrollLocksProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

type DirectCastReactionsPopoverProps = {
  children: React.ReactNode;
  directCast: ApiDirectCastMessageV3;
  conversation: ApiDirectCastConversationInfoV3;
  selfDirectCast: boolean;
  wrapperRef: React.Ref<{ forceOpen: () => void }>;
};

const DirectCastReactionsPopover: React.FC<DirectCastReactionsPopoverProps> =
  React.memo(
    ({ children, directCast, conversation, selfDirectCast, wrapperRef }) => {
      const { lock, unlock } = useDirectCastsScrollLocks();

      const [popoverOpen, setPopoverOpen] = React.useState<boolean>(false);

      React.useImperativeHandle(wrapperRef, () => {
        return {
          forceOpen: () => {
            setPopoverOpen(true);
          },
        };
      });

      const triggerRef = React.useRef<HTMLButtonElement>(null);

      const contentRef = React.useRef<HTMLDivElement>(null);

      const onContextMenu = React.useCallback(() => {
        setPopoverOpen(true);
      }, []);

      const onOpenChange = React.useCallback((open: boolean) => {
        // We are managing opens for this popover through the context menu event
        // hence we don't care about trigger opens, only close callbacks are
        // needed.
        if (!open) {
          setPopoverOpen(false);
        }
      }, []);

      React.useEffect(() => {
        if (popoverOpen) {
          lock({ conversationId: conversation.conversationId });
        } else {
          unlock({ conversationId: conversation.conversationId });
        }
      }, [conversation.conversationId, lock, popoverOpen, unlock]);

      React.useEffect(() => {
        const triggerRefCurrent = triggerRef.current;

        if (
          typeof triggerRefCurrent !== 'undefined' &&
          triggerRefCurrent !== null
        ) {
          triggerRefCurrent.addEventListener('contextmenu', onContextMenu);
        }

        return () => {
          if (
            typeof triggerRefCurrent !== 'undefined' &&
            triggerRefCurrent !== null
          ) {
            triggerRefCurrent.removeEventListener('contextmenu', onContextMenu);
          }
        };
      }, [onContextMenu]);

      return (
        <Popover.Root
          modal={true}
          open={popoverOpen}
          onOpenChange={onOpenChange}
        >
          <Popover.Trigger asChild ref={triggerRef} className="w-max">
            {children}
          </Popover.Trigger>
          <Portal.Root>
            <Popover.Content
              align={selfDirectCast ? 'end' : 'start'}
              className="outline-hidden min-w-[300px]"
              ref={contentRef}
            >
              <React.Suspense fallback={<></>}>
                <ReactionsPopoverContent
                  directCast={directCast}
                  conversation={conversation}
                />
              </React.Suspense>
            </Popover.Content>
          </Portal.Root>
        </Popover.Root>
      );
    },
  );

type ReactionsPopoverContentProps = {
  directCast: ApiDirectCastMessageV3;
  conversation: ApiDirectCastConversationInfoV3;
};

const ReactionsPopoverContent: React.FC<ReactionsPopoverContentProps> =
  React.memo(({ directCast, conversation }) => {
    const { fid } = useCurrentUser();

    const removeDirectCastReaction = useRemoveReactionFromPlaintextDirectCast();

    const invalidateReactions = useInvalidatePlaintextDirectCastReactions();
    const { data, fetchNextPage, isPending, refetch } =
      usePlaintextDirectCastReactions({
        fid,
        conversationId: directCast?.conversationId || '',
        messageId: directCast?.messageId || '',
      });

    const reactions = React.useMemo(() => {
      // This looks unnecessary, but it is entirely possible that someone may un-react,
      // then re-react, and we got caught in between page loads.
      return [
        ...new Map<string, { fid: number; reaction: string }>(
          (data?.pages.flatMap((p) => p.result.reactions) ?? []).map((r) => [
            r.fid + r.reaction,
            r,
          ]),
        ).values(),
      ];
    }, [data?.pages]);

    React.useEffect(() => {
      fetchNextPage();
    }, [
      data?.pages.length,
      directCast?.reactions.length,
      fetchNextPage,
      reactions.length,
    ]);

    const onRemoveReaction = React.useCallback(
      (reaction: string) => {
        removeDirectCastReaction({
          fid,
          conversationId: directCast.conversationId,
          messageId: directCast.messageId,
          reaction,
        });
        refetch({ cancelRefetch: false });
      },
      [
        removeDirectCastReaction,
        fid,
        directCast.conversationId,
        directCast.messageId,
        refetch,
      ],
    );

    React.useEffect(() => {
      if (directCast?.reactions.length !== reactions.length && !isPending) {
        invalidateReactions({
          fid,
          conversationId: directCast?.conversationId || '',
          messageId: directCast?.messageId || '',
        });
        refetch({ cancelRefetch: false });
      }
    }, [
      directCast?.conversationId,
      directCast?.messageId,
      directCast?.reactions.length,
      fid,
      invalidateReactions,
      isPending,
      reactions.length,
      refetch,
    ]);

    const users = React.useMemo(() => {
      const participants = conversation.participants;
      return new Map<number, ApiUser>(participants.map((p) => [p.fid, p]));
    }, [conversation]);

    return (
      <FlatList
        containerClassName="flex flex-col w-full scrollbar-vert overflow-y-scroll bg-app max-h-[300px] border border-default rounded-lg px-2"
        data={reactions}
        renderItem={({ item, index }) => {
          const user = users.get(item.fid)!;
          return (
            <div
              className={cn([
                'flex flex-row py-2',
                index === reactions.length - 1
                  ? 'border-0'
                  : 'border-b border-faint',
              ])}
            >
              <Avatar user={user} />
              <div className="flex grow flex-col justify-center pl-2">
                <LinkToProfile title={user.displayName} user={user}>
                  <UserDisplayNameWithBadges style="base" user={user} />
                  <div className="flex flex-row items-center">
                    <div className="mr-1 text-base text-faint">
                      {resolveUsername({
                        username: user.username,
                        fid: user.fid,
                      })}
                    </div>
                  </div>
                </LinkToProfile>
              </div>
              {user.fid === fid && (
                <div className="flex flex-col justify-center">
                  <DefaultButton
                    variant="link"
                    title="Remove"
                    onClick={() => onRemoveReaction(item.reaction)}
                    className="outline-hidden"
                  >
                    Remove
                  </DefaultButton>
                </div>
              )}
              <div className="flex flex-col justify-center">
                <ReactionEmoji reaction={item.reaction} />
              </div>
            </div>
          );
        }}
        keyExtractor={(e) => `dc-reaction-${e.fid}${e.reaction}`}
        emptyView={<div>No reactions yet</div>}
      />
    );
  });

export { DirectCastReactionsPopover };
