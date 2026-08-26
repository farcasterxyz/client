import { Octicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef, ListRenderItem } from '@shopify/flash-list';
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast } from 'farcaster-client-data';
import {
  DeleteCastFromTrendingTopicError,
  getNotionLinkTarget,
  useDeleteCastFromTrendingTopic,
  useFlatSearchCastsData,
  useTrendingTopicCasts,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { CommonStackParamList } from '~/types';
import { extractCastKey } from '~/utils/CastUtils';
import { trackError } from '~/utils/ErrorUtils';
import { getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

type TrendingTopicScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TrendingTopic'
>;

const TrendingTopicScreen = buildScreen<TrendingTopicScreenProps>(
  { name: 'TrendingTopic' },
  ({ route: { params } }) => {
    const { data, onEndReached, isLoading } = useTrendingTopicCasts({
      topicId: params.topicId,
      sort: 'top',
    });
    const { trackEvent } = useAnalytics();
    const deleteCastFromTrendingTopic = useDeleteCastFromTrendingTopic();
    const t = useTheme();
    const extraData = useCommonFlatListExtraData();
    const casts = useFlatSearchCastsData({ data });
    const toast = useRootToast();
    const listRef = useRef<FlashListRef<ApiCast>>(null);
    const isFocused = useIsFocused();
    useForceZeroScrollInsets({
      ref: listRef,
      enabled: isFocused,
    });

    const headerRight = useMemo(() => {
      return (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            openBrowserAsync(getNotionLinkTarget({ to: 'trending-topics' }), {
              dismissButtonStyle: 'close',
              readerMode: false,
              presentationStyle: WebBrowserPresentationStyle.POPOVER,
            });
          }}
          hitSlop={hitSlop}
        >
          <Octicons name="info" size={18} style={[t.texts.secondary]} />
        </TouchableOpacity>
      );
    }, [t.texts.secondary]);

    const { setOptions } = useNavigation();

    useEffect(() => {
      setOptions({
        headerRight: () => headerRight,
      });
    }, [headerRight, setOptions]);

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.ViewTrendingTopicFeed, {
          id: params.topicId,
          name: params.displayName,
        });
      }, [params.displayName, params.topicId, trackEvent]),
    );

    const renderCast = useCallback<ListRenderItem<ApiCast>>(
      ({ item }) => {
        return (
          <Cast
            cast={item}
            additionalModerationOptions={[
              {
                label: 'Remove from topic',
                onPress: async () => {
                  trackEvent(AnalyticsEvent.ClickTrendingTopic, {});
                  try {
                    await deleteCastFromTrendingTopic({
                      castHash: item.hash,
                      topicId: params.topicId,
                    });
                    toast.hideAll();
                    toast.show('Removed from topic', {
                      type: 'castTrendingTopicRemoved',
                      duration: 3000,
                      placement: 'bottom',
                    });
                  } catch (error) {
                    toast.show('Failed to remove cast from topic', {
                      type: 'danger',
                    });
                    const deleteCastFromTrendingTopicError =
                      new DeleteCastFromTrendingTopicError({
                        error,
                        hash: item.hash,
                        topicId: params.topicId,
                      });
                    trackError(deleteCastFromTrendingTopicError);
                    throw deleteCastFromTrendingTopicError;
                  }
                },
                enableHaptics: true,
                destructive: true,
                icon: ({ size }) => (
                  <Octicons name="x" size={size} color={t.colors.text.danger} />
                ),
              },
            ]}
          />
        );
      },
      [
        deleteCastFromTrendingTopic,
        params.topicId,
        t.colors.text.danger,
        toast,
        trackEvent,
      ],
    );

    if (isLoading) {
      return <FullScreenLoadingIndicator />;
    } else if (!casts || casts.length === 0) {
      return (
        <View style={[t.hFull, t.itemsCenter, t.justifyCenter]}>
          <Text2 size="base" color="secondary" weight="medium" style={[t.mB2]}>
            This topic has been deleted
          </Text2>
        </View>
      );
    }

    return (
      <View style={[t.hFull]}>
        <FlashList
          ref={listRef}
          data={casts}
          renderItem={renderCast}
          extraData={extraData}
          keyExtractor={extractCastKey}
          getItemType={getCastItemType}
          {...ZERO_SCROLL_INSET_PROPS}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          onEndReached={onEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  },
);

TrendingTopicScreen.displayName = 'TrendingTopicScreen';

export { TrendingTopicScreen };
