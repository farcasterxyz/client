import { FlashList } from '@shopify/flash-list';
import { ApiChannel } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  useFlatSearchChannelsData,
  useSearchChannels,
} from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { RemoteImage } from '~/components/RemoteImage';
import { Text } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useHaptics } from '~/hooks/useHaptics';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ChannelMentionAutocompleteProps = {
  mentionText: string | undefined;
  onAutocompleteMention: (channel: ApiChannel) => void;
};

const avatarDiameter = 36;
const rowHeight = avatarDiameter + sizes.s2 * 4;
const numVisibleRows = 4;
const height = rowHeight * numVisibleRows;
const animationDuration = 100;
const autocompleteHeightBlock = height - rowHeight;

const ChannelMentionAutocomplete: FC<ChannelMentionAutocompleteProps> = memo(
  ({ mentionText, onAutocompleteMention }) => {
    const t = useTheme();

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(height)).current;

    const prevIsVisibleRef = useRef(false);

    const isVisible = !!mentionText;

    useEffect(() => {
      if (isVisible !== prevIsVisibleRef.current) {
        const [translateYToValue, opacityToValue] = isVisible
          ? [0, 1]
          : [height, 0];

        Animated.timing(translateY, {
          toValue: translateYToValue,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();

        Animated.timing(opacity, {
          toValue: opacityToValue,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();

        prevIsVisibleRef.current = isVisible;
      }
    }, [isVisible, opacity, translateY]);

    return (
      <Animated.View
        style={[
          t.roundedTLg,
          isVisible ? { height } : { height: 0 },
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Suspense
          fallback={
            <FullScreenLoadingIndicator
              debugName="ChannelMentionAutocomplete"
              style={[t.bgDefault]}
            />
          }
        >
          <ChannelMentionAutocompleteContent
            mentionText={mentionText}
            onAutocompleteMention={onAutocompleteMention}
          />
        </Suspense>
      </Animated.View>
    );
  },
);

ChannelMentionAutocomplete.displayName = 'ChannelMentionAutocomplete';

const ChannelMentionAutocompleteContent: FC<
  ChannelMentionAutocompleteProps
> = ({ mentionText, onAutocompleteMention }) => {
  const t = useTheme();
  const { data, isPending, onEndReached } = useSearchChannels({
    q: mentionText || '',
    prioritizeFollowed: true,
  });
  const channels = useFlatSearchChannelsData({ data });

  const extraData = useCommonFlatListExtraData();

  if (!channels && isPending) {
    return (
      <View style={[t.hFull, t.justifyCenter]}>
        <LoadingIndicator />
      </View>
    );
  }

  if (channels?.length === 0 && !isPending) {
    return <Empty message="No channels found" />;
  }

  return (
    <FlashList
      data={channels}
      extraData={extraData}
      keyExtractor={channelKeyExtractor}
      // https://stackoverflow.com/a/45834865
      keyboardShouldPersistTaps="handled"
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      {...STANDARD_FLASHLIST_PERF_PROPS}
      renderItem={({ item }) => (
        <AutocompleteChannel
          channel={item}
          onAutocompleteMention={onAutocompleteMention}
        />
      )}
    />
  );
};

ChannelMentionAutocompleteContent.displayName = 'AutocompleteMentionContent';

type AutocompleteChannelProps = {
  channel: ApiChannel;
  onAutocompleteMention: (user: ApiChannel) => void;
};

const AutocompleteChannel: FC<AutocompleteChannelProps> = memo(
  ({ channel, onAutocompleteMention }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    return (
      <TouchableOpacity
        onPress={() => {
          triggerImpactAsync();

          onAutocompleteMention(channel);
        }}
        key={channel.key}
        style={[
          t.borderTHairline,
          t.borderDefault,
          t.p4,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          { height: rowHeight },
        ]}
        activeOpacity={0.75}
      >
        <RemoteImage
          contentFit="cover"
          uri={channel.imageUrl}
          width={avatarDiameter}
          height={avatarDiameter}
          style={[t.roundedSm, t.borderDefault, t.borderHairline]}
          fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
          shouldFadeIn={false}
        />
        <View style={[t.mL4]}>
          <View style={[t.flexRow]}>
            <Text
              numberOfLines={1}
              style={[
                t.texts.primary,
                t.fontBold,
                t.textBase,
                t.flex,
                t.flexWrap,
              ]}
            >
              {channel.name}
            </Text>
          </View>
          <Text style={[t.texts.secondary, t.textBase, t.flex, t.flexWrap]}>
            /{channel.key}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

AutocompleteChannel.displayName = 'AutocompleteChannel';

const ChannelMentionAutoCompleteWithSuspense: FC<
  ChannelMentionAutocompleteProps
> = (props) => (
  <Suspense fallback={null}>
    <ChannelMentionAutocomplete {...props} />
  </Suspense>
);

ChannelMentionAutoCompleteWithSuspense.displayName =
  'ChannelMentionAutoCompleteWithSuspense';

export {
  autocompleteHeightBlock,
  ChannelMentionAutoCompleteWithSuspense as ChannelMentionAutocomplete,
};
