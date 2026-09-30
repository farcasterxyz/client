const authTokenKey = 'auth-token';
const featureFlagsKey = 'feature-flags';
const mostRecentReactionsKey = 'most-recent-reactions';
const transportAgreementPublicKeysKey = 'transport-agreement-public-keys';
const castDraftsKey = 'cast-drafts';

const getOnboardingStateKey = async (authTokenSecret: string) => {
  // Hash the secret to avoid storing the raw value in storage keys
  const encoder = new TextEncoder();
  const data = encoder.encode(authTokenSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `onboarding-state:${hashHex}`;
};

const wallet = {
  dismissedSetPreferredWalletKey: 'wallet:dismissed-set-preferred-wallet',
  forceCreateWallet: 'wallet:force-create-wallet',
};

export {
  authTokenKey,
  castDraftsKey,
  featureFlagsKey,
  getOnboardingStateKey,
  mostRecentReactionsKey,
  transportAgreementPublicKeysKey,
};

// prefer adding keys here to minimize global namespace polution
export const storageKeys = {
  wallet,
};
