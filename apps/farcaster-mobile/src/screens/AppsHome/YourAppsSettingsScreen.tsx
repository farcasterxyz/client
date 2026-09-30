import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiFrame } from 'farcaster-client-data';
import {
  frameKeyExtractor,
  resolveUsernameShort,
  useFavoriteFrames,
  useInvalidateFavoriteFrames,
  useUpdateFavoriteFrame,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { TouchableHighlight, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  DragEndParams,
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { FrameIconImage } from '~/components/FrameIconImage';
import { buildScreen } from '~/components/Screen';
import { SkeletonPlaceholder } from '~/components/SkeletonPlaceholder';
import { Text2 } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { hitSlop } from '~/constants/Pressable';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useHaptics } from '~/hooks/useHaptics';
import { AppsHomeStackParamList } from '~/types';

type YourAppsSettingsScreenProps = NativeStackScreenProps<
  AppsHomeStackParamList,
  'YourAppsSettings'
>;

const YourAppsSettingsScreen = buildScreen<YourAppsSettingsScreenProps>(
  { name: 'YourAppsSettings' },
  () => {
    return <YourAppsSettings />;
  },
);
YourAppsSettingsScreen.displayName = 'YourAppsSettingsScreen';

const YourAppsSettings: FC = () => {
  const t = useTheme();
  const push = usePush();
  const toast = useRootToast();
  const { flatData, isLoading, fetchNextPage, refetch } = useFavoriteFrames();
  const updateFavoriteFrame = useUpdateFavoriteFrame();
  const invalidateFavoriteFrames = useInvalidateFavoriteFrames();

  const [orderedFrames, setOrderedFrames] = useState<ApiFrame[]>(
    flatData || [],
  );

  useEffect(() => {
    setOrderedFrames(flatData || []);
  }, [flatData]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch,
  });

  const extraData = useCommonFlatListExtraData();
  const { triggerImpactAsync } = useHaptics();

  const onDragEnd = useCallback(
    async ({ data, to }: DragEndParams<ApiFrame>) => {
      const frame = data[to];

      setOrderedFrames(data);

      try {
        await updateFavoriteFrame({ frame, position: to });

        setTimeout(() => {
          invalidateFavoriteFrames();
        }, 3000);
      } catch (e: unknown) {
        invalidateFavoriteFrames();
        toast.show('Error reordering apps', {
          type: 'error',
        });
      }
    },
    [invalidateFavoriteFrames, toast, updateFavoriteFrame],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ApiFrame>) => (
      <ScaleDecorator activeScale={1.02}>
        <TouchableHighlight
          underlayColor={t.colors.bgHover}
          style={[
            t.flexRow,
            t.itemsCenter,
            t.pX3,
            t.pY3,
            t.borderBHairline,
            t.borderDefault,
            isActive && t.bgHover,
            { gap: sizes.s3 },
          ]}
          onPress={() => {
            push('AppSettings', { domain: item.domain });
          }}
        >
          <>
            <TouchableOpacity
              style={[t.mR2]}
              onPressIn={() => {
                triggerImpactAsync();
                drag();
              }}
              activeOpacity={0.75}
              hitSlop={hitSlop}
            >
              <Octicons
                name="three-bars"
                size={20}
                color={t.colors.text.tertiary}
              />
            </TouchableOpacity>
            <FrameIconImage imageUrl={item.iconUrl} size={40} />
            <View style={[t.flex1]}>
              <Text2 weight="semibold" numberOfLines={1}>
                {item.name}
              </Text2>
              {item.author && (
                <Text2 size="sm" color="secondary" numberOfLines={1}>
                  by {resolveUsernameShort(item.author)}
                </Text2>
              )}
            </View>
            <View>
              <Octicons
                name="chevron-right"
                size={20}
                color={t.colors.text.tertiary}
              />
            </View>
          </>
        </TouchableHighlight>
      </ScaleDecorator>
    ),
    [t, triggerImpactAsync, push],
  );

  const header = useMemo(() => {
    return (
      <Text2 size="sm" color="secondary" style={[t.mB2]}>
        Drag and drop to rearrange the order of your apps. Apps are displayed
        from left to right, filling the top row first, then moving
      </Text2>
    );
  }, [t]);

  if (isLoading) {
    return (
      <View style={[t.pT2, t.pX3, t.hFull]}>
        {header}
        <View style={[t.flexCol, { gap: sizes.s3 }]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonPlaceholder
              key={i}
              style={[t.roundedLg, { height: 52 }]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[t.pT2, t.pX3, t.hFull]}>
      <DraggableFlatList
        data={orderedFrames}
        extraData={extraData}
        style={t.hFull}
        contentContainerStyle={[]}
        keyExtractor={frameKeyExtractor}
        ListHeaderComponent={header}
        onDragEnd={onDragEnd}
        renderItem={renderItem}
        refreshControl={refreshControl}
        onEndReached={() => fetchNextPage()}
        onEndReachedThreshold={onEndReachedThreshold}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};
YourAppsSettings.displayName = 'YourAppsSettings';

export { YourAppsSettingsScreen };
