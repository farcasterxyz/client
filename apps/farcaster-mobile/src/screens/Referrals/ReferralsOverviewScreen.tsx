import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  type ApiXPReward,
  type ApiXPRewardStatus,
  type ApiXPRewardType,
  formatDisplayDollars,
} from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useClaimReferralRewards,
  useNonSuspenseGetOrCreateReferralCode,
  useNonSuspenseXPClaimableSummary,
  useTimeAgo,
  useXPRewards,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  BottomSheetContentContainer,
  BottomSheetModal,
  ButtonV2,
  Card,
  CurrencyDisplay,
  InfoIcon,
  SkeletonPlaceholder,
  Text2,
  Typography,
  useBottomSheetModalRef,
  useCurrentUser,
  useHaptics,
  useRootToast,
} from 'farcaster-expo';
import { Table } from 'farcaster-expo/src/components/design-system/Table';
import {
  BanIcon,
  CalendarOffIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  TimerIcon,
} from 'lucide-react-native';
import React, {
  ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShareIcon } from '~/components/icons/ShareIcon';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useUnmediatedNavigate } from '~/hooks/navigation/methods/navigate';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useXPNewEntrypoint } from '~/hooks/useXPNewEntrypoint';
import { CommonStackParamList } from '~/types';
import { shareUrl } from '~/utils/SharingUtils';

type ReferralsOverviewScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ReferralsOverview'
>;

const EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

const getReferralLink = ({ code }: { code: string }) => {
  return `https://farcaster.xyz/~/code/${code}`;
};

const InfoButton = () => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const handleInfoPress = useCallback(() => {
    trackEvent(AnalyticsEvent.ViewReferralsInfo, {});
    openBrowserAsync(getNotionLinkTarget({ to: 'referrals' }));
  }, [trackEvent]);

  return (
    <AnimatedPressable
      onPress={handleInfoPress}
      style={[{ justifyContent: 'center', alignItems: 'center', width: 40 }]}
    >
      <InfoIcon size={24} color={t.colors.text.primary} />
    </AnimatedPressable>
  );
};

const ReferralsOverviewScreen = buildScreen<ReferralsOverviewScreenProps>(
  { name: 'ReferralsOverview' },
  () => {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewReferralsOverviewScreen, {});
    }, [trackEvent]);

    const navigationOptions = useNavigation();

    useEffect(() => {
      navigationOptions.setOptions({
        headerRight: () => <InfoButton />,
      });
    }, [navigationOptions]);

    return <ReferralsOverviewScreenContent />;
  },
);

ReferralsOverviewScreen.displayName = 'ReferralsOverviewScreen';

