/* eslint-disable no-console */
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { existsSync } from 'fs';
import minimist from 'minimist';
import { join } from 'path';
import rimraft from 'rimraf';

import {
  ensureCleanBranch,
  MOBILE_ROOT_DIR,
  pullLatest,
  reinstallDependencies,
  typecheck,
} from './common';
import { easUpdateWithSourceMaps } from './sourcemaps';

const DIST_PATH = join(MOBILE_ROOT_DIR, 'dist');

async function chooseReleaseChannel(
  releaseChannelType?: string,
): Promise<string> {
  if (releaseChannelType) {
    return releaseChannelType;
  }

  const releaseChannelResult = await select({
    message: 'Which release channel would you like to publish?',
    choices: [
      { name: 'internal', value: 'internal' },
      { name: 'production', value: 'production' },
    ],
    default: 'internal',
  });

  return releaseChannelResult;
}

async function publish(
  releaseChannel: string,
  nonInteractive: boolean,
  message?: string,
  platform?: 'ios' | 'android' | 'all',
) {
  console.log(
    chalk.yellow(
      `Publishing ${releaseChannel}${platform && platform !== 'all' ? ` (${platform} only)` : ''}...`,
    ),
  );
  await easUpdateWithSourceMaps(releaseChannel, {
    nonInteractive,
    message,
    platform,
  });
  console.log(chalk.yellow(`\nPublished ${releaseChannel}\n`));
}

async function removeDist() {
  if (existsSync(DIST_PATH)) {
    console.log(chalk.yellow(`Deleting ${DIST_PATH}...`));
    return new Promise((resolve) => {
      rimraft(DIST_PATH, resolve);
    });
  }
}

(async () => {
  const args = minimist<{
    'non-interactive': boolean;
    'release-channel': string;
    message?: string;
    platform?: string;
  }>(process.argv.slice(2));
  const nonInteractive = args['non-interactive'] ?? false;
  const releaseChannelType = args['release-channel'];
  const message = args['message'];
  const platform = (args['platform'] as 'ios' | 'android' | 'all') ?? undefined;
  await ensureCleanBranch();
  await pullLatest();
  const releaseChannel = await chooseReleaseChannel(releaseChannelType);
  await reinstallDependencies();
  await typecheck();
  await publish(releaseChannel, nonInteractive, message, platform);
  await removeDist();
})();
