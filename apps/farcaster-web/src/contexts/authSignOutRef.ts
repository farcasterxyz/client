type AuthSignOutFn = () => Promise<void>;

const authSignOutRef: { current: AuthSignOutFn | null } = {
  current: null,
};

export { authSignOutRef };
