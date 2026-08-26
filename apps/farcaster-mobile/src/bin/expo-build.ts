/* eslint-disable no-console */
import chalk from 'chalk';
import minimist from 'minimist';

import {
  ensureCleanBranch,
  pullLatest,
  reinstallDependencies,
  runWithInheritedIo,
  typecheck,
} from './common';

const args = minimist<{
  platform: 'ios' | 'android';
  profile: 'production' | 'production-apk' | 'internal';
}>(process.argv.slice(2));

if (!['ios', 'android'].includes(args.platform)) {
  throw new Error("Platform must be either 'ios' or 'android'");
}
const platformName = args.platform === 'ios' ? 'iOS' : 'Android';

if (!['production', 'production-apk', 'internal'].includes(args.profile)) {
  throw new Error(
    "Profile must be 'production', 'production-apk' or 'internal'",
  );
}

if (args.profile === 'production-apk' && args.platform !== 'android') {
  throw new Error(
    "Profile 'production-apk' is only applicable when platform is 'android'",
  );
}

async function build() {
  console.log(`Building ${args.profile} bundle for ${platformName}`);
  runWithInheritedIo(
    `eas build --platform ${args.platform} --profile ${args.profile}`,
  );
  console.log(
    chalk.yellow(`\nBuilt ${args.profile} bundle for ${platformName}\n`),
  );
}

(async () => {
  console.log(`Starting ${args.profile} bundle build for ${platformName}`);
  await ensureCleanBranch();
  await pullLatest();
  await reinstallDependencies();
  await typecheck();
  await build();
})();
