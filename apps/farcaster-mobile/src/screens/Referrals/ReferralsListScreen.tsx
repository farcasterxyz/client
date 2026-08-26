import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  type ApiReferralCodeClaims,
  formatDisplayDollars,
} from 'farcaster-client-data';
import { useReferralsList } from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  SkeletonPlaceholder,
  Typography,
  useHaptics,
} from 'farcaster-expo';
import React, { useCallback, useEffect } from 'react';
import { FlatList, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { CommonStackParamList } from '~/types';

type ReferralsListScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ReferralsList'
>;

const ReferralsListScreen = buildScreen<ReferralsListScreenProps>(
  { name: 'ReferralsList' },
  () => {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewReferralsListScreen, {});
    }, [trackEvent]);

    return <ReferralsListScreenContent />;
  },
);

ReferralsListScreen.displayName = 'ReferralsListScreen';

function ReferralsListScreenContent() {
  const t = useTheme();
  const {
    flatData: referrals = [],
    isLoading,
    onEndReached,
    refetch,
  } = useReferralsList();

  const handleRefresh = useCallback(async () => {
    refetch();
  }, [refetch]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch: handleRefresh,
  });

  const renderItem = useCallback(
    ({ item, index }: { item: ApiReferralCodeClaims; index: number }) => (
      <ReferralItem referral={item} index={index} />
    ),
    [],
  );

  if (isLoading) {
    return (
      <SkeletonPlaceholder
        style={[t.wFull, t.roundedLg, t.backgrounds.secondary, t.p3, t.h15]}
      />
    );
  }

  return (
    <View style={[t.gap3, t.flex1, t.justifyStart, t.pY6, t.mX3]}>
      <FlatList
        data={referrals}
        style={t.flexGrow}
        contentContainerStyle={[t.gap1_5, t.justifyStart]}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          `${item.claimer?.fid}-${item.claimedAt}-${index}`
        }
        ListEmptyComponent={<EmptyComponent />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={refreshControl}
        ListHeaderComponent={
          <ReferralsListHeader isEmpty={referrals.length === 0} />
        }
      />
    </View>
  );
}

type ReferralsListHeaderProps = {
  isEmpty: boolean;
};

function ReferralsListHeader({ isEmpty }: ReferralsListHeaderProps) {
  const t = useTheme();

  if (isEmpty) {
    return null;
  }

  return (
    <View style={[t.pB2, t.flexRow, t.justifyBetween, t.wFull, t.pX3]}>
      <Typography label="Medium/S" color="tertiary">
        User
      </Typography>
      <Typography label="Medium/S" color="tertiary">
        Lifetime Earnings
      </Typography>
    </View>
  );
}

ReferralsListHeader.displayName = 'ReferralsListHeader';

function ReferralItem({
  referral,
  index,
}: {
  referral: ApiReferralCodeClaims;
  index: number;
}) {
  const t = useTheme();
  const pushToUserProfile = usePushToUserProfile();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();

  const onProfilePress = useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.ViewXPUserProfile, {
      fid: referral.claimer.fid,
    });
    pushToUserProfile({ fid: referral.claimer.fid });
  }, [referral.claimer.fid, pushToUserProfile, trackEvent, triggerImpactAsync]);

  return (
    <AnimatedPressable onPress={onProfilePress}>
      <View
        style={[
          t.flexRow,
          t.justifyBetween,
          t.gap3,
          t.pX3,
          t.pY1,
          index % 2 === 1 && t.backgrounds.secondary,
          t.roundedLg,
        ]}
      >
        <View style={[t.flexRow, t.itemsCenter, t.gap2]}>
          <Avatar pfpUrl={referral.claimer?.pfp?.url} diameter={40} border />
          <View style={[t.flexCol]}>
            <Typography label="Semibold/Base" color="primary">
              {referral.claimer?.username ?? 'Unknown'}
            </Typography>
            <Typography label="Medium/Base" color="secondary">
              Joined{' '}
              {new Date(referral.claimedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
          </View>
        </View>
        <View style={[t.flexRow, t.itemsCenter, t.gap2]}>
          <Typography label="Medium/S" color="tertiary">
            {formatDisplayDollars(referral.usdcEarned)}
          </Typography>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function EmptyComponent() {
  const t = useTheme();

  return (
    <View style={[t.itemsCenter, t.justifyCenter, t.pY8]}>
      <Typography label="Medium/Base" color="tertiary" style={t.textCenter}>
        No referrals yet
      </Typography>
    </View>
  );
}

ReferralsListScreenContent.displayName = 'ReferralsListScreenContent';

export { ReferralsListScreen };
