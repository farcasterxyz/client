import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiMutedKeyword } from 'farcaster-client-data';
import { useMutedKeywords, useRemoveMuteKeyword } from 'farcaster-client-hooks';
import { AtomsButton, useRootToast } from 'farcaster-expo';
import React, { FC, memo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type MutedKeywordsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'MutedKeywords'
>;

const MutedKeywordsScreen = buildScreen<MutedKeywordsScreenProps>(
  { name: 'MutedKeywords' },
  () => {
    return <MutedKeywordsContent />;
  },
);
MutedKeywordsScreen.displayName = 'MutedKeywordsScreen';

const MutedKeywordsContent: FC = memo(() => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const toast = useRootToast();

  const { data } = useMutedKeywords();

  const removeKeyword = useRemoveMuteKeyword();

  const mutedKeywords = React.useMemo(() => {
    return data.result.mutedKeywords;
  }, [data.result.mutedKeywords]);

  const push = usePush();

  const onKeywordPress = useCallback(
    ({ keyword }: { keyword: string }) => {
      push('MutedKeyword', { keyword: keyword });
    },
    [push],
  );

  const onAddMutedKeywordPress = useCallback(() => {
    push('MutedKeyword', { keyword: undefined });
  }, [push]);

  const MutedKeywordRow = memo(
    ({ keyword, index }: { keyword: string; index: number }) => {
      const remove = useCallback(async ({ keyword }: { keyword: string }) => {
        try {
          await removeKeyword({ keyword });
          trackEvent(AnalyticsEvent.UnmuteKeyword, { keyword });
          toast.show(`Unmuted ${keyword}`, {
            placement: 'bottom',
          });
        } catch (error) {
          trackError(error);
        }
      }, []);

      return (
        <TouchableOpacity
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.borderDefault,
            t.p4,
            t.h14,
            index !== mutedKeywords.length - 1 && t.borderBHairline,
          ]}
          activeOpacity={0.75}
          onPress={() => onKeywordPress({ keyword })}
        >
          <View style={[t.flex1, t.flexRow, t.mL1, t.itemsCenter, t.mR2]}>
            <Text style={[t.texts.primary, t.textBase, t.itemsCenter]}>
              {keyword}
            </Text>
          </View>
          <View style={[t.flex, t.flexRow, t.mR1, t.itemsCenter]}>
            <Octicons
              name="x"
              size={24}
              color={t.colors.text.secondary}
              onPress={() => remove({ keyword })}
            />
          </View>
        </TouchableOpacity>
      );
    },
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: ApiMutedKeyword;
    index: number;
  }) => <MutedKeywordRow keyword={item.keyword} index={index} />;

  return (
    <View style={[t.hFull, t.wFull, t.borderTHairline, t.borderDefault]}>
      <FlashList
        data={mutedKeywords}
        keyExtractor={(item) => item.keyword}
        ListHeaderComponent={
          <View
            style={[
              t.flex,
              t.flexCol,
              { gap: 8 },
              t.borderBHairline,
              t.borderDefault,
              t.pT4,
              t.pX4,
            ]}
          >
            <Text style={[t.textBase, t.texts.secondary]}>
              When you mute words, you won’t see posts with those words in your
              home feed.
            </Text>
            <View style={[t.flex, t.flexRow, t.mB4, t.mT2, t.itemsCenter]}>
              <AtomsButton
                onPress={onAddMutedKeywordPress}
                hierarchy="primary"
                size="l"
                style={t.wFull}
              >
                Add
              </AtomsButton>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text
            style={[t.wFull, t.textCenter, t.texts.secondary, t.textSm, t.pY4]}
          >
            No keywords or phrases muted.
          </Text>
        }
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={renderItem}
      />
    </View>
  );
});

export { MutedKeywordsScreen };
