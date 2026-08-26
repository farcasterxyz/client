import {
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  useFlatSearchChannelsData,
  useSearchChannels,
  useUserFollowingChannels,
} from 'farcaster-client-hooks';
import { AutoDisplayingBottomSheetModal } from 'farcaster-expo';
import React, { Suspense, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

import { BottomSheetSearchInput } from '~/components/BottomSheetSearchInput';
import { ChannelRemoteImage } from '~/components/ChannelsV3/ChannelRemoteImage';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

type OnChannelSelectFunc = ({ channelKey }: { channelKey?: string }) => void;

type CastChannelSelectorPromptAutoDisplayingProps = {
  currentlySelectedChannelKey: string | undefined;
  onChannelSelect: OnChannelSelectFunc;
  onDismiss: () => void;
};

const CastChannelSelectorPromptAutoDisplaying: React.FC<CastChannelSelectorPromptAutoDisplayingProps> =
  React.memo(({ currentlySelectedChannelKey, onChannelSelect, onDismiss }) => {
    const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

    const t = useTheme();

    const [query, setQuery] = React.useState('');

    const onChannelSelectOverride = useCallback(
      ({ channelKey }: { channelKey?: string }) => {
        setQuery('');

        onChannelSelect({ channelKey });
      },
      [onChannelSelect],
    );

    const onPromptDismss = useCallback(() => {
      setQuery('');

      onDismiss();
    }, [onDismiss]);

    return (
      <AutoDisplayingBottomSheetModal
        name="channelSelectorAutoDisplayingPrompt"
        onDismiss={onPromptDismss}
        ref={bottomSheetRef}
        stackBehavior="push"
      >
        <BottomSheetView>
          <View style={{ gap: 8 }}>
            <View style={[t.flex, t.wFull, { minHeight: 480 }]}>
              <View style={[t.mB2, t.pX4]}>
                <BottomSheetSearchInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Search for channels"
                  spellCheck={false}
                  width={'100%'}
                  onChangeText={(value) => {
                    setQuery(value);
                  }}
                  value={query}
                  align="left"
                />
              </View>
              <Suspense
                fallback={
                  <FullScreenLoadingIndicator debugName="CastChannelSelectorPromptAutoDisplaying" />
                }
              >
                {query === '' ? (
                  <CastChannelSelectorDefault
                    currentlySelectedChannelKey={currentlySelectedChannelKey}
                    onChannelSelect={onChannelSelectOverride}
                  />
                ) : (
                  <CastChannelSelectorSearch
                    query={query}
                    onChannelSelect={onChannelSelectOverride}
                  />
                )}
              </Suspense>
            </View>
          </View>
        </BottomSheetView>
      </AutoDisplayingBottomSheetModal>
    );
  });

CastChannelSelectorPromptAutoDisplaying.displayName =
  'CastChannelSelectorPromptAutoDisplaying';

type SelectorChannel = Pick<
  ApiChannel,
  'key' | 'name' | 'imageUrl' | 'followerCount'
> & {
  isMember: boolean;
  canCast: boolean;
};

const CastChannelSelectorDefault: React.FC<
  Omit<CastChannelSelectorPromptAutoDisplayingProps, 'onDismiss'>
> = ({ onChannelSelect }) => {
  const { data, onEndReached } = useUserFollowingChannels({
    forComposer: true,
  });

  const channels: SelectorChannel[] = React.useMemo(
    () =>
      data!.pages
        .flatMap((page) => page.result.channels)
        .filter((channel) => channel.type === 'channel')
        .map((channel) => {
          return {
            key: channel.key,
            name: channel.name,
            imageUrl: channel.imageUrl,
            followerCount: channel.followerCount,
            isMember: channel.viewerContext.isMember,
            canCast: channel.viewerContext.canCast ?? false,
          } satisfies SelectorChannel;
        }) || [],
    [data],
  );

  const selectorChannels: SelectorChannel[] = React.useMemo(() => {
    return [
      {
        key: 'Home',
        name: 'Home',
        imageUrl: 'https://farcaster.xyz/~/channel-images/home.png',
        followerCount: undefined,
        isMember: true,
        canCast: true,
      },
      ...channels,
    ];
  }, [channels]);

  return (
    <CastChannelSelectorList
      allChannels={selectorChannels}
      onChannelSelect={onChannelSelect}
      onEndReached={onEndReached}
    />
  );
};

interface CastChannelSelectorSearchProps {
  query: string;
  onChannelSelect: OnChannelSelectFunc;
}

const CastChannelSelectorSearch: React.FC<CastChannelSelectorSearchProps> = ({
  query,
  onChannelSelect,
}) => {
  const { data, onEndReached } = useSearchChannels({
    q: query,
    prioritizeFollowed: true,
    forComposer: true,
  });

  const channels = useFlatSearchChannelsData({ data })?.filter(
    ({ type }) => type === 'channel',
  );

  const selectorChannels: SelectorChannel[] = React.useMemo(() => {
    return (channels || []).map(
      (channel) =>
        ({
          key: channel.key,
          name: channel.name,
          followerCount: channel.followerCount,
          imageUrl: channel.imageUrl,
          isMember: channel.viewerContext.isMember,
          canCast: channel.viewerContext.canCast ?? false,
        }) satisfies SelectorChannel,
    );
  }, [channels]);

  if (!channels) {
    return (
      <FullScreenLoadingIndicator debugName="CastChannelSelectorPromptAutoDisplaying" />
    );
  }

  return (
    <CastChannelSelectorList
      allChannels={selectorChannels}
      onChannelSelect={onChannelSelect}
      onEndReached={onEndReached}
    />
  );
};

interface CastChannelSelectorListProps {
  allChannels: SelectorChannel[];
  onChannelSelect: OnChannelSelectFunc;
  onEndReached?: () => unknown;
}

const CastChannelSelectorList: React.FC<CastChannelSelectorListProps> = ({
  allChannels,
  onChannelSelect,
  onEndReached,
}) => {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  const { hideGlobalPrompt } = useGlobalPrompts();
  const { forceClose } = useBottomSheet();

  const { trackEvent } = useAnalytics();

  const closePrompt = React.useCallback(async () => {
    hideGlobalPrompt();

    forceClose();
  }, [forceClose, hideGlobalPrompt]);

  const onChannelPress = React.useCallback(
    async ({ channelKey }: { channelKey?: string }) => {
      triggerImpactAsync();

      if (typeof channelKey !== 'undefined') {
        trackEvent(AnalyticsEvent.SelectChannelForCast, undefined);
      }

      onChannelSelect({ channelKey });

      closePrompt();
    },
    [closePrompt, onChannelSelect, trackEvent, triggerImpactAsync],
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: SelectorChannel; index: number }) => {
      const { key, imageUrl, followerCount, canCast } = item;

      const homeSelectorRow = key === 'Home';

      return (
        <TouchableOpacity
          key={key}
          onPress={() => {
            if (homeSelectorRow) {
              onChannelPress({
                channelKey: undefined,
              });
            } else {
              onChannelPress({
                channelKey: key,
              });
            }
          }}
          activeOpacity={0.5}
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.pT3,
            t.pB3,
            t.mX4,
            t.borderDefault,
            index !== 0 && t.borderTHairline,
          ]}
          disabled={!canCast}
        >
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.roundedLg,
              { gap: 8 },
              !canCast && t.opacity25,
            ]}
          >
            {homeSelectorRow ? (
              <View
                style={[
                  t.flex,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.roundedFull,
                  { backgroundColor: '#EDE8F8', width: 20, height: 20 },
                ]}
              >
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12.9705 2.59061C12.4107 2.11563 11.5893 2.11563 11.0295 2.59061L3.52953 8.95425C3.19364 9.23925 3 9.6575 3 10.098V19.5008C3 20.3292 3.67157 21.0008 4.5 21.0008H9.25C9.66421 21.0008 10 20.665 10 20.2508V14.0008H14V20.2508C14 20.665 14.3358 21.0008 14.75 21.0008H19.5C20.3284 21.0008 21 20.3292 21 19.5008V10.098C21 9.6575 20.8064 9.23925 20.4705 8.95425L12.9705 2.59061Z"
                    fill="#7C65C1"
                  />
                </Svg>
              </View>
            ) : (
              <ChannelRemoteImage
                channelImageUrl={imageUrl}
                size="composer-selector-large"
              />
            )}
            <Text style={[t.textLg, t.texts.primary]} numberOfLines={1}>
              {key}
            </Text>
          </View>
          {!homeSelectorRow &&
            (canCast ? (
              <View
                style={[
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  { width: 60 },
                  t.justifyStart,
                ]}
              >
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.33341 5.33268C2.33341 3.30765 3.97501 1.66602 6.00003 1.66602C8.02505 1.66602 9.66664 3.30765 9.66664 5.33268C9.66664 6.59234 9.03145 7.70365 8.06389 8.36376C10.3069 9.18543 11.9226 11.308 11.9973 13.8178C12.0055 14.0938 11.7884 14.3242 11.5124 14.3325C11.2363 14.3407 11.0059 14.1236 10.9977 13.8476C10.9176 11.1565 8.71062 8.99935 5.99997 8.99935C3.28932 8.99935 1.08232 11.1565 1.00222 13.8476C0.994009 14.1236 0.763591 14.3407 0.487571 14.3325C0.211551 14.3242 -0.00554796 14.0938 0.00266707 13.8178C0.0773658 11.308 1.69309 9.18538 3.93612 8.36373C2.96859 7.70362 2.33341 6.59232 2.33341 5.33268ZM6.00003 2.66602C4.52731 2.66602 3.33341 3.85992 3.33341 5.33268C3.33341 6.80545 4.52731 7.99935 6.00003 7.99935C7.47275 7.99935 8.66664 6.80545 8.66664 5.33268C8.66664 3.85992 7.47275 2.66602 6.00003 2.66602Z"
                    fill={t.colors.text.tertiary}
                  />
                  <Path
                    d="M11.5267 5.33268C11.4282 5.33268 11.3317 5.33969 11.2375 5.35316C10.9642 5.39226 10.7109 5.20235 10.6718 4.92899C10.6327 4.65563 10.8226 4.40233 11.0959 4.36323C11.2369 4.34308 11.3807 4.33268 11.5267 4.33268C13.1946 4.33268 14.5466 5.68479 14.5466 7.35268C14.5466 8.33657 14.0761 9.20994 13.3491 9.76095C14.9034 10.4577 15.9866 12.0182 15.9866 13.8327C15.9866 14.1088 15.7628 14.3327 15.4866 14.3327C15.2105 14.3327 14.9866 14.1088 14.9866 13.8327C14.9866 12.2688 13.9487 10.946 12.5229 10.5181L12.1666 10.4112V9.29391L12.4402 9.15494C13.0978 8.82077 13.5466 8.13871 13.5466 7.35268C13.5466 6.23706 12.6423 5.33268 11.5267 5.33268Z"
                    fill={t.colors.text.tertiary}
                  />
                </Svg>
                <Text style={[t.mL1, t.texts.tertiary]}>
                  {formatShorthandNumber(followerCount || 0)}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  t.justifyStart,
                  { marginRight: 2, marginTop: 1.25 },
                ]}
              >
                <Text style={[t.texts.tertiary]}>Not available</Text>
              </View>
            ))}
        </TouchableOpacity>
      );
    },
    [onChannelPress, t],
  );

  const { bottom: marginBottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        t.flex,
        t.wFull,
        t.flexCol,
        { minHeight: 480, height: 480, marginBottom },
      ]}
    >
      <BottomSheetScrollView
        contentContainerStyle={[t.wFull, { height: 480 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <FlatList
          data={allChannels}
          renderItem={renderItem}
          initialNumToRender={16}
          showsVerticalScrollIndicator={true}
          onEndReached={onEndReached}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetScrollView>
    </View>
  );
};

export { CastChannelSelectorPromptAutoDisplaying };
