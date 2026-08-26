import type {
  FeaturePromotion,
  FeaturePromotionIcon,
} from 'farcaster-client-hooks';
import React from 'react';

import { posthogClient } from '~/analyticsClient/providers/posthogProvider';

const FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG = 'feature-promotions';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFeaturePromotionRegistryPayload(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter((flag): flag is string => typeof flag === 'string');
}

function parseFeaturePromotionIcon(
  value: unknown,
): FeaturePromotionIcon | null {
  return value === 'alert' || value === 'news' ? value : null;
}

function parseFeaturePromotionPayload(
  payload: unknown,
  { fallbackId }: { fallbackId?: string } = {},
): FeaturePromotion | null {
  if (!isRecord(payload)) {
    return null;
  }

  const id = typeof payload.id === 'string' ? payload.id : fallbackId;

  if (
    typeof id !== 'string' ||
    typeof payload.title !== 'string' ||
    typeof payload.subtitle !== 'string'
  ) {
    return null;
  }

  if (payload.action === 'open_snap_builder') {
    return null;
  }

  const icon = parseFeaturePromotionIcon(payload.icon);

  return {
    id,
    title: payload.title,
    subtitle: payload.subtitle,
    alert: payload.alert === true,
    ...(icon ? { icon } : {}),
    ...(typeof payload.iconBackgroundColor === 'string'
      ? { iconBackgroundColor: payload.iconBackgroundColor }
      : {}),
    ...(typeof payload.backgroundColor === 'string'
      ? { backgroundColor: payload.backgroundColor }
      : {}),
  };
}

function readFeaturePromotionPayload(): FeaturePromotion[] {
  if (
    posthogClient.isFeatureEnabled(FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG) !==
    true
  ) {
    return [];
  }

  return parseFeaturePromotionRegistryPayload(
    posthogClient.getFeatureFlagPayload(
      FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG,
    ),
  )
    .map((key) => {
      if (posthogClient.isFeatureEnabled(key) !== true) {
        return null;
      }

      return parseFeaturePromotionPayload(
        posthogClient.getFeatureFlagPayload(key),
        { fallbackId: key },
      );
    })
    .filter((promotion): promotion is FeaturePromotion => promotion !== null);
}

function useFeaturePromotionPayload() {
  const [promotions, setPromotions] = React.useState<FeaturePromotion[]>(() =>
    readFeaturePromotionPayload(),
  );

  const refreshPromotions = React.useCallback(() => {
    setPromotions(readFeaturePromotionPayload());
  }, []);

  React.useEffect(() => {
    refreshPromotions();
    return posthogClient.onFeatureFlags(refreshPromotions);
  }, [refreshPromotions]);

  return promotions;
}

export { useFeaturePromotionPayload };
