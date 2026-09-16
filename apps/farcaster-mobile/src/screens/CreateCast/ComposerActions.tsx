import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AnalyticsEvent } from 'farcaster-analytics';
import { Image } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

// ExternalCastActionIcon removed with ExternalCastActions
import { CircleProgressIndicator } from '~/components/CircleProgressIndicator';
import { VideoIcon } from '~/components/icons/VideoIcon';
import { Text } from '~/components/Text';
import { hitSlopXs } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUserLevel } from '~/hooks/data/useUserLevel';

import { ComposerChannelTag } from './ComposerChannelTag';
import { ComposerTickerTag } from './ComposerTickerTag';

type ComposerActionsProps = {
  shouldShowChannelSelector: boolean;
  shouldShowComposerChannelSuggestions: boolean;
  canAddMoreImageEmbeds: boolean;
  channelKey: string | undefined;
  tokenKey: string | undefined;
  castLength: number;
  castText: string;
  onCastChannelSelectorPress: () => void;
  onCastChannelSelect: ({ channelKey }: { channelKey?: string }) => void;
  onSelectImageEmbedPress: (
    mediaTypes: ImagePicker.MediaType[],
  ) => Promise<void>;
  shouldShowQueueCastButton: boolean;
  queueCastButtonDisabled: boolean;
  onQueueCastPress: () => void;
  onTickerTagPress: () => void;
  onTickerTagReset: () => void;
};

