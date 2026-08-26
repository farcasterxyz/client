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
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { ReactionEmoji } from '~/components/directCasts/ReactionEmoji';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { FlatList } from '~/components/lists/FlatList';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { UserDisplayNameWithBadges } from '~/components/users/UserDisplayNameWithBadges';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

type DirectCastReactionsModalProps = {
  onClose: () => void;
  directCast: ApiDirectCastMessageV3;
  conversation: ApiDirectCastConversationInfoV3;
};

const DirectCastReactionsModal: FC<DirectCastReactionsModalProps> = memo(
  ({ onClose, directCast, conversation }) => {
    const { fid } = useCurrentUser();
    const invalidateReactions = useInvalidatePlaintextDirectCastReactions();
    const { data, fetchNextPage, isPending, refetch } =
      usePlaintextDirectCastReactions({
        fid,
        conversationId: directCast?.conversationId || '',
        messageId: directCast?.messageId || '',
      });
    const [selectedReaction, setSelectedReaction] = useState<string>('All');
    const removeDirectCastReaction = useRemoveReactionFromPlaintextDirectCast();

    const reactions = useMemo(() => {
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

    useEffect(() => {
      fetchNextPage();
    }, [
      data?.pages.length,
      directCast?.reactions.length,
      fetchNextPage,
      reactions.length,
    ]);

    const onRemoveReaction = useCallback(
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

    useEffect(() => {
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

    const users = useMemo(() => {
      const participants = conversation.participants;
      return new Map<number, ApiUser>(participants.map((p) => [p.fid, p]));
    }, [conversation]);

    if (!directCast) {
      return <></>;
    }

    const filteredReactions = reactions.filter((r) =>
      selectedReaction === 'All' ? true : r.reaction === selectedReaction,
    );

    return (
      <Modal>
        <DefaultModalContainer onClose={() => onClose()}>
          <div className="flex size-full flex-col items-center p-4">
            <div
              className="relative mt-[calc(50vh-190px)] flex w-full max-w-[500px] flex-col items-center justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex w-full flex-row justify-end">
                <div className="flex grow flex-col justify-around text-lg">
                  Reactions
                </div>
                <DefaultCloseModalButton
                  onClick={() => onClose()}
                  className="p-2"
                />
              </div>
              <div className="scrollbar-horz mb-2 flex w-full flex-row items-start overflow-x-scroll">
                {[
                  {
                    reaction: 'All',
                    count: directCast.reactions.reduce(
                      (sum, r) => sum + r.count,
                      0,
                    ),
                  },
                  ...directCast.reactions,
                ].map((r) => {
                  return (
                    <div
                      onClick={() => setSelectedReaction(r.reaction)}
                      key={'reaction-tab-' + r.reaction}
                      className={cn([
                        'mr-2 flex cursor-pointer flex-row rounded-full px-2 py-1 text-sm',
                        r.reaction === selectedReaction
                          ? 'bg-overlay-medium'
                          : '',
                      ])}
                    >
                      <span className="pr-2">
                        <ReactionEmoji reaction={r.reaction} />
                      </span>
                      <span>{r.count}</span>
                    </div>
                  );
                })}
              </div>
              <FlatList
                containerClassName="flex flex-col w-full h-[300px] pt-2 scrollbar-vert overflow-y-scroll"
                data={filteredReactions}
                renderItem={({ item, index }) => {
                  const user = users.get(item.fid)!;
                  return (
                    <div
                      className={cn([
                        'flex flex-row py-2',
                        index === filteredReactions.length - 1
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
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

export { DirectCastReactionsModal };
