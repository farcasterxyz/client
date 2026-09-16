/* eslint-disable no-undef */
const { getPostHogExpoConfig } = require('posthog-react-native/metro');
const { getDatadogExpoConfig } = require('@datadog/mobile-react-native/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Error-tracking symbolication relies on a per-bundle Debug ID. Both PostHog
// and Datadog inject one via Expo's `unstable_beforeAssetSerializationPlugins`
// hook. Verified empirically with `expo export --source-maps`: both write the
// SAME standard `debugId` field into the Hermes sourcemap, with an identical
// content-derived value — so a single `debugId` is matched by both posthog-cli
// and datadog-ci. (The vendors' `//# chunkId=` / `//# debugId=` bundle comments
// do NOT survive Hermes bytecode compilation; only the sourcemap `debugId`
// does, and that is what the upload CLIs key on.)
//
// We keep BOTH wrappers so each vendor's runtime SDK has its debug-id hook
// wired; they're additive and produce the identical id, so neither clobbers the
// other. Composing = getting both plugins into Expo's single getDefaultConfig
// call: we chain via the `getDefaultConfig` override option — Datadog (outer)
// appends its plugin then delegates to PostHog (inner), which appends its plugin
// and delegates to Expo's real getDefaultConfig. The inner call nulls out
// `getDefaultConfig` so PostHog falls back to Expo's real one instead of
// recursing.
//
// NB: do NOT use Datadog's `withDatadogMetroConfig` here — that's the bare-Metro
// customSerializer path and throws "Debug ID was not found in the bundle" on an
// Expo config. Source-map *uploads* are wired separately: OTA in
// src/bin/sourcemaps.ts; native builds via manual Xcode/Gradle hooks (this repo
// commits its native dirs and never runs `expo prebuild`, which makes the
// app.json Expo config plugins inert).
const config = getDatadogExpoConfig(projectRoot, {
  getDefaultConfig: (root, options) =>
    getPostHogExpoConfig(root, { ...options, getDefaultConfig: undefined }),
});

// Add SVG transformer configuration
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// Update resolver configuration
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(projectRoot, 'modules'),
  ],
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    zlib: require.resolve('browserify-zlib'),
    crypto: require.resolve('react-native-quick-crypto'),
    http: require.resolve('@tradle/react-native-http'),
    https: require.resolve('https-browserify'),
    stream: require.resolve('stream-browserify'),
  },
};

config.watchFolders = [monorepoRoot];

// @farcaster/snap has react as a devDependency. pnpm installs it into
// snap's own node_modules. When Metro processes files inside @farcaster/snap,
// it finds that copy of react first → dual React instances → hooks crash.
// Fix: intercept singleton packages and force them to resolve from this app.
const appNodeModules = path.resolve(projectRoot, 'node_modules');
const SINGLETONS = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
  '@tanstack/react-query',
  '@tanstack/react-query-persist-client',
  '@shopify/flash-list',
];

// Expo's Metro config has unstable_enablePackageExports: false by default,
// so `exports` field in package.json is ignored. Manually map subpath exports
// for packages that rely on them (@farcaster/snap, @json-render/*).
// TODO(NEYN-10115): Remove once proxy files are added to packages
function resolveSubpathExport(pkg, subpath, ext) {
  return path.join(appNodeModules, pkg, 'dist', subpath + '.' + ext);
}
const SUBPATH_EXPORTS = {
  // @farcaster/snap subpaths
  '@farcaster/snap': resolveSubpathExport('@farcaster/snap', 'index', 'js'),
  '@farcaster/snap/react-native': resolveSubpathExport(
    '@farcaster/snap',
    'react-native/index',
    'js',
  ),
  '@farcaster/snap/ui': resolveSubpathExport(
    '@farcaster/snap',
    'ui/index',
    'js',
  ),
  '@farcaster/snap/server': resolveSubpathExport(
    '@farcaster/snap',
    'server/index',
    'js',
  ),
  // @json-render/core subpaths
  '@json-render/core/store-utils': resolveSubpathExport(
    '@json-render/core',
    'store-utils',
    'js',
  ),
  // @json-render/react-native subpaths
  '@json-render/react-native/schema': resolveSubpathExport(
    '@json-render/react-native',
    'schema',
    'js',
  ),
  '@json-render/react-native/catalog': resolveSubpathExport(
    '@json-render/react-native',
    'catalog',
    'js',
  ),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force singleton packages to resolve from the app's node_modules
  if (SINGLETONS.includes(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(appNodeModules, '.shim') },
      moduleName,
      platform,
    );
  }

  // Subpath exports for packages that use `exports` field in package.json
  if (SUBPATH_EXPORTS[moduleName]) {
    return { filePath: SUBPATH_EXPORTS[moduleName], type: 'sourceFile' };
  }

  if (moduleName.startsWith('@wagmi/core/codegen')) {
    return {
      filePath: path.resolve(
        __dirname + '/node_modules/@wagmi/core/dist/esm/exports/codegen.js',
      ),
      type: 'sourceFile',
    };
  }

  // jose@4 (transitive dep of @privy-io/js-sdk-core) ships separate
  // Node.js and browser builds. With unstable_enablePackageExports disabled,
  // Metro may load the Node.js build which accesses process.versions.node
  // and crashes on Hermes. Redirect to the browser build.
  if (moduleName === 'jose') {
    const resolved = context.resolveRequest(context, moduleName, platform);
    if (
      resolved?.type === 'sourceFile' &&
      resolved.filePath?.includes('/jose/dist/node/')
    ) {
      return {
        filePath: resolved.filePath.replace(
          /\/dist\/node\/(cjs|esm)\//,
          '/dist/browser/',
        ),
        type: 'sourceFile',
      };
    }
    return resolved;
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
