const buildAuthenticatedUserKey = () => ['authenticatedUser'];

export type BuildAuthenticatedUserKey = ReturnType<
  typeof buildAuthenticatedUserKey
>;

export { buildAuthenticatedUserKey };
