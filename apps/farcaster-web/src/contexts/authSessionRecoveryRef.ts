type StartAuthSessionRecovery = () => boolean;

const authSessionRecoveryRef: { current: StartAuthSessionRecovery | null } = {
  current: null,
};

export { authSessionRecoveryRef };
