import { Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { shareUrl } from '~/utils/SharingUtils';

const StarterPackBackgroundImage = require('~/assets/images/StarterPack_2.webp');

export function NewStarterPackModal({
  onDismiss,
  starterPack,
}: {
  onDismiss: () => void;
  starterPack: ApiStarterPack;
}) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const modalRef = React.useRef<{ dismiss: () => void }>(null);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewStarterPackCreatedModal, {});
  }, [trackEvent]);

  const onSharePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressShareStarterPack, {
      via: 'starter pack created',
      starterPackId: starterPack.id,
      starterPackName: starterPack.name,
    });

    shareUrl({
      title: starterPack.name,
      url: `https://farcaster.xyz/${starterPack.creator.username}/pack/${starterPack.id}`,
    });
  }, [
    starterPack.creator.username,
    starterPack.id,
    starterPack.name,
    trackEvent,
  ]);

  return (
    <AutoDisplayingBottomSheetModal
      name="newStarterPackModal"
      onDismiss={onDismiss}
      ref={modalRef}
    >
      <View style={[t.flex, t.flexCol, { gap: 12 }]}>
        <View style={[t.flex, t.flexCol, { gap: 4 }]}>
          <Text2 size="2xl" weight="semibold">
            Share starter pack
          </Text2>
          <Text2 size="lg" weight="regular" color="secondary">
            Share this starter pack to help your friends curate a community
          </Text2>
        </View>
        <View
          style={[
            t.flex,
            t.justifyCenter,
            t.itemsCenter,
            t.roundedLg,
            t.borderTabViewActive,
            t.borderHairline,
            t.flexRow,
            t.wFull,
            t.shadow,
            t.overflowHidden,
            t.relative,
            { height: 180 },
          ]}
        >
          <Image
            source={StarterPackBackgroundImage}
            contentPosition={'top left'}
            contentFit="cover"
            style={[t.absolute, t.inset0, { aspectRatio: 1.91 }]}
          />
          <View style={[t.flex, t.flexCol, t.itemsCenter, t.justifyCenter]}>
            <Text2 weight="semibold" size={'2xl'} color="inverted">
              {starterPack.name}
            </Text2>
            <Text2
              weight="regular"
              size={'base'}
              color="inverted"
              style={[{ opacity: 80 }]}
            >
              {`Starter pack by ${resolveUsername({
                fid: starterPack.creator.fid,
                username: starterPack.creator.username,
              })}`}
            </Text2>
          </View>
        </View>
        <ButtonV2
          title="Share link"
          variant="secondary"
          Icon={({ color }) => (
            <Octicons name="share" color={color} size={16} />
          )}
          onPress={onSharePress}
        />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
