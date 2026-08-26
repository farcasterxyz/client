import { useOnboardingState } from '~/hooks/data/useOnboardingState';

const useWalletGeoRestricted = () => {
  const geoRestricted = useOnboardingState().result.state.geoRestricted;
  return geoRestricted;
};

export { useWalletGeoRestricted };
