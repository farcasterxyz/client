import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  useFarcasterProIsEligibleForLimitedEditionNft,
  useSubscriptionsGetActiveSubscription,
} from 'farcaster-client-hooks';
import {
  AutoDisplayingBottomSheetModal,
  ButtonV2,
  Text2,
} from 'farcaster-expo';
import { CalendarIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

import { FarcasterProBadge } from './FarcasterProBadge';

const FarcasterProUserProfileSheet = ({
  fid,
  onDismiss,
}: {
  fid: number;
  onDismiss: () => void;
}) => {
  const { data: subscription } = useSubscriptionsGetActiveSubscription({
    type: 'farcaster-pro',
    fid,
  });
  const { data: isEligibleForLimitedEditionNft } =
    useFarcasterProIsEligibleForLimitedEditionNft({
      fid,
    });

  const isPro = useCurrentUserLevel() === 'pro';
  const t = useTheme();

  const { checkUserAppContextGate } = useUserAppContextGate();
  const canAccessProUpsells = checkUserAppContextGate('pro-upsells').value;

  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  const subscriptionDate = useMemo(() => {
    if (subscription?.startDate) {
      return new Date(subscription.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return null;
  }, [subscription?.startDate]);

  const navigate = useNavigate();

  const bodyText = useMemo(() => {
    if (isEligibleForLimitedEditionNft) {
      return 'One of the first 10,000 to support Farcaster with a Pro subscription, will receive an early supporter NFT.';
    }
    return 'This account supports Farcaster with a Pro subscription.';
  }, [isEligibleForLimitedEditionNft]);

  const onBackdropPress = useCallback(() => {
    DdRum.addAction(RumActionType.CUSTOM, 'backdrop-press', {
      feature: 'farcaster-pro-profile-sheet',
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
      name="earlyAdopbetDetailsBottomSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      backdropComponent={renderBackdrop}
    >
      <View
        style={[
          t.flexGrow,
          t.flex,
          t.flexCol,
          t.justifyBetween,
          { gap: 16 },
          isPro && t.mB2,
        ]}
      >
        <Text2 weight="semibold" size="lg">
          Farcaster Pro account
        </Text2>
        <View style={[t.flexRow, { maxWidth: '90%', gap: 8 }]}>
          <FarcasterProBadge size={24} />
          <Text2 color="secondary" size="base" weight="regular">
            {bodyText}
          </Text2>
        </View>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <CalendarIcon
            size={22}
            color={t.colors.text.secondary}
            style={[{ marginRight: 2, marginLeft: 1 }]}
          />
          <Text2 color="secondary" size="base" weight="regular">
            Pro since {subscriptionDate}.
          </Text2>
        </View>
        {!isPro && canAccessProUpsells && (
          <ButtonV2
            title="Upgrade to Pro"
            onPress={() => {
              bottomSheetRef.current?.dismiss();
              navigate('FarcasterProUpsell', {
                source: 'profile',
              });
            }}
            width="full"
            height="normal"
            textSize="lg"
          />
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

export { FarcasterProUserProfileSheet };
