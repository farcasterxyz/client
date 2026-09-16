import { AnalyticsEvent } from 'farcaster-analytics';
import type {
  FeaturePromotion,
  FeaturePromotionClientStateById,
  FeaturePromotionPlatform,
} from 'farcaster-client-hooks';
import { AlertTriangle, Newspaper, X } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Text } from '~/components/Text';
import { hitSlopXs } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  readFeaturePromotionClientState,
  updateFeaturePromotionClientState,
} from '~/utils/FeaturePromotionStorageUtils';

import { useFeaturePromotionPayload } from './useFeaturePromotionPayload';

const PROMO_SURFACE = 'home_feed';
const PROMO_POSITION = 'home_feed_top_strip';
const PROMO_ICON_SIZE = 44;
const ALERT_BACKGROUND_DARK = 'rgba(239, 68, 68, 0.22)';
const ALERT_BACKGROUND_LIGHT = 'rgba(239, 68, 68, 0.12)';
const ALERT_BORDER_DARK = 'rgba(255, 255, 255, 0.1)';
const ALERT_BORDER_LIGHT = 'rgba(0, 0, 0, 0.1)';
const PROMO_BORDER_DARK = 'rgba(255, 255, 255, 0.1)';
const PROMO_BORDER_LIGHT = 'rgba(0, 0, 0, 0.1)';
const PROMO_ICON_BACKGROUND_DARK = 'rgba(255, 255, 255, 0.1)';
const PROMO_ICON_BACKGROUND_LIGHT = 'rgba(0, 0, 0, 0.1)';
const PROMO_ICON_DARK = 'rgba(255, 255, 255, 0.7)';
const PROMO_ICON_LIGHT = 'rgba(0, 0, 0, 0.7)';
const FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS = 30 * 24 * 60 * 60 * 1000;

function getPromotionPlatform(): FeaturePromotionPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function buildFeaturePromotionAnalyticsProps({
  promoId,
  kind,
  platform,
}: {
  promoId: string;
  kind: string;
  platform: FeaturePromotionPlatform;
}) {
  return {
    promoId,
    kind,
    surface: PROMO_SURFACE,
    platform,
    position: PROMO_POSITION,
  };
}

function selectEligibleFeaturePromotion({
  clientStateById,
  promotions,
}: {
  clientStateById: FeaturePromotionClientStateById;
  promotions: FeaturePromotion[];
}) {
  const now = Date.now();

  return promotions.find((promotion) => {
    const dismissedAt = clientStateById[promotion.id]?.dismissedAt;

    return (
      typeof dismissedAt !== 'number' ||
      now - dismissedAt >= FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS
    );
  });
}

