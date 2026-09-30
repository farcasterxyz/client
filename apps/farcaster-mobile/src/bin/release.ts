/* eslint-disable no-console */
import chalk from 'chalk';
import { execSync } from 'child_process';

import { MOBILE_ROOT_DIR } from './common';

type Platform = 'ios' | 'android';

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

function main() {
  const platform = process.argv[2] as Platform | undefined;
  const version = process.argv[3];

  if (!platform || (platform !== 'ios' && platform !== 'android')) {
    console.error(
      chalk.red(
        'Usage: pnpm release:ios <version> [flags] | pnpm release:android <version> [flags]',
      ),
    );
    console.error(chalk.red('Example: pnpm release:android 2.0.17'));
    console.error(
      chalk.gray(
        '  --build-number <n>  pin an explicit build id (e.g. to keep iOS and Android aligned)',
      ),
    );
    process.exit(1);
  }

  // Optional explicit build id. Without it, version:bump auto-increments via
  // max(ios, android) + 1. Pinning is how the weekly release cron keeps the
  // build id identical across the separate per-platform release branches.
  const buildNumberFlagIndex = process.argv.indexOf('--build-number');
  const explicitBuildNumber =
    buildNumberFlagIndex !== -1
      ? process.argv[buildNumberFlagIndex + 1]
      : undefined;
  if (buildNumberFlagIndex !== -1) {
    const parsed = Number.parseInt(explicitBuildNumber ?? '', 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      console.error(
        chalk.red(
          `Build number "${explicitBuildNumber ?? ''}" is invalid. It must be a positive integer.`,
        ),
      );
      process.exit(1);
    }
  }

  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(
      chalk.red(
        `Version "${version ?? ''}" is invalid. Expected format like 2.0.17.`,
      ),
    );
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

  // Prevent running on main — release script bumps runtimeVersion which breaks OTAs
  const currentBranch = run('git rev-parse --abbrev-ref HEAD');
  if (currentBranch === 'main' && !process.argv.includes('--allow-main')) {
    console.error(
      chalk.red(
        'Cannot release from main. Run from a release branch (e.g., releases/ios-v524).',
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

  const withBuildNumber = process.argv.includes('--with-build-number');

  // Bump version (auto-increments build number)
  const keepRuntimeVersion = process.argv.includes('--keep-runtime-version');
  console.log(
    chalk.green(
      `\nBumping ${platform} version to ${version}${keepRuntimeVersion ? ' (keeping runtimeVersion)' : ''}...\n`,
    ),
  );
  runInherited(
    `pnpm version:bump --platform ${platform} --version ${version}${
      explicitBuildNumber !== undefined
        ? ` --build-number ${explicitBuildNumber}`
        : ''
    }${keepRuntimeVersion ? ' --keep-runtime-version' : ''}`,
  );

  // Read the build number that was applied
  const appJson = JSON.parse(run('cat app.json'));
  const buildNumber =
    platform === 'ios'
      ? appJson.expo.ios.buildNumber
      : String(appJson.expo.android.versionCode);

  // Build tag — optionally append build number for re-releases of the same version
  const tag = withBuildNumber
    ? `${platform}/v${version}-${buildNumber}`
    : `${platform}/v${version}`;

  // Check if tag already exists
  try {
    run(`git rev-parse ${tag}`);
    console.error(chalk.red(`Tag "${tag}" already exists. Aborting.`));
    process.exit(1);
  } catch {
    // Tag doesn't exist, good
  }

  // Stage and commit
  const filesToStage = ['app.json'];
  if (platform === 'ios') {
    filesToStage.push('ios/Farcaster/Info.plist');
    filesToStage.push('ios/Farcaster.xcodeproj/project.pbxproj');
  } else {
    filesToStage.push('android/app/build.gradle');
    if (!keepRuntimeVersion) {
      filesToStage.push('android/app/src/main/res/values/strings.xml');
    }
  }

  run(`git add ${filesToStage.join(' ')}`);
  run(
    `git commit -m "release: bump ${platform} to ${version} (${buildNumber})"`,
  );

  // Create tag
  run(`git tag ${tag}`);
  console.log(chalk.green(`\nCreated tag: ${tag}`));

  // Push commit and tag atomically — both refs land or neither does, so a
  // partial failure can't leave the branch pushed without its tag.
  const branch = run('git rev-parse --abbrev-ref HEAD');
  console.log(chalk.yellow(`\nPushing to origin/${branch} and tag ${tag}...`));
  runInherited(`git push --atomic origin HEAD ${tag}`);

  console.log(
    chalk.green(`\n✓ Released ${platform} v${version} (build ${buildNumber})`),
  );
  console.log(chalk.green(`  Tag: ${tag}`));
  console.log(
    chalk.gray(`  CI will build and submit to the store automatically.`),
  );
}

try {
  main();
} catch (error) {
  console.error(chalk.red((error as Error).message));
  process.exit(1);
}