const MiniCard = ({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) => {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const handlePress = useCallback(() => {
    triggerImpactAsync();
    onPress?.();
  }, [onPress, triggerImpactAsync]);

  const Container = onPress ? AnimatedPressable : View;

  return (
    <Container style={[t.flex1]} onPress={handlePress}>
      <View
        style={[
          { borderRadius: t.borderRadiuses.$16 },
          t.backgrounds.secondary,
          t.p3,
          t.gap1,
          t.flex1,
        ]}
      >
        {children}
      </View>
    </Container>
  );
};

function ReferralsOverviewScreenContent() {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const navigate = useUnmediatedNavigate();
  const currentUser = useCurrentUser_UNSAFE();
  const { triggerImpactAsync } = useHaptics();
  const {
    flatData: xpRewards,
    totalUsdc,
    totalReferrals,
    isLoading,
    onEndReached,
    refetch,
  } = useXPRewards();
  const { data: claimableSummary, refetch: refetchClaimableSummary } =
    useNonSuspenseXPClaimableSummary();
  const [selectedXpReward, setSelectedXpReward] = useState<ApiXPReward | null>(
    null,
  );
  const { xpNewEntrypointSeen } = useXPNewEntrypoint();
  const bottomSheetRef = useBottomSheetModalRef();
  const handleRefresh = useCallback(async () => {
    refetch();
    refetchClaimableSummary();
  }, [refetch, refetchClaimableSummary]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch: handleRefresh,
  });

  const onItemPress = useCallback(
    (item: ApiXPReward) => {
      triggerImpactAsync();
      trackEvent(AnalyticsEvent.ViewXpRewardDetails);
      setSelectedXpReward(item);
      bottomSheetRef.current?.present();
    },
    [bottomSheetRef, trackEvent, triggerImpactAsync],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ApiXPReward; index: number }) => (
      <XPEarnedRenderItem item={item} index={index} onItemPress={onItemPress} />
    ),
    [onItemPress],
  );

  const { data: referralData } = useNonSuspenseGetOrCreateReferralCode({
    fid: currentUser?.fid || 0,
  });

  const onDismiss = useCallback(() => {
    setSelectedXpReward(null);
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  const code = referralData?.code ?? null;
  const link = code ? getReferralLink({ code }) : '';
  const displayCode = useMemo(() => {
    if (!code) {
      return '';
    }
    const half = Math.floor(code.length / 2);
    return code.slice(0, half) + '-' + code.slice(-half);
  }, [code]);

  useEffect(() => {
    if (!xpNewEntrypointSeen) {
      navigate('ReferralsIntro', {});
    }
  }, [xpNewEntrypointSeen, navigate]);

  if (isLoading || !xpRewards || !currentUser) {
    return (
      <SkeletonPlaceholder
        style={[t.wFull, t.roundedLg, t.backgrounds.secondary, t.p3, t.h15]}
      />
    );
  }

  return (
    <View style={[t.gap3, t.flex1, t.justifyStart, t.pY6, t.mX3]}>
      <FlatList
        data={xpRewards}
        style={t.flexGrow}
        contentContainerStyle={[t.gap1_5, t.justifyStart]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyComponent link={link} displayCode={displayCode} />
        }
        ListHeaderComponent={
          <HeaderComponent
            totalUSDC={totalUsdc || 0}
            totalReferrals={totalReferrals || 0}
            displayEmpty={xpRewards.length === 0}
            ableToClaim={claimableSummary?.eligibleToClaim || false}
            claimableUsdc={claimableSummary?.totalClaimableUsdc || 0}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={refreshControl}
      />
      {xpRewards.length !== 0 && (
        <FooterComponent link={link} displayCode={displayCode} />
      )}
      <XpRewardDescriptionBottomSheet
        onDismiss={onDismiss}
        selectedXpReward={selectedXpReward}
        ref={bottomSheetRef}
      />
    </View>
  );
}

type EmptyComponentProps = {
  link: string;
  displayCode: string;
};

function EmptyComponent({ link, displayCode }: EmptyComponentProps) {
  const t = useTheme();

  return (
    <Card variant="primary-gradient">
      <View
        style={[
          t.gap2,
          t.flexCol,
          {
            borderRadius: t.borderRadiuses.$16,
          },
        ]}
      >
        <Typography label="Medium/L" color="primary">
          Invite your friends and earn
        </Typography>
        <Typography label="Medium/S" color="secondary">
          Get 20% of trading fees from anyone who signs up with your referral
          code.
        </Typography>
        <View
          style={[
            t.flexRow,
            t.flex1,
            t.alignCenter,
            t.justifyCenter,
            t.itemsCenter,
            t.backgrounds.default,
            t.roundedFull,
            t.border,
            t.borders.secondary,
          ]}
        >
          <Text2
            style={[
              t.flex1,
              t.textCenter,
              { textAlignVertical: 'center' },
              t.justifyCenter,
              t.alignCenter,
              t.fontSemibold,
              t.textXl,
              { letterSpacing: 2 },
              t.lineHeights.base,
            ]}
          >
            {displayCode}
          </Text2>
          <ShareButton link={link} />
        </View>
      </View>
    </Card>
  );
}

const ShareButton = ({ link }: { link: string }) => {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();
  const handleShare = useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.ShareReferralLink, {
      link,
    });

    shareUrl({
      title: 'Your referral link',
      url: link,
    });
  }, [link, trackEvent, triggerImpactAsync]);
  return (
    <AnimatedPressable onPress={handleShare}>
      <View
        style={[
          t.pX8,
          t.pY2,
          t.roundedFull,
          t.backgrounds.brand,
          t.itemsCenter,
          t.justifyCenter,
          t.alignCenter,
          { height: 42 },
        ]}
      >
        <ShareIcon size={t.iconSizes.$20} color={t.colors.text.light} />
      </View>
    </AnimatedPressable>
  );
};

