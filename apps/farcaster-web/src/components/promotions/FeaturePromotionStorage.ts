import type { FeaturePromotionClientStateById } from 'farcaster-client-hooks';

const FEATURE_PROMOTION_STATE_KEY = 'feature-promotion-state-v1';

function readFeaturePromotionClientState(): FeaturePromotionClientStateById {
  try {
    const raw = window.localStorage.getItem(FEATURE_PROMOTION_STATE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeFeaturePromotionClientState(
  state: FeaturePromotionClientStateById,
): void {
  window.localStorage.setItem(
    FEATURE_PROMOTION_STATE_KEY,
    JSON.stringify(state),
  );
}

function updateFeaturePromotionClientState({
  promoId,
  updates,
}: {
  promoId: string;
  updates: NonNullable<FeaturePromotionClientStateById[string]>;
}): FeaturePromotionClientStateById {
  const state = readFeaturePromotionClientState();
  const nextState = {
    ...state,
    [promoId]: {
      ...state[promoId],
      ...updates,
    },
  };

  writeFeaturePromotionClientState(nextState);
  return nextState;
}

export { readFeaturePromotionClientState, updateFeaturePromotionClientState };