function FeaturePromotionRow({
  dismissPromotion,
  promotion,
}: {
  dismissPromotion?: () => void;
  promotion: FeaturePromotion;
}) {
  const t = useTheme();
  const isAlert = promotion.alert;
  const icon = promotion.icon ?? (isAlert ? 'alert' : 'news');
  const alertBorderColor = t.dark ? ALERT_BORDER_DARK : ALERT_BORDER_LIGHT;
  const promoBorderColor = t.dark ? PROMO_BORDER_DARK : PROMO_BORDER_LIGHT;
  const iconBackgroundColor =
    promotion.iconBackgroundColor ??
    (t.dark ? PROMO_ICON_BACKGROUND_DARK : PROMO_ICON_BACKGROUND_LIGHT);
  const iconColor = t.dark ? PROMO_ICON_DARK : PROMO_ICON_LIGHT;
  const alertBackgroundColor = t.dark
    ? ALERT_BACKGROUND_DARK
    : ALERT_BACKGROUND_LIGHT;
  const rowBackground = isAlert
    ? { backgroundColor: alertBackgroundColor }
    : promotion.backgroundColor
      ? { backgroundColor: promotion.backgroundColor }
      : t.bgDefault;
  const renderedIcon =
    icon === 'alert' ? (
      <AlertTriangle size={20} color={iconColor} />
    ) : (
      <Newspaper size={20} color={iconColor} />
    );
  const content = (
    <>
      <View
        style={[
          t.itemsCenter,
          t.justifyCenter,
          t.rounded,
          { backgroundColor: iconBackgroundColor },
          { width: PROMO_ICON_SIZE, height: PROMO_ICON_SIZE },
        ]}
      >
        {renderedIcon}
      </View>
      <View style={[t.flex1]}>
        <Text
          numberOfLines={1}
          style={[t.textSm, t.fontSemibold, t.texts.primary]}
        >
          {promotion.title}
        </Text>
        <Text numberOfLines={3} style={[t.textSm, t.texts.secondary]}>
          {promotion.subtitle}
        </Text>
      </View>
    </>
  );

  return (
    <View
      style={[
        t.relative,
        isAlert
          ? {
              borderTopColor: alertBorderColor,
              borderTopWidth: 1,
              borderBottomColor: alertBorderColor,
              borderBottomWidth: 1,
            }
          : {
              borderBottomColor: promoBorderColor,
              borderBottomWidth: 1,
            },
        rowBackground,
        t.pX4,
        t.pY3,
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter, { gap: 12, paddingRight: 32 }]}>
        {content}
      </View>
      {dismissPromotion ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Don't show promotion again"
          hitSlop={hitSlopXs}
          onPress={dismissPromotion}
          style={[t.absolute, t.top0, t.right0, t.p3]}
        >
          <X size={16} color={t.colors.text.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const HomeFeaturePromotion = React.memo(() => {
  const platform = getPromotionPlatform();
  const { trackEvent } = useAnalytics();
  const impressedPromoIdsRef = React.useRef(new Set<string>());
  const promotions = useFeaturePromotionPayload();
  const [clientStateById, setClientStateById] =
    React.useState<FeaturePromotionClientStateById>(() =>
      readFeaturePromotionClientState(),
    );

  const alerts = React.useMemo(
    () => promotions.filter((promotion) => promotion.alert),
    [promotions],
  );
  const nonAlertPromotions = React.useMemo(
    () => promotions.filter((promotion) => !promotion.alert),
    [promotions],
  );

  const promotion = React.useMemo(
    () =>
      selectEligibleFeaturePromotion({
        clientStateById,
        promotions: nonAlertPromotions,
      }),
    [clientStateById, nonAlertPromotions],
  );

  const analyticsProps = React.useMemo(() => {
    if (!promotion) {
      return undefined;
    }

    return buildFeaturePromotionAnalyticsProps({
      promoId: promotion.id,
      kind: 'feature_promotion',
      platform,
    });
  }, [platform, promotion]);

  React.useEffect(() => {
    if (!promotion || !analyticsProps) {
      return;
    }

    if (impressedPromoIdsRef.current.has(promotion.id)) {
      return;
    }

    impressedPromoIdsRef.current.add(promotion.id);
    updateFeaturePromotionClientState({
      promoId: promotion.id,
      updates: { lastImpressedAt: Date.now() },
    });
    trackEvent(AnalyticsEvent.FeaturePromoViewed, analyticsProps);
  }, [analyticsProps, promotion, trackEvent]);

  const dismissPromotion = React.useCallback(() => {
    if (!promotion || !analyticsProps) {
      return;
    }

    setClientStateById(
      updateFeaturePromotionClientState({
        promoId: promotion.id,
        updates: { dismissedAt: Date.now() },
      }),
    );
    trackEvent(AnalyticsEvent.FeaturePromoDismissed, analyticsProps);
  }, [analyticsProps, promotion, trackEvent]);

  if (!promotion && alerts.length === 0) {
    return null;
  }

  return (
    <>
      {alerts.map((alert) => (
        <FeaturePromotionRow key={alert.id} promotion={alert} />
      ))}
      {promotion ? (
        <FeaturePromotionRow
          dismissPromotion={dismissPromotion}
          promotion={promotion}
        />
      ) : null}
    </>
  );
});

HomeFeaturePromotion.displayName = 'HomeFeaturePromotion';

export { HomeFeaturePromotion };