const useHandleClaimXPRewards = (claimableUsdc: number) => {
  const toast = useRootToast();

  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();
  const currentUser = useCurrentUser();
  const { mutateAsync: claimXPReward, isPending: isClaimingXPReward } =
    useClaimReferralRewards();

  const handleClaim = useCallback(async () => {
    if (!currentUser?.fid || claimableUsdc === 0) {
      return;
    }
    const formattedClaimableUsdc = formatDisplayDollars(claimableUsdc);

    try {
      triggerImpactAsync();
      trackEvent(AnalyticsEvent.ClaimXPReward, {
        usdc: claimableUsdc,
      });
      // Claim the XP reward (using a mock rewardId for now)
      await claimXPReward();
      trackEvent(AnalyticsEvent.ClaimXPRewardSuccess, {
        usdc: claimableUsdc,
      });
      toast.show(`${formattedClaimableUsdc} claimed!`, {
        duration: 3000,
        placement: 'top',
      });

      // The query will automatically refresh due to invalidation
    } catch (error) {
      trackEvent(AnalyticsEvent.ClaimXPRewardError, {
        usdc: claimableUsdc,
      });
      toast.show('Failed to claim rewards', {
        duration: 3000,
        placement: 'top',
        type: 'danger',
      });
    }
  }, [
    currentUser?.fid,
    claimableUsdc,
    triggerImpactAsync,
    trackEvent,
    claimXPReward,
    toast,
  ]);

  return { handleClaim, isClaimingXPReward };
};

type HeaderComponentProps = {
  totalUSDC: number;
  totalReferrals: number;
  displayEmpty: boolean;
  ableToClaim: boolean;
  claimableUsdc: number;
};

function HeaderComponent({
  totalUSDC,
  totalReferrals,
  displayEmpty,
  ableToClaim,
  claimableUsdc,
}: HeaderComponentProps) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();
  const navigate = useUnmediatedNavigate();
  const { handleClaim, isClaimingXPReward } =
    useHandleClaimXPRewards(claimableUsdc);

  const handleReferralsListPress = useCallback(() => {
    trackEvent(AnalyticsEvent.ViewReferralsListPressed, {});
    navigate('ReferralsList', {});
  }, [trackEvent, navigate]);

  const formattedClaimableUsdc = formatDisplayDollars(claimableUsdc);

  return (
    <View>
      <View style={[t.justifyStart, t.gap1, t.mX1, t.pT3, t.pB5]}>
        <Typography label="Body/Small/Strong" color="tertiary">
          Total earned
        </Typography>
        <CurrencyDisplay amount={totalUSDC} />
      </View>
      <View style={[t.flexRow, t.itemsCenter, t.gap3]}>
        <MiniCard onPress={handleReferralsListPress}>
          <View style={[t.flexRow, t.justifyBetween]}>
            <Typography label="Body/ExtraSmall/Strong" color="tertiary">
              Total referrals
            </Typography>
            <ChevronRightIcon
              size={t.iconSizes.$16}
              color={t.colors.text.tertiary}
            />
          </View>
          <Typography label="Body/Large/Strong" color="primary">
            {totalReferrals}
          </Typography>
        </MiniCard>
        <MiniCard>
          <Typography label="Body/ExtraSmall/Strong" color="tertiary">
            Available to claim
          </Typography>
          <View style={[t.flexRow, t.itemsCenter, t.gap3]}>
            <Typography label="Body/Large/Strong" color="primary">
              {formattedClaimableUsdc}
            </Typography>
            {ableToClaim ? (
              <ButtonV2
                title="Claim"
                onPress={handleClaim}
                height="xs"
                loading={isClaimingXPReward}
              />
            ) : null}
          </View>
        </MiniCard>
      </View>
      {displayEmpty ? null : (
        <View style={[t.flexRow, t.justifyBetween, t.pT7, t.pB2, t.pX3]}>
          <Typography label="Medium/S" color="tertiary">
            User
          </Typography>
          <Typography label="Medium/S" color="tertiary">
            Reward
          </Typography>
        </View>
      )}
    </View>
  );
}