const ComposerActions: React.FC<ComposerActionsProps> = ({
  shouldShowChannelSelector,
  shouldShowComposerChannelSuggestions,
  canAddMoreImageEmbeds,
  channelKey,
  castLength,
  onCastChannelSelectorPress,
  onCastChannelSelect,
  onSelectImageEmbedPress,
  shouldShowQueueCastButton,
  queueCastButtonDisabled,
  onQueueCastPress,
  tokenKey,
  onTickerTagPress,
  onTickerTagReset,
}) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const userIsPro = useCurrentUserLevel() === 'pro';

  const { regularCastByteLimit, longCastByteLimit, canUploadVideo } =
    useUserAppContext();

  const castLengthIndicator = React.useMemo(() => {
    const regularCastRemaining = regularCastByteLimit - castLength;
    const longCastRemaining = longCastByteLimit - castLength;

    if (
      regularCastRemaining > 0 &&
      regularCastByteLimit !== longCastByteLimit
    ) {
      const passedAlertThreshold =
        regularCastRemaining < 75 && regularCastByteLimit !== longCastByteLimit;

      const progress = Math.max(
        castLength / regularCastByteLimit - (passedAlertThreshold ? 0.04 : 0),
        0,
      );

      const stroke = '#8565cb';

      return (
        <CircleProgressIndicator
          progress={progress}
          stroke={stroke}
          strokeAlternate={t.colors.borderDefault}
          backgroundColor={t.colors.bgDefault}
        />
      );
    }

    if (longCastRemaining > 25) {
      const passedAlertThreshold = longCastRemaining < 75;

      const progress = Math.max(
        castLength / longCastByteLimit - (passedAlertThreshold ? 0.04 : 0),
        0,
      );

      const stroke = passedAlertThreshold ? t.colors.text.warning : '#8565cb';

      return (
        <CircleProgressIndicator
          progress={progress}
          stroke={stroke}
          strokeAlternate={t.colors.borderDefault}
          backgroundColor={t.colors.bgDefault}
        />
      );
    }

    if (longCastRemaining < 0) {
      return (
        <Text style={[t.texts.danger, t.textSm]}>{longCastRemaining}</Text>
      );
    }

    return (
      <Text style={[t.texts.secondary, t.textSm]}>{longCastRemaining}</Text>
    );
  }, [
    castLength,
    longCastByteLimit,
    regularCastByteLimit,
    t.colors.bgDefault,
    t.colors.borderDefault,
    t.colors.text.warning,
    t.texts.danger,
    t.texts.secondary,
    t.textSm,
  ]);

  const showChannelRow = React.useMemo(() => {
    return shouldShowChannelSelector || shouldShowComposerChannelSuggestions;
  }, [shouldShowChannelSelector, shouldShowComposerChannelSuggestions]);

  const queueCastButton = React.useMemo(() => {
    if (!shouldShowQueueCastButton) {
      return null;
    }
    const darkModeForegroundPlusColor = queueCastButtonDisabled
      ? t.colors.text.tertiary
      : t.colors.text.primary;
    // We can't use bgActionLight in dark mode because it's implemented using an
    // opacity, but we're using an underlay to color the "plus" inside the icon
    const disabledButtonColor = t.dark ? '#392861' : t.colors.bgActionLight;
    return (
      <View style={[t.borderDefault, t.borderLHairline]}>
        <TouchableOpacity
          style={[t.pY2, t.pX4]}
          activeOpacity={0.5}
          hitSlop={hitSlopXs}
          onPress={onQueueCastPress}
          disabled={queueCastButtonDisabled}
        >
          <View>
            <View
              style={[
                t.absolute,
                t.dark ? { backgroundColor: darkModeForegroundPlusColor } : [],
                { borderRadius: 18, width: 18, height: 18, left: 1, top: 1 },
              ]}
            />
            <AntDesign
              name="plus-circle"
              size={20}
              color={
                queueCastButtonDisabled
                  ? disabledButtonColor
                  : t.colors.bgAction
              }
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [
    t.borderDefault,
    t.borderLHairline,
    t.pY2,
    t.pX4,
    shouldShowQueueCastButton,
    onQueueCastPress,
    queueCastButtonDisabled,
    t.absolute,
    t.colors.bgAction,
    t.colors.bgActionLight,
    t.colors.text.primary,
    t.colors.text.tertiary,
    t.dark,
  ]);

  return (
    <View>
      {showChannelRow && (
        <View
          style={[t.wFull, t.flex, t.flexRow, t.itemsCenter, t.p4, { gap: 8 }]}
        >
          {!tokenKey && !channelKey && (
            <ComposerTickerTag
              tokenKey={tokenKey}
              onPress={onTickerTagPress}
              reset={onTickerTagReset}
            />
          )}
          {shouldShowChannelSelector && (
            <ComposerChannelTag
              channelKey={channelKey}
              onChannelTagPress={onCastChannelSelectorPress}
              resetSelectedChannel={() => {
                onCastChannelSelect({ channelKey: undefined });
              }}
            />
          )}
        </View>
      )}
      <View
        style={[
          t.wFull,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.borderTHairline,
          t.borderBHairline,
          t.borderDefault,
          t.pY1,
          t.justifyBetween,
          !showChannelRow && t.mT3,
        ]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.flexGrow]}>
          <TouchableOpacity
            style={[
              t.pY2,
              t.pX4,
              { paddingLeft: 18 },
              canAddMoreImageEmbeds || !userIsPro
                ? [t.opacity100]
                : [t.opacity25],
            ]}
            activeOpacity={0.5}
            onPress={() => {
              trackEvent(AnalyticsEvent.CastComposerImagePressed, {
                canUploadVideo,
                canAddMoreImageEmbeds,
              });
              trackEvent(AnalyticsEvent.CastComposerMediaPressed, {
                source: 'image',
                canUploadVideo,
                canAddMoreImageEmbeds,
              });
              const mediaTypes: ImagePicker.MediaType[] = canUploadVideo
                ? ['videos', 'images', 'livePhotos']
                : ['images', 'livePhotos'];
              onSelectImageEmbedPress(mediaTypes);
            }}
            hitSlop={hitSlopXs}
            disabled={userIsPro && !canAddMoreImageEmbeds}
          >
            <Image
              size={20}
              style={[
                canAddMoreImageEmbeds || !userIsPro
                  ? [t.texts.secondary]
                  : [t.texts.tertiary],
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              t.pY2,
              t.pX4,
              { paddingLeft: 18 },
              canAddMoreImageEmbeds || !userIsPro
                ? [t.opacity100]
                : [t.opacity25],
            ]}
            activeOpacity={0.5}
            onPress={() => {
              trackEvent(AnalyticsEvent.CastComposerVideoPressed, {
                canUploadVideo,
                canAddMoreImageEmbeds,
              });
              trackEvent(AnalyticsEvent.CastComposerMediaPressed, {
                source: 'video',
                canUploadVideo,
                canAddMoreImageEmbeds,
              });
              onSelectImageEmbedPress(['videos']);
            }}
            hitSlop={hitSlopXs}
            disabled={userIsPro && !canAddMoreImageEmbeds}
          >
            <VideoIcon
              size={20}
              color={
                canAddMoreImageEmbeds || !userIsPro
                  ? t.colors.text.secondary
                  : t.colors.text.tertiary
              }
              bgColor={t.colors.bgDefault}
            />
          </TouchableOpacity>
        </View>
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <View style={[t.pX4]}>{castLengthIndicator}</View>
          {queueCastButton}
        </View>
      </View>
    </View>
  );
};

export { ComposerActions };
