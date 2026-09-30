import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCaststormDraft } from 'farcaster-client-data';
import {
  resolveUsername,
  useDiscardDraftCast,
  useDraftCaststormsWithRefreshOnMount,
  useThread,
} from 'farcaster-client-hooks';
import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { CommentFillIcon } from '~/components/images/CommentFillIcon';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUnmediatedPop } from '~/hooks/navigation/methods/pop';
import { RootNativeStackParamList } from '~/types';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type DraftCastsScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'DraftCasts'
>;

const DraftCastsScreen = buildScreen<DraftCastsScreenProps>(
  {
    name: 'DraftCasts',
    insetTop: Platform.OS === 'android',
  },
  () => {
    return (
      <React.Suspense fallback={<FullScreenLoadingIndicator />}>
        <DraftCastsScreenContent />
      </React.Suspense>
    );
  },
);

DraftCastsScreen.displayName = 'DraftCastsScreen';

const DraftCastsScreenContent: React.FC<
  RootNativeStackParamList['DraftCasts']
> = () => {
  const t = useTheme();

  const { data, onEndReached, isLoading } =
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
        <Draft lastDraftInList={drafts.length - 1 === index} draft={item} />
      );
    },
    [drafts.length],
  );

  if (isLoading) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      mode="padding"
      style={[t.flexCol, t.hFull, t.borderTHairline, t.borderDefault]}
    >
      <FlashList
        data={drafts}
        keyExtractor={draftKeyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={feedOnEndReachedThreshold}
        ListEmptyComponent={EmptyDrafts}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={draftRenderItem}
      />
    </SafeAreaView>
  );
};

DraftCastsScreenContent.displayName = 'SubmitCastScreenContent';

type DraftProps = {
  lastDraftInList: boolean;
  draft: ApiCaststormDraft;
};

