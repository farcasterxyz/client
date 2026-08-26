import { NetworkMode } from '@tanstack/react-query';

const featurePromotionsDefaultQueryOptions = {
  staleTime: 1000 * 60 * 10,
  gcTime: 1000 * 60 * 60,
  networkMode: 'offlineFirst' as NetworkMode,
};

export { featurePromotionsDefaultQueryOptions };
