import { XIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import type {
  FeaturePromotion,
  FeaturePromotionClientStateById,
} from 'farcaster-client-hooks';
import { AlertTriangle, Newspaper } from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';

import {
  readFeaturePromotionClientState,
  updateFeaturePromotionClientState,
} from './FeaturePromotionStorage';
import { useFeaturePromotionPayload } from './useFeaturePromotionPayload';

const PROMO_SURFACE = 'home_feed';
const PROMO_PLATFORM = 'web';
const PROMO_POSITION = 'home_feed_top_strip';
const PROMO_KIND = 'feature_promotion';
const FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS = 30 * 24 * 60 * 60 * 1000;

function buildFeaturePromotionAnalyticsProps({
  promoId,
  kind,
}: {
  promoId: string;
  kind: string;
}) {
  return {
    promoId,
    kind,
    surface: PROMO_SURFACE,
    platform: PROMO_PLATFORM,
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
  dismissPromotion?: (event?: React.MouseEvent) => void;
  promotion: FeaturePromotion;
}) {
  const isAlert = promotion.alert;
  const icon = promotion.icon ?? (isAlert ? 'alert' : 'news');
  const rowStyle =
    !isAlert && promotion.backgroundColor
      ? { backgroundColor: promotion.backgroundColor }
      : undefined;
  const renderedIcon =
    icon === 'alert' ? <AlertTriangle size={24} /> : <Newspaper size={24} />;
  const content = (
    <>
      <div
        className="flex size-[52px] shrink-0 items-center justify-center rounded-md bg-black/10 dark:bg-white/10"
        style={
          promotion.iconBackgroundColor
            ? { backgroundColor: promotion.iconBackgroundColor }
            : undefined
        }
      >
        <span className="text-black/70 dark:text-white/70">{renderedIcon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-default">
          {promotion.title}
        </div>
        <div className="line-clamp-3 text-sm text-muted">
          {promotion.subtitle}
        </div>
      </div>
    </>
  );

  return (
    <div
      className={
        isAlert
          ? 'relative border-y border-black/10 bg-[rgba(239,68,68,0.12)] px-4 py-3 dark:border-white/10 dark:bg-[rgba(239,68,68,0.22)]'
          : 'bg-default relative border-b border-black/10 px-4 py-3 dark:border-white/10'
      }
      style={rowStyle}
    >
      <div className="flex w-full items-center gap-3 pr-8 text-left">
        {content}
      </div>
      {dismissPromotion ? (
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-1 text-muted hover:bg-action-tertiary-hover hover:text-default"
          aria-label="Don't show promotion again"
          onClick={dismissPromotion}
        >
          <XIcon size={16} />
        </button>
      ) : null}
    </div>
  );
}

const HomeFeaturePromotion = memo(() => {
  const [clientStateById, setClientStateById] =
    React.useState<FeaturePromotionClientStateById>(() =>
      readFeaturePromotionClientState(),
    );
  const impressedPromoIdsRef = useRef(new Set<string>());
  const promotions = useFeaturePromotionPayload();

  const alerts = useMemo(
    () => promotions.filter((promotion) => promotion.alert),
    [promotions],
  );
  const nonAlertPromotions = useMemo(
    () => promotions.filter((promotion) => !promotion.alert),
    [promotions],
  );

  const { trackEvent } = useAnalytics();

  const promotion = useMemo(
    () =>
      selectEligibleFeaturePromotion({
        clientStateById,
        promotions: nonAlertPromotions,
      }),
    [clientStateById, nonAlertPromotions],
  );

  const analyticsProps = useMemo(() => {
    if (!promotion) {
      return undefined;
    }

    return buildFeaturePromotionAnalyticsProps({
      promoId: promotion.id,
      kind: PROMO_KIND,
    });
  }, [promotion]);

  useEffect(() => {
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

  const dismissPromotion = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();

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
    },
    [analyticsProps, promotion, trackEvent],
  );

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
