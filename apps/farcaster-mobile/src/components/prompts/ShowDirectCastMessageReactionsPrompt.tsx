import { ApiDirectCastMessageV3, ApiUser } from 'farcaster-client-data';
import {
  useDirectCastConversation,
  useInvalidatePlaintextDirectCastReactions,
  usePlaintextDirectCastReactions,
  useRemoveReactionFromPlaintextDirectCast,
} from 'farcaster-client-hooks';
import { convertHexToRGBA } from 'farcaster-expo';
import React, {
  FC,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { Avatar } from '~/components/Avatar';
import { Button } from '~/components/Button';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { Text } from '~/components/Text';
import { showDirectCastMessageReactionsPromptKey } from '~/constants/Storage';
import { useDirectCastToTakeAction } from '~/contexts/DirectCastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

import { Prompt } from './Prompt';

const ShowDirectCastMessageReactionsPrompt: FC = memo(() => {
  const { directCast } = useDirectCastToTakeAction();
  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();
  const shouldPresent = useCallback(
    () =>
      activePromptKey === showDirectCastMessageReactionsPromptKey &&
      typeof directCast !== 'undefined',
    [activePromptKey, directCast],
  );

  return (
    <Prompt
      shouldPresent={shouldPresent}
      enablePanDownToClose={true}
      height={400}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      storageKey={showDirectCastMessageReactionsPromptKey}
    >
      <Suspense fallback={<FullScreenLoadingIndicator justify="center" />}>
        <ShowDirectCastMessageReactionsPromptContent directCast={directCast!} />
      </Suspense>
    </Prompt>
  );
});

ShowDirectCastMessageReactionsPrompt.displayName =
  'ShowDirectCastMessageReactionsPrompt';

const ShowDirectCastMessageReactionsPromptContent: FC<{
  directCast: ApiDirectCastMessageV3;
}> = ({ directCast }) => {
  const t = useTheme();
  const { fid } = useCurrentUser_UNSAFE();
  const invalidateReactions = useInvalidatePlaintextDirectCastReactions();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
  } = usePlaintextDirectCastReactions({
    fid,
    conversationId: directCast.conversationId,
    messageId: directCast.messageId,
  });
  const { data: conversation } = useDirectCastConversation({
    conversationId: directCast.conversationId,
  });
  const [optimisticRemoves, setOptimisticRemoves] = useState<
    { fid: number; reaction: string }[]
  >([]);
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
    ].filter(
      (r) =>
        !optimisticRemoves.find(
          (o) => o.fid === r.fid && o.reaction === r.reaction,
        ),
    );
  }, [data?.pages, optimisticRemoves]);

  const totalReactions = useMemo(
    () =>
      directCast.reactions.reduce((sum, r) => sum + r.count, 0) -
      optimisticRemoves.length,
    [directCast.reactions, optimisticRemoves.length],
  );

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [data?.pages.length, fetchNextPage, hasNextPage, isFetchingNextPage]);
  const onRemoveReaction = useCallback(
    (reaction: string) => {
      if (directCast) {
        setOptimisticRemoves((prev) => [...prev, { fid, reaction }]);
        removeDirectCastReaction({
          fid,
          conversationId: directCast.conversationId,
          messageId: directCast.messageId,
          reaction,
        });
        refetch({ cancelRefetch: false });
      }
    },
    [directCast, removeDirectCastReaction, fid, refetch],
  );

  useEffect(() => {
    // totalReactions is the sum of all reaction counts (e.g. 👍×3 + ❤️×2 = 5),
    // already adjusted for optimistic removes. reactions.length is the number of
    // loaded (fid, reaction) pairs. When they diverge once all pages are loaded,
    // the cache is stale. Previously this compared directCast.reactions.length
    // (number of reaction *types*, e.g. 2) against reactions.length (individual
    // reactors, e.g. 5) — those are almost never equal so the effect fired on
    // every render, causing a continuous invalidate+refetch loop.
    //
    // Gate on pagination being complete: while hasNextPage/isFetchingNextPage,
    // reactions.length is expected to be lower than totalReactions, and the
    // effect above is already driving fetchNextPage — invalidating here would
    // restart that pagination and reintroduce the loop.
    if (
      !hasNextPage &&
      !isFetchingNextPage &&
      !isPending &&
      totalReactions !== reactions.length
    ) {
      invalidateReactions({
        fid,
        conversationId: directCast.conversationId,
        messageId: directCast.messageId,
      });
      refetch({ cancelRefetch: false });
    }
  }, [
    directCast.conversationId,
    directCast.messageId,
    fid,
    hasNextPage,
    invalidateReactions,
    isFetchingNextPage,
    isPending,
    reactions.length,
    refetch,
    totalReactions,
  ]);

  const users = useMemo(() => {
    const participants = conversation?.participants ?? [];
    return new Map<number, ApiUser>(participants.map((p) => [p.fid, p]));
  }, [conversation]);

  if (!directCast) {
    return <></>;
  }

  const filteredReactions = reactions.filter((r) =>
    selectedReaction === 'All' ? true : r.reaction === selectedReaction,
  );

  const renderReaction = ({
    item,
    index,
  }: {
    item: { fid: number; reaction: string };
    index: number;
  }) => {
    return (
      <View style={[t.flex, t.flexCol]}>
        <View
          style={[
            t.flex,
            t.flexRow,
            t.flexWrap,
            t.justifyBetween,
            t.itemsCenter,
            ...(index === filteredReactions.length - 1
              ? []
              : [
                  {
                    borderColor: t.dark
                      ? convertHexToRGBA(t.colors.white, 0.2)
                      : t.colors.iron,
                  },
                  t.borderBHairline,
                ]),
            t.pB2,
            t.mB2,
          ]}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Avatar
              style={[t.mR2]}
              diameter={40}
              pfpUrl={users.get(item.fid)?.pfp?.url}
            />
            <Text style={[t.texts.primary, t.fontSemibold]}>
              {users.get(item.fid)?.displayName}
            </Text>
          </View>
          <View style={[t.flex, t.flexRow, t.itemsEnd]}>
            <View style={[t.flex, t.flexCol, t.justifyCenter]}>
              {fid === item.fid && (
                <Button
                  title="Remove"
                  variant="inverted"
                  size="xs"
                  onPress={() => onRemoveReaction(item.reaction)}
                />
              )}
            </View>
            <View style={[t.flex, t.flexCol, t.justifyCenter, t.pB2, t.pL2]}>
              <Text>{item.reaction}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[t.hFull, t.p4, t.flex, t.flexCol]}>
      <View style={[t.pB4, { height: 40 }, t.wFull, t.flexRow]}>
        {totalReactions ? (
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.bgDefault,
              t.roundedFull,
              t.pX2,
              t.pY1,
              t.mR1,
            ]}
          >
            <Text style={[t.texts.primary]}>All</Text>
            <Text style={[t.texts.primary, t.mL1]}>{totalReactions}</Text>
          </View>
        ) : (
          <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter]}>
            <Text style={[t.texts.primary, t.fontSemibold]}>
              No reactions yet
            </Text>
          </View>
        )}
        <FlatList
          data={directCast.reactions
            .map((r) =>
              optimisticRemoves.find((o) => o.reaction === r.reaction)
                ? { reaction: r.reaction, count: r.count - 1 }
                : r,
            )
            .filter((r) => r.count !== 0)}
          horizontal={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedReaction(item.reaction);
              }}
              style={[
                t.mR2,
                ...(selectedReaction === item.reaction
                  ? [t.bgDefault, { borderRadius: 24 }]
                  : []),
              ]}
            >
              <Text style={[t.texts.primary, t.pX2, t.pY1]}>
                {item.reaction} {item.count}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={[t.pB2, { height: 300 }, t.wFull]}>
        <FlatList
          data={filteredReactions}
          renderItem={renderReaction}
          keyExtractor={(e) => `dc-reaction-${e.fid}${e.reaction}`}
        />
      </View>
    </View>
  );
};

export { ShowDirectCastMessageReactionsPrompt };
