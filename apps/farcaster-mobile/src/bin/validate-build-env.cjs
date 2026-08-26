/* global console, process */

// Fail EAS builds when the App Check debug token would leak into a non-production build profile.

const { env, exit } = process;

const APP_CHECK_DEBUG_TOKEN_ENV = 'EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN';
const EXPO_NONPROD_BUILD_PROFILES = new Set([
  'development',
  'preview',
  'internal',
  'simulator',
]);

const buildProfile = env.EAS_BUILD_PROFILE;
const hasAppCheckDebugToken = Boolean(env[APP_CHECK_DEBUG_TOKEN_ENV]);

if (
  hasAppCheckDebugToken &&
  (!buildProfile || !EXPO_NONPROD_BUILD_PROFILES.has(buildProfile))
) {
  console.error(
    `${APP_CHECK_DEBUG_TOKEN_ENV} must only be set for internal EAS build profiles. ` +
      `Current EAS_BUILD_PROFILE=${buildProfile ?? '<unset>'}.`,
  );
  exit(1);
}
