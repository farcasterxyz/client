import { Octicons } from '@expo/vector-icons';
import {
  BottomSheetView,
  TouchableOpacity,
  useBottomSheet,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel, ApiChannelBasic } from 'farcaster-client-data';
import {
  formatFollowCount,
  sleep,
  useSetUserPreferences,
  useStartChannelStreak,
  useUserFollowingChannels,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';
import {
  Alert,
  Image,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Prompt } from '~/components/prompts/Prompt';
import { RemoteImage } from '~/components/RemoteImage';
import { Text } from '~/components/Text';
import { easing } from '~/constants/Animated';
import { startChannelStreakPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

import { PromptScrollView } from './PromptScrollView';

const StreakDarkModeStart = require('~/assets/images/StreakDarkModeStart.webp');
const StreakLightModeStart = require('~/assets/images/StreakLightModeStart.webp');
const StreakDarkModeSuccess = require('~/assets/images/StreakDarkModeSuccess.webp');
const StreakLightModeSuccess = require('~/assets/images/StreakLightModeSuccess.webp');

const ChannelStreaksPrompt: FC = memo(() => {
  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();

  const shouldPresent = useCallback(() => {
    const should = activePromptKey === startChannelStreakPromptKey;

    return should;
  }, [activePromptKey]);

  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 200,
    easing,
  });

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'30%'}
      enableDynamicSizing={true}
      storageKey={startChannelStreakPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={true}
      animationConfigs={animationConfigs}
    >
      <ChannelStreaksPromptContent />
    </Prompt>
  );
});

ChannelStreaksPrompt.displayName = 'ChannelStreaksPrompt';

type ChannelStreaksChannelSelectorProps = {
  onChannelSelect: ({ channel }: { channel: ApiChannel }) => void;
};

