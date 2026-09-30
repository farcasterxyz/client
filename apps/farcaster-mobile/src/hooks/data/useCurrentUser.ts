import { useCachedOnboardingState } from 'farcaster-client-hooks';

const useCurrentUser = () => {
  const onboardingState = useCachedOnboardingState();
  return onboardingState.result.state.user;
};

/**
 * Be careful when you are calling this hook as its not guaranteed to have
 * a current user defined per the onbarding state.
 * We are changing the name of the hook so its a way to signal possible downsides
 * of calling this from places likely user may not be authed yet (or no onboarding
 * state representing the user).
 * Other option here is to remove the ! operator but that requires updating a lot
 * of flows to handle the undefined value - and changeset likely is too big.
 * See: https://github.com/warpcast/monorepo/pull/2329 for an example when using this hook
 * outside of the expected flows may break the app.
 * If you are not sure whether or not if its safe to use this hook in your feature
 * please ping someone else on the team to get it reviewed.
 * @returns Possibly undefined current user object
 */
const useCurrentUser_UNSAFE = () => {
  return useCurrentUser()!;
};

export { useCurrentUser, useCurrentUser_UNSAFE };
