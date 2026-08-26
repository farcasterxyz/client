// Diagnostic context for a 401 routed through the revalidation probe, attached
// to the auth.sign_out_* telemetry so an unexpected logout (or a prevented one)
// can be traced to the endpoint / status / source that triggered it. Mirrors
// the mobile SignOutTrigger.
type AuthOnError401Trigger = {
  // Where the 401 was observed: the global apiClient.onError delegate, or the
  // onboarding-state refresh during cold-start init (before onError is wired).
  source: 'global_handler' | 'init_refresh';
  // The endpoint whose request 401'd (undefined when not known).
  endpointName: string | undefined;
  // The observed HTTP status (401 in practice; carried for diagnostics).
  responseStatus: number | undefined;
};

type AuthOnError401Fn = (trigger: AuthOnError401Trigger) => Promise<void>;

/**
 * Ref through which AuthProvider registers its 401 → /v2/me revalidation
 * handler. WebFarcasterApiClientProvider is the single apiClient.onError owner
 * and delegates to this ref, so the two providers never compete for the onError
 * slot (updateOptions merges last-write-wins, and the parent effect could
 * otherwise clobber the child's handler). The onboarding-refresh catch also
 * calls it so a transient 401 during cold-start init — before onError is even
 * wired — is probed rather than signing the user out immediately.
 */
const authOnError401Ref: { current: AuthOnError401Fn | null } = {
  current: null,
};

export { type AuthOnError401Fn, authOnError401Ref, type AuthOnError401Trigger };
