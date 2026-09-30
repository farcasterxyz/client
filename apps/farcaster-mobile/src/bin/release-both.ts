/* eslint-disable no-console */
import chalk from 'chalk';
import { execSync } from 'child_process';

import { MOBILE_ROOT_DIR } from './common';

/**
 * Cuts an iOS + Android native release in a single commit with a SHARED build
 * id, so the two platforms never diverge.
 *
 * Why this exists: `release:ios` and `release:android` run sequentially, and
 * each invokes `version:bump`, which auto-increments the build number via
 * `max(ios, android) + 1`. Running them back-to-back therefore produces two
 * different build ids (e.g. iOS 554, Android 555) across two commits. This
 * command pins ONE build number up front and applies it to both platforms in
 * a single commit, then tags both `ios/vX.Y.Z` and `android/vX.Y.Z` on that
 * same commit.
 *
 * Usage:
 *   pnpm release:both <version> [flags]
 *   pnpm release:both 2.1.8
 *   pnpm release:both 2.1.8 --build-number 554   # pin an explicit build id
 *   pnpm release:both 2.1.8 --with-build-number  # re-release: tags carry the
 *                                                # build suffix (ios/v2.1.8-554)
 *   pnpm release:both 2.1.8 --keep-runtime-version
 *   pnpm release:both 2.1.8 --dry-run
 */

function run(command: string): string {
  return execSync(command, {
    cwd: MOBILE_ROOT_DIR,
    encoding: 'utf-8',
  }).trim();
}

function runInherited(command: string): void {
  execSync(command, {
    cwd: MOBILE_ROOT_DIR,
    encoding: 'utf-8',
    stdio: 'inherit',
  });
}

function readBuildNumbers(): { ios: number; android: number } {
  const appJson = JSON.parse(run('cat app.json'));
  const ios = Number.parseInt(appJson.expo?.ios?.buildNumber ?? '0', 10);
  const android = appJson.expo?.android?.versionCode ?? 0;
  return { ios, android };
}

