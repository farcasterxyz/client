// adapted from https://gist.github.com/nandorojo/8371475fe9912cb6b8d4f326664f1fc6

/* eslint-disable no-console */
import { spawn } from 'child_process';
import { existsSync, readFileSync, rmSync } from 'fs';
import { dirname, join } from 'path';

import { MOBILE_ROOT_DIR } from './common';

type EasUpdateOptions = {
  nonInteractive: boolean;
  message?: string;
  platform?: 'ios' | 'android' | 'all';
};

const DIST_DIR = join(MOBILE_ROOT_DIR, 'dist');
const APP_JSON_PATH = join(MOBILE_ROOT_DIR, 'app.json');
const METADATA_PATH = join(DIST_DIR, 'metadata.json');

const POSTHOG_CLI_BIN = join(
  MOBILE_ROOT_DIR,
  'node_modules',
  '.bin',
  'posthog-cli',
);
const DATADOG_CI_BIN = join(
  MOBILE_ROOT_DIR,
  'node_modules',
  '.bin',
  'datadog-ci',
);

const POSTHOG_SELF_HOSTED_HOST = 'https://ph.neynar.com';
// Default PostHog project when POSTHOG_CLI_PROJECT_ID is unset — the dev project,
// matching the native iOS/Android build hooks. Prod OTA runs set this explicitly
// (per channel) in the workflow; this default keeps a local `pnpm ota` (API key
// only) from failing after publish.
const POSTHOG_DEFAULT_PROJECT_ID = '3';
// Our Datadog RUM SDK is configured `site: 'US1'`; source maps must be uploaded
// to the same site or they never match RUM events. US1 === datadoghq.com.
const DATADOG_DEFAULT_SITE = 'datadoghq.com';
const DATADOG_SERVICE = 'farcaster-mobile';

