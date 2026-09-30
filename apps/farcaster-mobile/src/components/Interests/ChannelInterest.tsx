import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiInterestChannel } from 'farcaster-client-data';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { RemoteImage } from '~/components/RemoteImage';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useSelectedInterests } from '~/contexts/SelectedInterestsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

type ChannelInterestProps = {
  interest: ApiInterestChannel;
};

const ChannelInterest: React.FC<ChannelInterestProps> = React.memo(
  ({ interest }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const { trackEvent } = useAnalytics();

    const [interested, setInterested] = React.useState<boolean>(false);

    const { addChannelSelectedInterest, removeChannelSelectedInterest } =
      useSelectedInterests();

    const channel = React.useMemo(() => {
      return interest.content.channel;
    }, [interest.content.channel]);

    const onChannelPress = React.useCallback(() => {
      if (!interested) {
        trackEvent(AnalyticsEvent.SelectOnboardingInterest, {
          channel: channel.key,
        });

        triggerImpactAsync();
      }

      if (!interested) {
        addChannelSelectedInterest({ channelKey: channel.key });
      } else {
        removeChannelSelectedInterest({ channelKey: channel.key });
      }

      setInterested((interested) => !interested);
    }, [
      addChannelSelectedInterest,
      channel.key,
      interested,
      removeChannelSelectedInterest,
      trackEvent,
      triggerImpactAsync,
    ]);

    const channelImageUri = React.useMemo(() => {
      return channel.fastImageUrl || channel.imageUrl;
    }, [channel.fastImageUrl, channel.imageUrl]);

    return (
      <TouchableOpacity
        onPress={onChannelPress}
        activeOpacity={0.75}
        style={[t.flex, t.flex1, t.flexCol, t.itemsCenter, t.p1, t.pB2]}
      >
        <>
          <View
            style={[
              t.roundedLg,
              t.h26,
              t.w26,
              t.relative,
              interested ? [t.shadow, t.borderDefault, t.borderHairline] : [],
            ]}
          >
            <RemoteImage
              contentFit="cover"
              uri={channelImageUri}
              style={[t.flexGrow, t.roundedLg]}
              fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
              shouldFadeIn={true}
            />
            {interested && (
              <View
                style={[
                  t.bgBlack,
                  t.rounded,
                  t.absolute,
                  t.top0,
                  t.right0,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.h4,
                  t.w4,
                  t.mR2,
                  t.mT2,
                  t.fontSemibold,
                ]}
              >
                <Octicons
                  name={'check'}
                  size={12}
                  style={[t.fontSemibold, { color: '#ffffff' }]}
                />
              </View>
            )}
          </View>
          <Text
            style={[t.flex1, t.texts.primary, t.mT1, t.textXs]}
            numberOfLines={1}
          >
            {channel.name}
          </Text>
        </>
      </TouchableOpacity>
    );
  },
);

export { ChannelInterest };