const ChannelStreaksChannelSelector: React.FC<ChannelStreaksChannelSelectorProps> =
  React.memo(({ onChannelSelect }) => {
    const t = useTheme();

    const { bottom } = useSafeAreaInsets();

    const { data, onEndReached } = useUserFollowingChannels({
      forComposer: false,
    });

    const channels = React.useMemo(
      () =>
        data!.pages
          .flatMap((page) => page.result.channels)
          .filter((channel) => channel.type === 'channel') || [],
      [data],
    );

    const renderItem = React.useCallback(
      ({ item: channel, index }: { item: ApiChannel; index: number }) => {
        return (
          <View
            key={channel.key}
            style={[
              t.pY3,
              t.pX4,
              index !== 0 && [t.borderDefault, t.borderTHairline],
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                onChannelSelect({ channel });
              }}
              activeOpacity={0.75}
              style={[t.flexRow, t.itemsCenter, { gap: 8 }]}
            >
              <RemoteImage
                contentFit="cover"
                width={24}
                height={24}
                uri={channel.imageUrl}
                style={[t.roundedFull, t.borderDefault, t.borderHairline]}
                fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
                shouldFadeIn={false}
              />
              <Text style={[t.textBase, t.texts.primary]} numberOfLines={1}>
                /{channel.key}
              </Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <Octicons
                  name={'person'}
                  size={10}
                  style={[t.texts.secondary, { marginRight: 2, paddingTop: 1 }]}
                />
                <Text style={[t.textXs, t.texts.secondary]}>
                  {formatFollowCount({
                    followCount: channel.followerCount || 0,
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      },
      [
        onChannelSelect,
        t.borderDefault,
        t.borderHairline,
        t.borderTHairline,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.pX4,
        t.pY3,
        t.roundedFull,
        t.textBase,
        t.texts.primary,
        t.texts.secondary,
        t.textXs,
      ],
    );

    return (
      <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull, t.mB4]}>
        <Text
          style={[
            t.textBase,
            t.texts.primary,
            t.textXl,
            t.fontExtrabold,
            t.mB5,
          ]}
        >
          Pick a channel
        </Text>
        <Text style={[t.texts.primary, t.textBase, t.mB4]}>
          You can only have 1 streak at a time. You cannot change the channel
          until the streak ends.
        </Text>
        <View
          style={[
            t.wFull,
            t.flex,
            t.flexRow,
            t.justifyBetween,
            { marginBottom: Math.max(bottom, sizes.s2) },
          ]}
        >
          <PromptScrollView
            style={[
              t.flex,
              t.flexCol,
              t.bgFrameActionsUnderneath,
              t.rounded,
              t.flexGrow,
              t.wFull,
              t.mT2,
              { minHeight: 120, maxHeight: 300 },
            ]}
          >
            <FlashList
              data={channels}
              keyExtractor={(item) => item.key}
              horizontal={false}
              onEndReached={onEndReached}
              keyboardShouldPersistTaps="handled"
              {...STANDARD_FLASHLIST_PERF_PROPS}
              renderItem={renderItem}
            />
          </PromptScrollView>
        </View>
      </View>
    );
  });

const ChannelStreaksPromptContent: FC = () => {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const { trackEvent } = useAnalytics();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const { triggerImpactAsync } = useHaptics();

  const push = usePush();

  const openComposer = useOpenComposer();

  const { bottom } = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ShowStartChannelStreaksPrompt, {});
    }, [trackEvent]),
  );

  const [choosingChannel, setChoosingChannel] = React.useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = React.useState<
    ApiChannelBasic | undefined
  >(undefined);

  const startChannelStreak = useStartChannelStreak();

  const setUserPreferences = useSetUserPreferences();

  const onChannelSelect = React.useCallback(
    async ({ channel }: { channel: ApiChannel }) => {
      triggerImpactAsync();

      trackEvent(AnalyticsEvent.PressSelectChannelChannelStreakPrompt, {
        channelKey: channel.key,
      });

      const streakChannel = {
        description: channel.description || '',
        followerCount: channel.followerCount || 0,
        imageUrl: channel.imageUrl || NFT_IMAGE_UNAVAILABLE_SOURCE.uri!,
        key: channel.key,
        name: channel.name,
      };

      await startChannelStreak({
        fid: currentUserFid,
        channel: streakChannel,
      });

      setSelectedChannel(streakChannel);
      setChoosingChannel(false);
    },
    [currentUserFid, startChannelStreak, trackEvent, triggerImpactAsync],
  );

  const closePrompt = React.useCallback(async () => {
    const transitionDuration = 200;

    forceClose({ duration: transitionDuration });
    hideGlobalPrompt();

    await sleep(transitionDuration);
  }, [forceClose, hideGlobalPrompt]);

  const { width: windowWidth } = useWindowDimensions();
  const { width: startIllustrationWidth, height: startIllustrationHeight } =
    Image.resolveAssetSource(StreakDarkModeStart);
  const startIllustrationRenderHeight =
    windowWidth * (startIllustrationHeight / startIllustrationWidth);
  const { width: successIllustrationWidth, height: successIllustrationHeight } =
    Image.resolveAssetSource(StreakLightModeSuccess);
  const successIllustrationRenderHeight =
    windowWidth * (successIllustrationHeight / successIllustrationWidth);

  const sheet = React.useMemo(() => {
    if (choosingChannel) {
      return (
        <React.Suspense
          fallback={
            <View
              style={[
                t.wFull,
                t.itemsCenter,
                t.justifyCenter,
                { height: sizes.s42 },
              ]}
            >
              <LoadingIndicator />
            </View>
          }
        >
          <ChannelStreaksChannelSelector onChannelSelect={onChannelSelect} />
        </React.Suspense>
      );
    } else if (typeof selectedChannel !== 'undefined') {
      return (
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull, t.mB4]}>
          <Text
            style={[t.textBase, t.texts.primary, t.textXl, t.fontExtrabold]}
          >
            You're all set!
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.mY2]}>
            Cast in /{selectedChannel.key} to get started.
          </Text>
          <View
            style={[
              t.wFull,
              t.relative,
              t.mB4,
              { height: successIllustrationRenderHeight },
            ]}
          >
            <Image
              source={t.dark ? StreakDarkModeSuccess : StreakLightModeSuccess}
              style={[t.wFull, t.hFull]}
              resizeMode={'contain'}
            />
            <View
              style={[
                t.top0,
                t.absolute,
                t.selfCenter,
                t.alignCenter,
                t.bgDefault,
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.pX2,
                t.pY1,
                t.rounded,
                {
                  gap: 8,
                  paddingBottom: 6,
                  marginTop: successIllustrationRenderHeight / 1.65,
                },
              ]}
            >
              <RemoteImage
                contentFit="cover"
                width={18}
                height={18}
                uri={selectedChannel.imageUrl}
                style={[t.roundedFull, t.borderDefault, t.borderHairline]}
                fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
                shouldFadeIn={false}
              />
              <Text style={[t.textSm, t.texts.primary]} numberOfLines={1}>
                /{selectedChannel.key}
              </Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <Octicons
                  name={'person'}
                  size={10}
                  style={[t.texts.secondary, { marginRight: 2, paddingTop: 1 }]}
                />
                <Text style={[t.textXs, t.texts.secondary]}>
                  {formatFollowCount({
                    followCount: selectedChannel.followerCount || 0,
                  })}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[
              t.wFull,
              t.flex,
              t.flexRow,
              t.justifyBetween,
              { marginBottom: Math.max(bottom, sizes.s2) },
            ]}
          >
            <Pressable
              style={[
                t.flex,
                { width: '48%', minWidth: '48%' },
                t.flexShrink0,
                t.itemsCenter,
                t.justifyCenter,
                t.textCenter,
                t.bgTransparent,
                t.roundedLg,
                t.pX3,
                t.pY4,
                t.borderDefault,
                t.borderHairline,
              ]}
              onPress={async () => {
                trackEvent(
                  AnalyticsEvent.PressGoToChannelChannelStreakPrompt,
                  undefined,
                );

                await closePrompt();

                push('Channel', { channelKey: selectedChannel.key });
              }}
            >
              <Text
                style={[
                  t.wFull,
                  t.texts.tertiary,
                  t.textBase,
                  t.textCenter,
                  t.fontSemibold,
                ]}
              >
                Go to channel
              </Text>
            </Pressable>
            <Pressable
              style={[
                t.flex,
                { width: '48%', minWidth: '48%' },
                t.flexShrink0,
                t.itemsCenter,
                t.justifyCenter,
                t.textCenter,
                t.roundedLg,
                t.bgActionFrameTx,
                t.pX3,
                t.pY4,
              ]}
              onPress={async () => {
                trackEvent(
                  AnalyticsEvent.PressCastNowChannelStreakPrompt,
                  undefined,
                );

                await closePrompt();

                setTimeout(() => {
                  openComposer(
                    createCastParamsWithIntent({
                      channelKey: selectedChannel.key,
                    }),
                  );
                }, 350);
              }}
            >
              <Text
                style={[
                  t.textBase,
                  t.fontSemibold,
                  t.texts.light,
                  t.textCenter,
                ]}
              >
                Cast now
              </Text>
            </Pressable>
          </View>
        </View>
      );
    } else {
      return (
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <Text
            style={[t.textBase, t.texts.primary, t.textXl, t.fontExtrabold]}
          >
            Showcase your favorite channel
          </Text>
          <Image
            source={t.dark ? StreakDarkModeStart : StreakLightModeStart}
            style={[t.mB4, t.wFull, { height: startIllustrationRenderHeight }]}
            resizeMode={'cover'}
          />
          <Text style={[t.texts.primary, t.textBase, t.mB4]}>
            Here's how it works:
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.mB2]}>
            1. Pick a channel for your streak
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.mB2]}>
            2. Cast or reply daily to keep your streak alive
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.mB2]}>
            3. Miss a day and it resets to 0
          </Text>
          <View
            style={[
              t.wFull,
              t.flex,
              t.flexRow,
              t.justifyBetween,
              t.mT4,
              { marginBottom: Math.max(bottom, sizes.s2) },
            ]}
          >
            <Pressable
              style={[
                t.flex,
                { width: '48%', minWidth: '48%' },
                t.flexShrink0,
                t.itemsCenter,
                t.justifyCenter,
                t.textCenter,
                t.bgTransparent,
                t.roundedLg,
                t.pX3,
                t.pY4,
              ]}
              onPress={() => {
                trackEvent(
                  AnalyticsEvent.PressNotInterestedChannelStreakPrompt,
                  undefined,
                );

                Alert.alert(
                  'Are you sure you want to opt-out?',
                  'Opting out will remove the streak indicator from your profile and stop streak notifications.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Yes, opt-out',
                      style: 'default',
                      onPress: async () => {
                        void setUserPreferences({
                          preferences: { optOutChannelStreaks: true },
                        }).catch(trackError);

                        forceClose();
                        hideGlobalPrompt();
                      },
                    },
                  ],
                );
              }}
            >
              <Text
                style={[t.wFull, t.texts.tertiary, t.textBase, t.textCenter]}
              >
                I'm not interested
              </Text>
            </Pressable>
            <Pressable
              style={[
                t.flex,
                { width: '48%', minWidth: '48%' },
                t.flexShrink0,
                t.itemsCenter,
                t.justifyCenter,
                t.textCenter,
                t.roundedLg,
                t.bgActionFrameTx,
                t.pX3,
                t.pY4,
              ]}
              onPress={async () => {
                trackEvent(
                  AnalyticsEvent.PressLetsGoChannelStreaksPrompt,
                  undefined,
                );

                setChoosingChannel(true);
              }}
            >
              <Text
                style={[
                  t.textBase,
                  t.fontSemibold,
                  t.texts.light,
                  t.textCenter,
                ]}
              >
                Let's go
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }
  }, [
    bottom,
    choosingChannel,
    closePrompt,
    forceClose,
    hideGlobalPrompt,
    onChannelSelect,
    openComposer,
    selectedChannel,
    setUserPreferences,
    startIllustrationRenderHeight,
    successIllustrationRenderHeight,
    t.absolute,
    t.alignCenter,
    t.bgActionFrameTx,
    t.bgDefault,
    t.bgTransparent,
    t.borderDefault,
    t.borderHairline,
    t.dark,
    t.flex,
    t.flexCol,
    t.flexRow,
    t.flexShrink0,
    t.fontExtrabold,
    t.fontSemibold,
    t.hFull,
    t.itemsCenter,
    t.itemsStart,
    t.justifyBetween,
    t.justifyCenter,
    t.mB2,
    t.mB4,
    t.mT4,
    t.mY2,
    t.pX2,
    t.pX3,
    t.pY1,
    t.pY4,
    t.relative,
    t.rounded,
    t.roundedFull,
    t.roundedLg,
    t.selfCenter,
    t.textBase,
    t.textCenter,
    t.textSm,
    t.textXl,
    t.textXs,
    t.texts.light,
    t.texts.primary,
    t.texts.secondary,
    t.texts.tertiary,
    t.top0,
    t.wFull,
    trackEvent,
    push,
  ]);

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pY2,
          t.wFull,
          { minHeight: 100 },
        ]}
      >
        {sheet}
      </View>
    </BottomSheetView>
  );
};

ChannelStreaksPromptContent.displayName = 'ChannelStreaksPromptContent';

export { ChannelStreaksPrompt };