function tagExists(tag: string): boolean {
  // --verify --quiet exits non-zero with no stderr when the ref is absent.
  try {
    run(`git rev-parse --verify --quiet refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  const keepRuntimeVersion = args.includes('--keep-runtime-version');
  const withBuildNumber = args.includes('--with-build-number');
  const allowMain = args.includes('--allow-main');
  const dryRun = args.includes('--dry-run');

  const buildNumberFlagIndex = args.indexOf('--build-number');
  const buildNumberValueIndex =
    buildNumberFlagIndex !== -1 ? buildNumberFlagIndex + 1 : -1;
  const explicitBuildNumber =
    buildNumberValueIndex !== -1 ? args[buildNumberValueIndex] : undefined;

  // Version is the first positional arg — but skip the value that belongs to
  // --build-number, so flag order doesn't matter.
  const version = args.find(
    (arg, index) => !arg.startsWith('-') && index !== buildNumberValueIndex,
  );

  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(
      chalk.red(
        `Version "${version ?? ''}" is invalid. Expected format like 2.1.8.`,
      ),
    );
    console.error(chalk.red('Usage: pnpm release:both <version> [flags]'));
    process.exit(1);
  }

  // Ensure clean working tree
  const status = run('git status --porcelain');
  if (status) {
    console.error(
      chalk.red(
        'Working tree is not clean. Please stash or commit your changes.',
      ),
    );
    process.exit(1);
  }

  // Prevent running on main — bumping runtimeVersion here would break OTAs.
  const currentBranch = run('git rev-parse --abbrev-ref HEAD');
  if (currentBranch === 'main' && !allowMain) {
    console.error(
      chalk.red(
        'Cannot release from main. Run from a release branch (e.g., releases/2.1.8).',
      ),
    );
    console.error(
      chalk.red(
        'This prevents breaking OTA updates to current production users.',
      ),
    );
    console.error(
      chalk.gray('Use --allow-main to override (not recommended).'),
    );
    process.exit(1);
  }

  // Resolve ONE shared build number for both platforms.
  let buildNumber: number;
  if (explicitBuildNumber !== undefined) {
    buildNumber = Number.parseInt(explicitBuildNumber, 10);
    if (Number.isNaN(buildNumber) || buildNumber <= 0) {
      console.error(
        chalk.red(
          `Build number "${explicitBuildNumber}" is invalid. It must be a positive integer.`,
        ),
      );
      process.exit(1);
    }
  } else {
    const current = readBuildNumbers();
    buildNumber = Math.max(current.ios, current.android) + 1;
    console.log(
      chalk.gray(
        `Shared build number: max(iOS=${current.ios}, Android=${current.android}) + 1 = ${buildNumber}`,
      ),
    );
  }

  // Build tags (same commit, same build id for both platforms).
  const suffix = withBuildNumber ? `-${buildNumber}` : '';
  const iosTag = `ios/v${version}${suffix}`;
  const androidTag = `android/v${version}${suffix}`;

  for (const tag of [iosTag, androidTag]) {
    if (tagExists(tag)) {
      console.error(chalk.red(`Tag "${tag}" already exists. Aborting.`));
      process.exit(1);
    }
  }

  console.log(
    chalk.green(
      `\nReleasing v${version} (build ${buildNumber}) for iOS + Android${
        keepRuntimeVersion ? ' (keeping runtimeVersion)' : ''
      }...\n`,
    ),
    dryRun ? chalk.blue('(dry-run)') : '',
  );

  // Apply the SAME pinned build number to both platforms. version:bump owns
  // all the file mutations (app.json, Info.plist, build.gradle, strings.xml).
  const runtimeFlag = keepRuntimeVersion ? ' --keep-runtime-version' : '';
  const dryRunFlag = dryRun ? ' --dry-run' : '';
  for (const platform of ['ios', 'android'] as const) {
    runInherited(
      `pnpm version:bump --platform ${platform} --version ${version} --build-number ${buildNumber}${runtimeFlag}${dryRunFlag}`,
    );
  }

  if (dryRun) {
    console.log(
      chalk.blue(
        `\nDry run complete. Would commit both platforms and create tags: ${iosTag}, ${androidTag}.`,
      ),
    );
    return;
  }

  // Stage every file the bumps may have touched, across both platforms.
  const filesToStage = [
    'app.json',
    'ios/Farcaster/Info.plist',
    'ios/Farcaster.xcodeproj/project.pbxproj',
    'android/app/build.gradle',
  ];
  if (!keepRuntimeVersion) {
    filesToStage.push('android/app/src/main/res/values/strings.xml');
  }

  run(`git add ${filesToStage.join(' ')}`);
  run(
    `git commit -m "release: bump iOS+Android to ${version} (${buildNumber})"`,
  );

  // Tag both platforms on the single bump commit.
  run(`git tag ${iosTag}`);
  run(`git tag ${androidTag}`);
  console.log(chalk.green(`\nCreated tags: ${iosTag}, ${androidTag}`));

  // Push commit and both tags atomically — all refs land or none do, so a
  // partial failure can't leave the branch pushed without its tags.
  const branch = run('git rev-parse --abbrev-ref HEAD');
  console.log(
    chalk.yellow(
      `\nPushing to origin/${branch} and tags ${iosTag}, ${androidTag}...`,
    ),
  );
  runInherited(`git push --atomic origin HEAD ${iosTag} ${androidTag}`);

  console.log(
    chalk.green(
      `\n✓ Released v${version} (build ${buildNumber}) for iOS + Android`,
    ),
  );
  console.log(chalk.green(`  Tags: ${iosTag}, ${androidTag}`));
  console.log(
    chalk.gray(`  CI will build and submit both platforms automatically.`),
  );
}

try {
  main();
} catch (error) {
  console.error(chalk.red((error as Error).message));
  process.exit(1);
}
