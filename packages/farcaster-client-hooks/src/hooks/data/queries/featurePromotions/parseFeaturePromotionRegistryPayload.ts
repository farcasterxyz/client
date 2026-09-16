function parseFeaturePromotionRegistryPayload(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter((flag): flag is string => typeof flag === 'string');
}

export { parseFeaturePromotionRegistryPayload };