const Draft: React.FC<DraftProps> = ({ lastDraftInList, draft }) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const discardDraftCast = useDiscardDraftCast();

  const onDiscardDraftPress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.CastComposerDraftDeleted, {
      hasChannel: typeof draft.channelKey !== 'undefined',
      isReply: typeof draft.parent?.hash !== 'undefined',
      isScheduled: typeof draft.scheduledAt !== 'undefined',
      castCount: draft.casts.length,
    });
    await discardDraftCast({
      draftId: draft.draftId,
      castChannelKey: undefined,
    });
  }, [
    discardDraftCast,
    draft.casts.length,
    draft.channelKey,
    draft.draftId,
    draft.parent?.hash,
    draft.scheduledAt,
    trackEvent,
  ]);

  const pop = useUnmediatedPop();

  const openComposer = useOpenComposer();

  const onDraftPressInternal = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.CastComposerDraftOpened, {
      hasChannel: typeof draft.channelKey !== 'undefined',
      isReply: typeof draft.parent?.hash !== 'undefined',
      isScheduled: typeof draft.scheduledAt !== 'undefined',
      castCount: draft.casts.length,
    });
    const params = createCastParamsWithIntent({
      draftCasts: draft.casts,
      channelKey: draft.channelKey,
      activeDraftId: draft.draftId,
      parentCastHash: draft.parent?.hash,
      // Carry the draft's real schedule through. The drafts list shows a
      // scheduled badge, so editing + saving should keep the send (WYSIWYG).
      // Mobile has no schedule editor, so this also stops a content edit from
      // silently unscheduling a send that was set on another device.
      scheduledAt:
        typeof draft.scheduledAt !== 'undefined'
          ? new Date(draft.scheduledAt)
          : undefined,
    });

    // Close drafts screen
    pop();
    // Open composer modal with selected draft
    setTimeout(() => {
      openComposer(params);
    }, 500);
  }, [
    draft.casts,
    draft.channelKey,
    draft.draftId,
    draft.parent?.hash,
    draft.scheduledAt,
    openComposer,
    pop,
    trackEvent,
  ]);

  const firstNonemptyCast = draft.casts.find((draft) => draft.text.trim());
  const firstNonemptyCastText = firstNonemptyCast?.text ?? '';
  const firstCastEmbeds = draft.casts[0].embeds;

  return (
    <TouchableOpacity
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.wFull,
        t.p4,
        t.pR6,
        !lastDraftInList && [t.borderBHairline, t.borderDefault],
      ]}
      activeOpacity={0.75}
      onPress={onDraftPressInternal}
    >
      <View style={[t.flex, t.flexCol, t.mR4, t.flexGrow, t.flex1]}>
        <View style={[t.flex, t.flexRow, { gap: 8 }]}>
          {typeof draft.parent?.hash !== 'undefined' && (
            <DraftReplyParentIndicator parentCastHash={draft.parent.hash} />
          )}
          {typeof draft.scheduledAt !== 'undefined' && (
            <DraftScheduledAtIndicator />
          )}
        </View>
        {typeof firstCastEmbeds !== 'undefined' &&
          firstCastEmbeds.length !== 0 && (
            <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <Octicons name="link" size={12} color={t.colors.text.secondary} />
              <Text style={[t.texts.secondary, t.textSm]}>
                Contains attachments
              </Text>
            </View>
          )}
        <Text style={[t.textBase, t.texts.primary]} numberOfLines={2}>
          {firstNonemptyCastText}
        </Text>
        {draft.channelKey && (
          <Text style={[t.texts.secondary, t.textSm]}>/{draft.channelKey}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[]}
        activeOpacity={0.75}
        onPress={onDiscardDraftPress}
      >
        <Octicons size={16} name="trash" style={[t.texts.danger]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

Draft.displayName = 'Draft';

type DraftReplyParentIndicatorProps = {
  parentCastHash: string;
};

const DraftReplyParentIndicator: React.FC<DraftReplyParentIndicatorProps> =
  React.memo(({ parentCastHash }) => {
    const t = useTheme();

    const { data } = useThread({ castHash: parentCastHash });

    const parentCast = React.useMemo(() => {
      return data?.pages
        .flatMap((page) => page.result.casts)
        .find((cast) => cast.hash === parentCastHash);
    }, [data, parentCastHash]);

    if (typeof parentCast === 'undefined') {
      return (
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <CommentFillIcon size={12} color={t.colors.text.secondary} />
          <Text style={[t.texts.secondary, t.textSm]}>Reply</Text>
        </View>
      );
    }

    return (
      <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
        <CommentFillIcon size={12} color={t.colors.text.secondary} />
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Text style={[t.texts.secondary, t.textSm]}>
            {`Replying to ${resolveUsername({
              username: parentCast.author.username,
              fid: parentCast.author.fid,
            })}`}
          </Text>
        </View>
      </View>
    );
  });

const DraftScheduledAtIndicator: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Octicons name="calendar" size={12} color={t.colors.text.secondary} />
      <Text style={[t.texts.secondary, t.textSm]}>Scheduled</Text>
    </View>
  );
});

const EmptyDrafts: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Empty
      icon={
        <Svg width={87} height={93} viewBox="0 0 87 93" fill="none">
          <Rect
            x={0.75}
            y={0.75}
            width={62.5}
            height={70.5}
            rx={9.25}
            stroke="#546473"
            strokeOpacity={0.2}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <Rect
            x={23}
            y={21}
            width={64}
            height={72}
            rx={10}
            fill={t.colors.bgDefault}
          />
          <Rect
            x={23.75}
            y={21.75}
            width={62.5}
            height={70.5}
            rx={9.25}
            stroke="#546473"
            strokeOpacity={0.2}
            strokeWidth={1.5}
          />
        </Svg>
      }
      justify="center"
      message="No drafts yet"
      subMessage="You can stash casts here to post later."
    />
  );
});

export { DraftCastsScreen };
