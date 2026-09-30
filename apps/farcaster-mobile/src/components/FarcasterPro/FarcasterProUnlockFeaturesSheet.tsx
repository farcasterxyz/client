import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  AutoDisplayingBottomSheetModal,
  ButtonV2,
  Text2,
} from 'farcaster-expo';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { RootNativeStackParamList } from '~/types';

import { FarcasterProBadge } from './FarcasterProBadge';

interface FarcasterProUnlockFeaturesSheetProps {
  emphasis: 'banner' | 'cast-length' | 'embeds';
  onDismiss: () => void;
  source: RootNativeStackParamList['FarcasterProUpsell']['source'];
}

const FarcasterProUnlockFeaturesSheet = ({
  emphasis,
  onDismiss,
  source,
}: FarcasterProUnlockFeaturesSheetProps) => {
  const t = useTheme();
  const navigate = useNavigate();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  const bodyText = useMemo(() => {
    switch (emphasis) {
      case 'banner':
        return 'Upgrade to Farcaster Pro to unlock profile banners and more.';
      case 'cast-length':
        return 'Upgrade to Farcaster Pro to unlock 10k character limit casts and more.';
      case 'embeds':
        return 'Upgrade to Farcaster Pro to unlock four embeds per cast and more.';
    }
  }, [emphasis]);

  const handleUpgrade = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    navigate('FarcasterProUpsell', {
      source,
    });
  }, [navigate, source]);

  const onBackdropPress = useCallback(() => {
    DdRum.addAction(RumActionType.CUSTOM, 'backdrop-press', {
      feature: 'farcaster-pro-unlock',
    });
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior={'close'}
        appearsOnIndex={1}
        disappearsOnIndex={-1}
        opacity={0.15}
        onPress={onBackdropPress}
      />
    ),
    [onBackdropPress],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="farcasterProUnlockFeaturesSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      backdropComponent={renderBackdrop}
      displayedInModalPresentationScreen={true}
    >
      <View
        style={[
          t.flex,
          t.flexCol,
          t.justifyBetween,
          { gap: 24, paddingBottom: 16 },
        ]}
      >
        <View style={[t.flexCol, { gap: 16 }]}>
          <View style={[t.flexRow, { gap: 12 }, t.itemsCenter]}>
            <FarcasterProBadge size={36} />
            <Text2 weight="semibold" size="lg">
              Upgrade to Farcaster Pro
            </Text2>
          </View>
          <Text2 color="secondary" size="base" weight="regular">
            {bodyText}
          </Text2>
        </View>
        <View style={[t.flexCol, { gap: 8 }]}>
          <ButtonV2
            title="Upgrade to Pro"
            onPress={handleUpgrade}
            width="full"
            height="normal"
            textSize="lg"
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

export { FarcasterProUnlockFeaturesSheet };
