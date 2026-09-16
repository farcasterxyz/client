import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildLookupOnboardingStateKey = ({ email }: { email: string }) =>
  compactQueryKey(['lookupOnboardingState', email]);
