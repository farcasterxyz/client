import { useOnboardingState } from '~/hooks/data/useOnboardingState';

const useCurrentUser = () => {
  const user = useOnboardingState().result.state.user;
  return user!; // We assume that this hook is only used in an authed context and that the user is always present. Any hooks/components that can be used in both authed and unauthed contexts should _not_ use this hook and instead use `useIsSignedIn` to branch logic into separate components for authed and unauthed contexts OR if branching components is unavoidable for some reason, prefer `useCachedCurrentUser`, which won't trigger an API call.
};

export { useCurrentUser };