type FooterComponentProps = {
  link: string;
  displayCode: string;
};

function FooterComponent({ link, displayCode }: FooterComponentProps) {
  const t = useTheme();

  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        t.itemsCenter,
        t.gap2,
        {
          paddingBottom: bottom,
        },
        t.wFull,
      ]}
    >
      <Card
        variant="primary-gradient"
        style={{ borderRadius: 43, paddingVertical: 8 }}
      >
        <View style={[t.flexRow, t.justifyBetween, t.gap2, t.itemsCenter]}>
          <View
            style={[
              t.flexRow,
              t.gap2,
              t.itemsCenter,
              t.justifyCenter,
              t.alignCenter,
            ]}
          >
            <Typography label="Medium/L" color="secondary">
              Referral Code
            </Typography>
            <Text2
              style={[
                t.fontSemibold,
                t.textXl,
                {
                  letterSpacing: 2,
                  verticalAlign: 'center',
                  textAlignVertical: 'center',
                  lineHeight: 24,
                },
                // t.justifyCenter,
                // t.alignCenter,

                t.textCenter,
              ]}
            >
              {displayCode}
            </Text2>
          </View>
          <ShareButton link={link} />
        </View>
      </Card>
    </View>
  );
}

FooterComponent.displayName = 'ReferralsOverviewScreenFooterComponent';

function getXpRewardTypeLabel(type: ApiXPRewardType) {
  switch (type) {
    case 'swap':
      return 'Swap';
    case 'pro':
      return 'Bought PRO';
    case 'join':
      return 'Join';
    case 'referral':
      return 'Referral';
    default:
      return '';
  }
}

function getXpRewardStatusLabel(status: ApiXPRewardStatus): string {
  switch (status) {
    case 'earned':
      return 'Claimed';
    case 'pending':
      return 'Unclaimed';
    case 'error':
      return 'Error';
    case 'claiming':
      return 'Claiming';
    case 'expired':
      return 'Expired';
  }
}

function getXpRewardStatusColor(status: ApiXPRewardStatus) {
  switch (status) {
    case 'earned':
      return 'secondary' as const;
    case 'pending':
      return 'brand' as const;
    case 'error':
      return 'danger' as const;
    default:
      return 'secondary' as const;
  }
}

const XpRewardDescriptionBottomSheetContent = ({
  selectedXpReward,
}: {
  selectedXpReward: ApiXPReward | null;
}) => {
  const { trackEvent } = useAnalytics();
  const { triggerImpactAsync } = useHaptics();
  const t = useTheme();
  const pushToUserProfile = usePushToUserProfile();
  const onProfilePress = useCallback(() => {
    if (!selectedXpReward) {
      return;
    }
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.ViewXPUserProfile, {
      fid: selectedXpReward.user.fid,
    });
    pushToUserProfile({ fid: selectedXpReward.user.fid });
  }, [selectedXpReward, pushToUserProfile, trackEvent, triggerImpactAsync]);
  const timeAgo = useTimeAgo({ timestamp: selectedXpReward?.timestamp || 0 });
  const expiresIn = useTimeAgo({
    timestamp: (selectedXpReward?.timestamp ?? 0) + EXPIRATION_TIME || 0,
  });
  if (!selectedXpReward) {
    return null;
  }
  const { status } = selectedXpReward;

  return (
    <BottomSheetContentContainer>
      <View>
        <View style={[t.flexRow, { gap: 10 }]}>
          <Pressable onPress={onProfilePress}>
            <Avatar pfpUrl={selectedXpReward?.user.pfp?.url} diameter={36} />
          </Pressable>
          <View style={t.flexCol}>
            <View style={[t.flexRow, t.gap1]}>
              <XpRewardStatusIcon status={status} />
              <Typography
                label="Medium/S"
                color={getXpRewardStatusColor(status)}
              >
                {getXpRewardStatusLabel(status)}
              </Typography>
            </View>
            <Pressable onPress={onProfilePress}>
              <Typography label="Medium/Base" color="primary">
                {selectedXpReward?.user.username}
              </Typography>
            </Pressable>
          </View>
        </View>
        <View>
          <Table
            style={t.gap0}
            rows={[
              {
                label: getXpRewardTypeLabel(selectedXpReward.type),
                value: formatDisplayDollars(selectedXpReward.usdc),
              },
              {
                label: 'Time',
                value: timeAgo + ' ago',
              },
              ...(status === 'pending'
                ? [
                    {
                      label: 'Expires In',
                      value: expiresIn,
                    },
                  ]
                : []),
            ]}
          />
        </View>
      </View>
    </BottomSheetContentContainer>
  );
};

