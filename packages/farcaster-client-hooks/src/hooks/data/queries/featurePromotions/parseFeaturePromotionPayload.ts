import type {
  FeaturePromotion,
  FeaturePromotionIcon,
  FeaturePromotionPostHogPayload,
} from './featurePromotionEligibility';

const featurePromotionPostHogPayloadExamples = {
  informationalPromo: {
    title: 'Stay up to date',
    subtitle: 'Follow the latest conversations from people you know.',
  },
  defaultAlert: {
    title: 'Wallet activity is delayed',
    subtitle: 'Some transactions may take longer than usual to appear.',
    alert: true,
  },
  styledPromo: {
    title: 'Explore the feed',
    subtitle: 'Discover more of what your community is discussing.',
    icon: 'news',
    iconBackgroundColor: '#E0F2FE',
    backgroundColor: '#F0F9FF',
  },
} as const satisfies Record<string, FeaturePromotionPostHogPayload>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseIcon(value: unknown): FeaturePromotionIcon | null {
  return value === 'alert' || value === 'news' ? value : null;
}

function parseFeaturePromotion(
  value: unknown,
  { fallbackId }: { fallbackId?: string } = {},
): FeaturePromotion | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id : fallbackId;

  if (
    typeof id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.subtitle !== 'string'
  ) {
    return null;
  }

  // Suppress stale Builder campaigns rather than leaving a non-functional
  // "Create a Snap" promotion in the feed after the Builder is removed.
  if (value.action === 'open_snap_builder') {
    return null;
  }

  const icon = parseIcon(value.icon);

  return {
    id,
    title: value.title,
    subtitle: value.subtitle,
    alert: value.alert === true,
    ...(icon ? { icon } : {}),
    ...(typeof value.iconBackgroundColor === 'string'
      ? { iconBackgroundColor: value.iconBackgroundColor }
      : {}),
    ...(typeof value.backgroundColor === 'string'
      ? { backgroundColor: value.backgroundColor }
      : {}),
  };
}

function parseFeaturePromotionPayload(
  payload: unknown,
  { fallbackId }: { fallbackId?: string } = {},
): FeaturePromotion | null {
  return parseFeaturePromotion(payload, { fallbackId });
}

export { featurePromotionPostHogPayloadExamples, parseFeaturePromotionPayload };
