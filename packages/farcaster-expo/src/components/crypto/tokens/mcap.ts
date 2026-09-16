type CanonicalMarketCapParams = {
  marketCap?: number | null;
  circulatingSupply?: string | number | null;
  effectivePriceUsd?: number | null;
};

export function getCanonicalMarketCap({
  marketCap,
  circulatingSupply,
  effectivePriceUsd,
}: CanonicalMarketCapParams): number | null {
  if (
    typeof marketCap === 'number' &&
    Number.isFinite(marketCap) &&
    marketCap > 0
  ) {
    return marketCap;
  }

  const parsedSupply =
    typeof circulatingSupply === 'string'
      ? Number(circulatingSupply)
      : circulatingSupply;
  if (
    typeof parsedSupply === 'number' &&
    Number.isFinite(parsedSupply) &&
    parsedSupply > 0 &&
    typeof effectivePriceUsd === 'number' &&
    Number.isFinite(effectivePriceUsd) &&
    effectivePriceUsd > 0
  ) {
    const product = parsedSupply * effectivePriceUsd;
    return Number.isFinite(product) && product > 0 ? product : null;
  }

  return null;
}

export function estimateMarketCapAtPrice({
  currentMarketCap,
  currentPriceUsd,
  targetPriceUsd,
}: {
  currentMarketCap?: number | null;
  currentPriceUsd?: number | null;
  targetPriceUsd?: number | null;
}): number | null {
  if (
    typeof currentMarketCap !== 'number' ||
    !Number.isFinite(currentMarketCap) ||
    currentMarketCap <= 0 ||
    typeof currentPriceUsd !== 'number' ||
    !Number.isFinite(currentPriceUsd) ||
    currentPriceUsd <= 0 ||
    typeof targetPriceUsd !== 'number' ||
    !Number.isFinite(targetPriceUsd) ||
    targetPriceUsd <= 0
  ) {
    return null;
  }

  const result = currentMarketCap * (targetPriceUsd / currentPriceUsd);
  return Number.isFinite(result) && result > 0 ? result : null;
}