function runCommand(
  cmd: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: 'inherit',
      env,
      cwd: MOBILE_ROOT_DIR,
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

/**
 * Reads the app version + native build number for a specific platform from
 * app.json. These are recorded as metadata on the uploaded source maps so a map
 * ties back to the native build it shipped against (and mirrors what the RUM SDK
 * reports at runtime). iOS and Android can ship independently with their OWN
 * build numbers — and potentially versions — so resolve per-platform rather than
 * assuming they match: the version (shared `expo.version`, with an optional
 * per-platform override) plus that platform's own buildNumber / versionCode.
 */
function readReleaseMetadata(platform: 'ios' | 'android'): {
  version: string;
  build: string;
} {
  const { expo } = JSON.parse(readFileSync(APP_JSON_PATH, 'utf-8'));
  const version = expo?.[platform]?.version ?? expo?.version;
  const rawBuild =
    platform === 'ios' ? expo?.ios?.buildNumber : expo?.android?.versionCode;
  if (version === undefined || rawBuild === undefined) {
    throw new Error(
      `Source map upload: could not read ${platform} version/build from app.json (version=${version}, build=${rawBuild}).`,
    );
  }
  return { version, build: String(rawBuild) };
}

/**
 * Exports the JS bundle(s) AND their source maps to `dist/`. We export
 * explicitly (rather than letting `eas update` bundle internally) so the exact
 * artifact we publish is the one we upload source maps for — guaranteeing the
 * Debug IDs match. `expo export` omits source maps unless `--source-maps` is
 * passed.
 *
 * `--platform all` would also bundle web (app.json doesn't restrict platforms),
 * which OTA never targets and which doesn't build in this repo. So expand 'all'
 * to the native platforms explicitly — `--platform` is repeatable. (The legacy
 * `eas update` path was implicitly native-only, which is why this never surfaced
 * before.)
 */
async function exportWithSourceMaps(platform: 'ios' | 'android' | 'all') {
  // `expo export` refuses to write into a non-empty directory.
  rmSync(DIST_DIR, { recursive: true, force: true });
  const platforms = platform === 'all' ? ['ios', 'android'] : [platform];
  await runCommand('npx', [
    'expo',
    'export',
    '--source-maps',
    ...platforms.flatMap((p) => ['--platform', p]),
    '--output-dir',
    DIST_DIR,
  ]);
  if (!existsSync(METADATA_PATH)) {
    throw new Error(
      `Source map upload: ${METADATA_PATH} not found after export. expo export did not produce a bundle.`,
    );
  }
}

/**
 * Uploads a single platform's Hermes source map to the self-hosted PostHog
 * instance. PostHog reads the per-bundle Debug ID from the sourcemap, so it can
 * symbolicate JS errors even for OTA updates that ship against an unchanged
 * native build. `--directory` is scoped to the platform's export subdirectory so
 * each platform is tagged with its own release/build metadata.
 *
 * Credential presence is gated by the caller. Dev/prod PostHog project selection
 * is also the caller's responsibility (POSTHOG_CLI_PROJECT_ID is set from the OTA
 * channel in the workflow); this just trusts what it's given.
 */
async function uploadPostHogSourceMaps(
  platform: string,
  sourcemapDir: string,
  version: string,
  build: string,
) {
  if (!existsSync(POSTHOG_CLI_BIN)) {
    throw new Error(
      `PostHog source map upload: posthog-cli not found at ${POSTHOG_CLI_BIN}. Run pnpm install.`,
    );
  }

  console.log(`Uploading ${platform} Hermes source map to PostHog...`);
  await runCommand(
    POSTHOG_CLI_BIN,
    [
      'hermes',
      'upload',
      '--directory',
      sourcemapDir,
      '--release-version',
      version,
      '--build',
      build,
    ],
    {
      ...process.env,
      POSTHOG_CLI_HOST:
        process.env.POSTHOG_CLI_HOST ?? POSTHOG_SELF_HOSTED_HOST,
      POSTHOG_CLI_PROJECT_ID:
        process.env.POSTHOG_CLI_PROJECT_ID ?? POSTHOG_DEFAULT_PROJECT_ID,
    },
  );
}

/**
 * Uploads a single platform's React Native source map to Datadog. Datadog reads
 * the per-bundle Debug ID from the sourcemap (injected by the Metro config) as
 * the symbolication join key; --release-version / --build-version are recorded as
 * metadata that mirrors what the RUM SDK reports at runtime for that platform.
 * The sourcemap sits next to its bundle as `<bundle>.map`.
 */
async function uploadDatadogSourceMaps(
  platform: string,
  bundle: string,
  sourcemap: string,
  version: string,
  build: string,
) {
  if (!existsSync(DATADOG_CI_BIN)) {
    throw new Error(
      `Datadog source map upload: datadog-ci not found at ${DATADOG_CI_BIN}. Run pnpm install.`,
    );
  }
  // Credential presence (DATADOG_API_KEY or DD_API_KEY) is gated by the caller;
  // datadog-ci reads whichever of the two is present from the env.

  console.log(`Uploading ${platform} source map to Datadog...`);
  await runCommand(
    DATADOG_CI_BIN,
    [
      'react-native',
      'upload',
      '--platform',
      platform,
      '--service',
      DATADOG_SERVICE,
      '--bundle',
      bundle,
      '--sourcemap',
      sourcemap,
      '--release-version',
      version,
      '--build-version',
      build,
    ],
    {
      ...process.env,
      DATADOG_SITE: process.env.DATADOG_SITE ?? DATADOG_DEFAULT_SITE,
    },
  );
}

/**
 * Publishes an OTA update and uploads its source maps to both PostHog and
 * Datadog so JS stack traces are de-obfuscated in each. Flow:
 *   1. expo export (with source maps) → dist/
 *   2. eas update --skip-bundler --input-dir dist → publish that exact export
 *   3. upload source maps from dist/ to both vendors
 *
 * Publish happens before upload so a flaky telemetry upload never blocks
 * shipping the JS fix; both uploads are attempted even if one fails, and any
 * failure is surfaced loudly at the end.
 */
export async function easUpdateWithSourceMaps(
  releaseChannel: string,
  options?: EasUpdateOptions,
) {
  const platform = options?.platform ?? 'all';

  // @ts-ignore - force color output from eas-cli / expo
  process.env.FORCE_COLOR = true;

  await exportWithSourceMaps(platform);

  const updateArgs = [
    'update',
    '--branch',
    releaseChannel,
    '--skip-bundler',
    '--input-dir',
    DIST_DIR,
  ];
  if (platform !== 'all') {
    updateArgs.push('--platform', platform);
  }
  if (options?.nonInteractive) {
    updateArgs.push('--non-interactive');
    updateArgs.push('--message', options?.message ?? 'Automated OTA release');
  }
  await runCommand('eas', updateArgs);

  // The export manifest is the source of truth for which platforms were
  // published; resolve each platform's bundle + its OWN version/build from it so
  // iOS and Android maps are tagged independently (they can ship with different
  // build numbers).
  const { fileMetadata } = JSON.parse(readFileSync(METADATA_PATH, 'utf-8'));
  const platforms = Object.keys(fileMetadata ?? {}) as ('ios' | 'android')[];
  if (platforms.length === 0) {
    throw new Error(
      `Source map upload: no platforms found in ${METADATA_PATH}.`,
    );
  }

  // Source maps upload only when the relevant credentials are present, mirroring
  // the native build hooks (which skip uploads on cred-less local builds rather
  // than failing post-publish). When a vendor's credentials ARE present, its
  // upload is attempted and any failure is surfaced loudly at the end — so one
  // vendor's outage can't mask the other's, but a missing key is a clean skip.
  const hasPostHog = Boolean(process.env.POSTHOG_CLI_API_KEY?.trim());
  const hasDatadog = Boolean(
    process.env.DATADOG_API_KEY?.trim() || process.env.DD_API_KEY?.trim(),
  );
  if (!hasPostHog) {
    console.warn(
      'Skipping PostHog source map upload: POSTHOG_CLI_API_KEY is not set.',
    );
  }
  if (!hasDatadog) {
    console.warn(
      'Skipping Datadog source map upload: neither DATADOG_API_KEY nor DD_API_KEY is set.',
    );
  }

  // Datadog uploads are independent per platform (they join on per-bundle Debug
  // IDs), so they're safe to run concurrently. PostHog uploads are NOT: iOS and
  // Android share one release — monorepo@<version>+<build>, since they share
  // expo.version and (typically) the same build number — and `posthog-cli hermes
  // upload` lazily creates that release with a non-atomic check-then-create. Run
  // both platforms at once and they race the create: both see "release not found",
  // both POST, and the loser fails with "Hash id ... already in use". So collect
  // PostHog uploads as deferred thunks and run them sequentially (the first creates
  // the release, the rest reuse it); Datadog stays parallel.
  const datadogUploads: Promise<void>[] = [];
  const postHogUploadThunks: Array<() => Promise<void>> = [];
  for (const p of platforms) {
    const { version, build } = readReleaseMetadata(p);
    const bundle = join(DIST_DIR, fileMetadata[p].bundle);
    const sourcemap = `${bundle}.map`;
    if (!existsSync(bundle) || !existsSync(sourcemap)) {
      throw new Error(
        `Source map upload: missing bundle or sourcemap for ${p} (bundle=${bundle}, sourcemap=${sourcemap}).`,
      );
    }
    if (hasPostHog) {
      postHogUploadThunks.push(() =>
        uploadPostHogSourceMaps(p, dirname(bundle), version, build),
      );
    }
    if (hasDatadog) {
      datadogUploads.push(
        uploadDatadogSourceMaps(p, bundle, sourcemap, version, build),
      );
    }
  }

  // Run the PostHog uploads one at a time, but still attempt every one and collect
  // its outcome — a failure of one platform must not skip the other (nor mask a
  // Datadog failure), matching the parallel path's all-settled semantics.
  const runSequentiallySettled = async (
    thunks: Array<() => Promise<void>>,
  ): Promise<PromiseSettledResult<void>[]> => {
    const settled: PromiseSettledResult<void>[] = [];
    for (const thunk of thunks) {
      try {
        await thunk();
        settled.push({ status: 'fulfilled', value: undefined });
      } catch (reason) {
        settled.push({ status: 'rejected', reason });
      }
    }
    return settled;
  };

  const [datadogResults, postHogResults] = await Promise.all([
    Promise.allSettled(datadogUploads),
    runSequentiallySettled(postHogUploadThunks),
  ]);
  const failures = [...datadogResults, ...postHogResults].filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected',
  );
  if (failures.length > 0) {
    throw new Error(
      `Source map upload failed for ${failures.length} provider(s):\n` +
        failures.map((f) => `  - ${f.reason}`).join('\n'),
    );
  }
}
