import type {
  FeaturePromotion,
  FeaturePromotionIcon,
} from 'farcaster-client-hooks';
import { useCallback, useEffect, useState } from 'react';

import { isDev } from '~/constants/env';
import { Analytics } from '~/utils/analyticsUtils';

const FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG = 'feature-promotions';

declare global {
  interface Window {
    __featurePromotionsDebug?: {
      registry: {
        enabled: boolean | undefined;
        flagKeys: string[];
        key: string;
        payload: unknown;
      };
      flags: Array<{
        enabled: boolean | undefined;
        key: string;
        parsedPromotionId?: string;
        payload: unknown;
      }>;
      hookMounted?: boolean;
      localState: string | null;
      parsedPromotionIds: string[];
    };
    __refreshFeaturePromotions?: () => FeaturePromotion[];
  }
}

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

  // Snap Builder is retired. Ignore stale feature-flag payloads rather than
  // showing a promotion whose action no longer exists.
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
  const registryEnabled = Analytics.isFeatureEnabled(
    FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG,
  );
  const registryPayload = Analytics.getFeatureFlagPayload(
    FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG,
  );
  const flagKeys =
    registryEnabled === true
      ? parseFeaturePromotionRegistryPayload(registryPayload)
      : [];

  const flagStates = flagKeys.map((key) => {
    const enabled = Analytics.isFeatureEnabled(key);
    const payload = Analytics.getFeatureFlagPayload(key);
    const promotion =
      enabled === true
        ? parseFeaturePromotionPayload(payload, { fallbackId: key })
        : null;

    return {
      enabled,
      key,
      payload,
      promotion,
    };
  });
  const promotions = flagStates
    .map(({ promotion }) => promotion)
    .filter((promotion): promotion is FeaturePromotion => promotion !== null);

  if (isDev) {
    window.__featurePromotionsDebug = {
      registry: {
        enabled: registryEnabled,
        flagKeys,
        key: FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG,
        payload: registryPayload,
      },
      flags: flagStates.map(({ enabled, key, payload, promotion }) => ({
        enabled,
        key,
        parsedPromotionId: promotion?.id,
        payload,
      })),
      hookMounted: window.__featurePromotionsDebug?.hookMounted,
      localState: window.localStorage.getItem('feature-promotion-state-v1'),
      parsedPromotionIds: promotions.map((promotion) => promotion.id),
    };
  }

  return promotions;
}

function useFeaturePromotionPayload() {
  const [promotions, setPromotions] = useState<FeaturePromotion[]>(() =>
    readFeaturePromotionPayload(),
  );

  const refreshPromotions = useCallback(() => {
    setPromotions(readFeaturePromotionPayload());
  }, []);

  useEffect(() => {
    if (isDev) {
      window.__featurePromotionsDebug = {
        registry: window.__featurePromotionsDebug?.registry ?? {
          enabled: undefined,
          flagKeys: [],
          key: FEATURE_PROMOTIONS_POSTHOG_REGISTRY_FLAG,
          payload: undefined,
        },
        flags: window.__featurePromotionsDebug?.flags ?? [],
        hookMounted: true,
        localState: window.localStorage.getItem('feature-promotion-state-v1'),
        parsedPromotionIds:
          window.__featurePromotionsDebug?.parsedPromotionIds ?? [],
      };
      window.__refreshFeaturePromotions = () => {
        const nextPromotions = readFeaturePromotionPayload();
        setPromotions(nextPromotions);
        return nextPromotions;
      };
    }

    refreshPromotions();
    const unsubscribe = Analytics.onFeatureFlags(refreshPromotions);

    return () => {
      unsubscribe();
      if (isDev) {
        delete window.__refreshFeaturePromotions;
      }
    };
  }, [refreshPromotions]);

  return promotions;
}

export { useFeaturePromotionPayload };
