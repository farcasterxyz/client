import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useSetUserPreferences,
  useTrendingTokens,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { ChartColumnIncreasingIcon, Flame, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Platform, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import Carousel, {
  ICarouselInstance,
  Pagination,
} from 'react-native-reanimated-carousel';
import Svg, { Path, Rect } from 'react-native-svg';

import { hitSlopSm, WALLET_NUX_CONFIG } from '../../../constants';
import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import { TokenIcon } from '../../crypto';
import { AnimatedPressable, Text2 } from '../../design-system';
import { XpRewardIcon } from '../../icons';

const { width: screenWidth } = Dimensions.get('window');
const padding = 12;
const border = 1;
const width = screenWidth - padding * 2 - border * 2;
const height = 75 - border * 2;

type BannerProps = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradientColor: string;
  onPress: () => void;
  onDismiss?: () => void;
};

type WalletHomeBannersProps = {
  nuxProgress: SharedValue<number>;
};

export function WalletHomeBanners({ nuxProgress }: WalletHomeBannersProps) {
  const t = useTheme();
  const ref = React.useRef<ICarouselInstance>(null);

  const { data: preferences } = useUserPreferences();
  const setUserPreference = useSetUserPreferences();
  const { navigate } = useSharedNavigationContext();

  const { trackEvent } = useSharedTelemetry();
  const [dismissedBannerIds, setDismissedBannerIds] = React.useState<string[]>(
    [],
  );
  const { data } = useTrendingTokens();

  const banners = React.useMemo(() => {
    const banners: BannerProps[] = [];

    if (preferences.result.preferences.showDepositBonusesIntro) {
      banners.push({
        id: 'deposit-bonuses',
        title: 'Deposit $100 USDC and earn $10',
        subtitle:
          "This October, we're matching USDC deposits on Base by up to 10%.",
        icon: (
          <View
            style={[
              t.itemsCenter,
              t.justifyCenter,
              t.roundedFull,
              { backgroundColor: t.colors.text.brand },
              { width: 32, height: 32 },
            ]}
          >
            <ChartColumnIncreasingIcon size={16} color="white" />
          </View>
        ),
        gradientColor: t.colors.violet300,
        onPress: () => {
          navigate({
            path: 'DepositBonusesIntro',
            params: {},
          });
        },
        onDismiss: () => {
          setUserPreference({
            preferences: {
              showDepositBonusesIntro: false,
            },
          });
        },
      });
    }

    if (preferences.result.preferences.showReferralIntro) {
      banners.push({
        id: 'referral-rewards',
        title: 'Referral Rewards',
        subtitle: 'Invite friends & earn 20% of trading fees',
        icon: (
          <XpRewardIcon
            size={32}
            color={t.colors.text.primary}
            foregroundColor={t.colors.text.inverted}
          />
        ),
        gradientColor: t.colors.violet300,
        onPress: () => {
          navigate({
            path: 'ReferralsOverview',
            params: {},
          });
        },
        onDismiss: () => {
          setUserPreference({
            preferences: {
              showReferralIntro: false,
            },
          });
        },
      });
    }

    if (preferences.result.preferences.showTokenNotificationsIntro) {
      banners.push({
        id: 'wallet-notifications',
        title: 'Don’t miss out!',
        subtitle:
          'Get notified when prices move or when people you follow trade tokens.',
        icon: (
          <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <Rect
              x="19.799"
              y="0.201172"
              width="28"
              height="28"
              rx="6"
              transform="rotate(45 19.799 0.201172)"
              fill="#007BE5"
            />
            <Path
              d="M18.644 26C18.7611 26.2027 18.9294 26.371 19.1321 26.488C19.3348 26.605 19.5647 26.6666 19.7987 26.6666C20.0327 26.6666 20.2627 26.605 20.4653 26.488C20.668 26.371 20.8363 26.2027 20.9534 26"
              stroke="white"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M26.4657 17.333C26.4657 15.7997 25.9323 14.4663 25.1323 13.333"
              stroke="white"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.9732 22.217C13.8861 22.3125 13.8286 22.4312 13.8078 22.5587C13.7869 22.6862 13.8035 22.817 13.8557 22.9353C13.9078 23.0535 13.9931 23.154 14.1014 23.2247C14.2096 23.2953 14.336 23.3329 14.4652 23.333H25.1319C25.2611 23.3331 25.3875 23.2956 25.4958 23.2251C25.604 23.1546 25.6895 23.0542 25.7418 22.936C25.794 22.8179 25.8108 22.6871 25.7902 22.5595C25.7695 22.432 25.7121 22.3132 25.6252 22.2177C24.7385 21.3037 23.7985 20.3323 23.7985 17.333C23.7985 16.2721 23.3771 15.2547 22.627 14.5046C21.8768 13.7544 20.8594 13.333 19.7985 13.333C18.7377 13.333 17.7202 13.7544 16.9701 14.5046C16.22 15.2547 15.7985 16.2721 15.7985 17.333C15.7985 20.3323 14.8579 21.3037 13.9732 22.217Z"
              fill="white"
              stroke="white"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M14.4657 13.333C13.6657 14.4663 13.1323 15.7997 13.1323 17.333"
              stroke="white"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
        gradientColor: t.dark ? t.colors.blue1000 : t.colors.blue200,
        onPress: () => {
          navigate({
            path: 'WalletAlertsIntro',
            params: {},
          });
        },
        onDismiss: () =>
          setUserPreference({
            preferences: {
              showTokenNotificationsIntro: false,
            },
          }),
      });
    }

    const totalTokens = data?.pages[0].tokens.length || 0;
    const previewTokens =
      data?.pages[0].tokens
        .filter((token) => token.token.ticker && token.token.imageUrl)
        .slice(0, 3) || [];

    if (totalTokens > 0) {
      banners.push({
        id: 'trending-tokens',
        title: `${previewTokens[0].token.ticker} is trending!`,
        subtitle: `Explore ${totalTokens}+ other trending tokens`,
        icon: (
          <View>
            <TokenIcon
              iconUrl={previewTokens[0].token.imageUrl}
              diameter={36}
              imageBordered
            />
            <View
              style={[
                t.itemsCenter,
                t.justifyCenter,
                t.roundedFull,
                { backgroundColor: t.colors.text.danger },
                { width: 14, height: 14 },
                t.absolute,
                { right: -2, bottom: -2 },
              ]}
            >
              <Flame size={10} color="white" fill="white" />
            </View>
          </View>
        ),
        gradientColor: t.dark ? t.colors.red1000 : t.colors.red100,
        onPress: () => {
          navigate({
            path: 'TrendingTokens',
            params: {
              timeWindow: '6h',
            },
          });
        },
      });
    }

    return banners.filter((banner) => !dismissedBannerIds.includes(banner.id));
  }, [
    t.colors.blue1000,
    t.colors.blue200,
    t.colors.text.brand,
    t.colors.violet300,
    t.dark,
    preferences.result.preferences.showTokenNotificationsIntro,
    setUserPreference,
    navigate,
    preferences.result.preferences.showDepositBonusesIntro,
    preferences.result.preferences.showReferralIntro,
    t.colors.text.inverted,
    t.colors.text.primary,
    t.itemsCenter,
    t.justifyCenter,
    t.roundedFull,
    dismissedBannerIds,
    data,
    t.colors.red100,
    t.absolute,
    t.colors.text.danger,
    t.colors.red1000,
  ]);

  const handleDismiss = React.useCallback(
    (item: BannerProps, index: number) => {
      if (banners.length === 1 || index === 0) {
        setDismissedBannerIds((prev) => [...prev, item.id]);
        trackEvent(AnalyticsEvent.DismissWalletBanner, {
          id: item.id,
        });
        item.onDismiss?.();
        return;
      }

      ref.current?.scrollTo({
        count: -1,
        animated: true,
        onFinished: () => {
          setDismissedBannerIds((prev) => [...prev, item.id]);
          trackEvent(AnalyticsEvent.DismissWalletBanner, {
            id: item.id,
          });
          item.onDismiss?.();
        },
      });
    },
    [setDismissedBannerIds, trackEvent, banners.length],
  );

  const isScrolling = React.useRef(false);

  const progress = useSharedValue(0);
  const normalizedProgress = useDerivedValue(() => {
    return Math.abs(progress.value % 1);
  });

  const handlePress = React.useCallback(() => {
    if (isScrolling.current) {
      return;
    }
    const activeBannerIndex =
      (ref.current?.getCurrentIndex() ?? 0) % banners.length;

    const banner = banners[activeBannerIndex];
    if (!banner) {
      return;
    }

    trackEvent(AnalyticsEvent.PressWalletBanner, {
      id: banner.id,
    });
    banner.onPress();
  }, [trackEvent, banners]);

  const renderItem = React.useCallback(
    ({ item, index }: { item: BannerProps; index: number }) => {
      return (
        <Banner
          {...item}
          progress={normalizedProgress}
          onDismiss={
            item.onDismiss ? () => handleDismiss(item, index) : undefined
          }
        />
      );
    },
    [handleDismiss, normalizedProgress],
  );

  const blurStyle = useAnimatedStyle(() => {
    const interpolatedValue = interpolate(
      normalizedProgress.value,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity: interpolatedValue,
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    const interpolatedValue = interpolate(
      nuxProgress.value,
      [
        WALLET_NUX_CONFIG.PROGRESS_START_POINT,
        WALLET_NUX_CONFIG.NON_NUX_DISPLAY_PROGRESS_THRESHOLD,
        WALLET_NUX_CONFIG.PROGRESS_END_POINT,
      ],
      [0, 0.1, 1],
    );
    const displayed =
      nuxProgress.value >= WALLET_NUX_CONFIG.NON_NUX_DISPLAY_PROGRESS_THRESHOLD;

    return {
      opacity: interpolatedValue,
      display: displayed ? 'flex' : 'none',
    };
  }, [nuxProgress.value]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedPressable style={t.itemsCenter} onPress={handlePress}>
        <Carousel
          ref={ref}
          data={banners}
          height={height}
          loop={banners.length > 1}
          pagingEnabled={banners.length > 1}
          enabled={banners.length > 1}
          snapEnabled={true}
          width={width}
          style={[
            t.border,
            t.borders.primary,
            { width, height, borderRadius: 20 },
          ]}
          onScrollStart={() => {
            isScrolling.current = true;
          }}
          onScrollEnd={() => {
            isScrolling.current = false;
          }}
          renderItem={renderItem}
          onProgressChange={progress}
          overscrollEnabled={false}
        />
        {Platform.OS === 'ios' && (
          <Animated.View
            style={[
              t.absolute,
              t.top0,
              t.left0,
              t.right0,
              t.bottom0,
              t.justifyCenter,
              t.itemsCenter,
              { padding: border },
              blurStyle,
            ]}
            pointerEvents="none"
          >
            <BlurView
              intensity={10}
              tint="systemMaterial"
              style={[
                t.flex1,
                { width, height, borderRadius: 20, overflow: 'hidden' },
              ]}
            />
          </Animated.View>
        )}
        <View
          style={[
            t.absolute,
            t.flexRow,
            t.justifyEnd,
            t.itemsEnd,
            t.bottom0,
            t.left0,
            { width, paddingBottom: 8 },
          ]}
          pointerEvents="none"
        >
          <CarouselPagination
            progress={progress}
            data={banners.map((o) => o.id)}
          />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function Banner({
  title,
  subtitle,
  icon,
  gradientColor,
  onDismiss,
  progress,
}: BannerProps & { progress: SharedValue<number> }) {
  const t = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        progress.value,
        [0, 0.3, 0.7, 1],
        [1, 0, 0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Animated.View
      style={Platform.OS === 'android' ? undefined : animatedStyle}
    >
      <LinearGradient
        colors={[gradientColor, t.colors.background.default]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.2, y: 1 }}
        style={[
          t.p3,
          t.flexRow,
          t.justifyBetween,
          { borderRadius: 20, height: 72, gap: 32 },
        ]}
      >
        <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <View
            style={[{ width: 40, height: 40 }, t.itemsCenter, t.justifyCenter]}
          >
            {icon}
          </View>
          <View style={[t.flex1]}>
            <Text2 weight="medium">{title}</Text2>
            <Text2 weight="medium" size="xs" color="tertiary">
              {subtitle}
            </Text2>
          </View>
        </View>
        {onDismiss && (
          <View style={[t.itemsEnd, t.justifyBetween]}>
            <AnimatedPressable onPress={onDismiss} hitSlop={hitSlopSm}>
              <X size={16} color={t.colors.text.tertiary} strokeWidth={2.5} />
            </AnimatedPressable>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function CarouselPagination({
  progress,
  data,
}: {
  progress: SharedValue<number>;
  data: string[];
}) {
  const t = useTheme();

  if (data.length <= 1) {
    return null;
  }

  return (
    <Pagination.Custom
      progress={progress}
      data={data}
      size={data.length}
      dotStyle={{
        borderRadius: 16,
        backgroundColor: t.colors.gray300,
        width: 4,
        height: 4,
      }}
      activeDotStyle={{
        borderRadius: 16,
        backgroundColor: t.colors.background.brand,
        width: 4,
        height: 4,
      }}
      containerStyle={{
        gap: 4,
        alignItems: 'center',
        backgroundColor: t.dark
          ? t.colors.background.secondary
          : t.colors.background.default,
      }}
      horizontal={true}
      customReanimatedStyle={(progress, index, length) => {
        let val = Math.abs(progress - index);
        if (index === 0 && progress > length - 1) {
          val = Math.abs(progress - length);
        }

        return {
          transform: [
            {
              translateY: interpolate(val, [0, 1], [0, 0], Extrapolation.CLAMP),
            },
          ],
        };
      }}
    />
  );
}