const XpRewardDescriptionBottomSheet = React.forwardRef<
  ComponentRef<typeof BottomSheetModal>,
  { selectedXpReward: ApiXPReward | null; onDismiss: () => void }
>(({ selectedXpReward, onDismiss }, ref) => {
  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onDismiss}
      name="XpRewardDescriptionBottomSheet"
      enableDynamicSizing
    >
      <XpRewardDescriptionBottomSheetContent
        selectedXpReward={selectedXpReward}
      />
    </BottomSheetModal>
  );
});

function XpRewardStatusIcon({
  status,
}: {
  status: ApiXPRewardStatus;
}): React.ReactNode {
  const t = useTheme();
  switch (status) {
    case 'earned':
      return (
        <CircleCheckIcon
          size={t.iconSizes.$16}
          color={t.colors.text[getXpRewardStatusColor(status)]}
        />
      );
    case 'pending':
      return (
        <CircleDashedIcon
          size={t.iconSizes.$16}
          color={t.colors.text[getXpRewardStatusColor(status)]}
        />
      );
    case 'expired':
      return (
        <CalendarOffIcon
          size={t.iconSizes.$16}
          color={t.colors.text[getXpRewardStatusColor(status)]}
        />
      );
    case 'claiming':
      return (
        <TimerIcon
          size={t.iconSizes.$16}
          color={t.colors.text[getXpRewardStatusColor(status)]}
        />
      );
    case 'error':
      return (
        <BanIcon
          size={t.iconSizes.$16}
          color={t.colors.text[getXpRewardStatusColor(status)]}
        />
      );
  }
}

function XPEarnedRenderItem({
  item,
  index,
  onItemPress,
}: {
  item: ApiXPReward;
  index: number;
  onItemPress: (item: ApiXPReward) => void;
}) {
  const t = useTheme();
  const formattedUSDC = formatDisplayDollars(item.usdc);
  const timeAgo = useTimeAgo({ timestamp: item.timestamp });
  const { status } = item;

  return (
    <AnimatedPressable onPress={() => onItemPress(item)}>
      <View
        style={[
          t.flexRow,
          t.justifyBetween,
          t.pX3,
          { paddingVertical: 6 },
          index % 2 === 1 && t.backgrounds.secondary,
          status === 'error' && t.opacity50,
        ]}
      >
        <View style={[t.flexRow, t.itemsCenter, t.gap2]}>
          <Avatar pfpUrl={item.user.pfp?.url} diameter={20} />
          <Typography label="Medium/Base" color="primary">
            {item.user.username}
          </Typography>
          <Typography label="Medium/Base" color="quaternary">
            {timeAgo}
          </Typography>
        </View>
        <View style={[t.flexRow, t.itemsCenter, t.gap2]}>
          <Typography label="Medium/Base" color="secondary">
            +{formattedUSDC}
          </Typography>
          <XpRewardStatusIcon status={status} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

ReferralsOverviewScreen.displayName = 'ReferralsOverviewScreen';

export { ReferralsOverviewScreen };
