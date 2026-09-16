import { Octicons } from '@expo/vector-icons';
import { useChannelFromGlobalCache } from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  hitSlopSm,
  Typography,
  useHaptics,
} from 'farcaster-expo';
import React, { FC } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { ChannelRemoteImage } from '~/components/ChannelsV3/ChannelRemoteImage';
import {
  channelTagBackgroundColorGenerator,
  channelTagTextColorGenerator,
} from '~/components/ChannelsV3/ChannelTagPressable';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { hitSlopLg } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';

interface ComposerChannelTagProps {
  channelKey: string | undefined;
  onChannelTagPress: () => void;
  resetSelectedChannel: () => void;
}

const ComposerChannelTag: FC<ComposerChannelTagProps> = (props) => {
  const { triggerImpactAsync } = useHaptics();

  const channelKey = props?.channelKey;
  const onChannelTagPress = props?.onChannelTagPress;
  const resetSelectedChannel = props?.resetSelectedChannel;

  const handlePress = React.useCallback(() => {
    onChannelTagPress?.();
  }, [onChannelTagPress]);

  const handleResetSelectedChannel = React.useCallback(() => {
    resetSelectedChannel?.();
  }, [resetSelectedChannel]);
  const t = useTheme();
  const wrapperStyle = React.useMemo(
    () => [
      t.mR2,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.pX3,
      t.pY2,
      {
        backgroundColor: channelTagBackgroundColorGenerator({
          inversed: false,
          dark: t.dark,
        }),
        borderRadius: 20,
      },
    ],
    [t.dark, t.flex, t.flexRow, t.itemsCenter, t.mR2, t.pX3, t.pY2],
  );

  if (typeof channelKey === 'undefined' || channelKey === '') {
    return (
      <AnimatedPressable
        hitSlop={hitSlopSm}
        onPress={() => {
          triggerImpactAsync();

          handlePress();
        }}
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.pX3,
          t.pY2,
          { borderRadius: 100 },
          t.border,
          t.borderDashed,
          t.borders.secondary,
        ]}
      >
        <Typography label="Medium/S" color="secondary">
          Channel
        </Typography>
      </AnimatedPressable>
    );
  }

  return (
    <TouchableOpacity
      hitSlop={hitSlopLg}
      activeOpacity={0.75}
      onPress={handlePress}
      style={wrapperStyle}
    >
      <React.Suspense fallback={<ComposerChannelTagContentFallback />}>
        <ComposerChannelTagInner
          channelKey={channelKey}
          resetSelectedChannel={handleResetSelectedChannel}
        />
      </React.Suspense>
    </TouchableOpacity>
  );
};

interface ComposerChannelTagInnerProps {
  channelKey: string;
  resetSelectedChannel?: () => void;
}

const ComposerChannelTagInner: React.FC<ComposerChannelTagInnerProps> = ({
  channelKey,
  resetSelectedChannel,
}) => {
  const { data: channel } = useChannelFromGlobalCache({
    key: channelKey,
  });

  const t = useTheme();

  const channelTagTextStyle = React.useMemo(
    () => [
      t.mL1,
      t.fontMedium,
      {
        color: channelTagTextColorGenerator({
          inversed: false,
          dark: t.dark,
        }),
        fontSize: 15,
        lineHeight: 20,
        letterSpacing: -0.25,
      },
    ],
    [t.dark, t.fontMedium, t.mL1],
  );

  React.useEffect(() => {
    if (!channel.viewerContext.canCast) {
      resetSelectedChannel?.();
    }
  }, [channel.viewerContext.canCast, resetSelectedChannel]);

  if (!channel.viewerContext.canCast) {
    return <ComposerChannelTagContentFallback />;
  }

  return (
    <>
      <ChannelRemoteImage
        channelImageUrl={channel?.imageUrl}
        size="composer-quick-selector"
      />
      <Text style={channelTagTextStyle}>{channelKey}</Text>
      <Octicons
        name="chevron-down"
        size={16}
        style={[{ color: '#7C65C1' }, t.mL1]}
      />
    </>
  );
};

ComposerChannelTagInner.displayName = 'ComposerChannelTagContentChannelsV3';

const ComposerChannelTagContentFallback: React.FC = () => {
  const t = useTheme();

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        t.p1,
        t.mR4,
        t.roundedLg,
        t.borderDefault,
        t.borderHairline,
        t.bgPillActive,
      ]}
    >
      <LoadingIndicator style={[{ width: 20, height: 20 }]} />
      <Octicons
        name="chevron-down"
        size={16}
        style={[{ color: '#8565cb', marginTop: 2 }, t.mL2]}
      />
    </View>
  );
};

ComposerChannelTagContentFallback.displayName =
  'ComposerChannelTagContentFallback';

ComposerChannelTag.displayName = 'ComposerChannelTag';

export { ComposerChannelTag };
