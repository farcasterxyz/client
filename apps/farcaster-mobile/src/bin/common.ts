/* eslint-disable no-console */
import chalk from 'chalk';
import { execSync } from 'child_process';
import { normalize } from 'path';
import SimpleGit from 'simple-git';

export const MOBILE_ROOT_DIR = normalize(`${__dirname}/../..`);

export const git = SimpleGit({
  baseDir: MOBILE_ROOT_DIR,
});

export function runWithInheritedIo(command: string): void {
  execSync(command, {
    cwd: MOBILE_ROOT_DIR,
    encoding: 'utf-8',
    stdio: 'inherit',
  });
}

export async function ensureCleanBranch() {
  const status = await git.status();

  if (!status.isClean()) {
    console.error(
      chalk.red.bold(
        '\nThe current branch is not clean. Please stash or commit your changes.\n',
      ),
    );
    process.exit(1);
  }
}

export async function pullLatest() {
  const { current: currentBranch } = await git.branch();

  console.log(chalk.yellow(`Pulling latest from ${currentBranch}...`));
  await git.pull('origin', currentBranch, { '--no-rebase': null });

  const localRef = await git.revparse([currentBranch]);
  const remoteRef = await git.revparse([`origin/${currentBranch}`]);

  if (localRef !== remoteRef) {
    console.error(
      chalk.red(
        `\nLatest commmit differs between local and remote. Please push your changes.\n`,
      ),
    );
    process.exit(1);
  }
}

export async function reinstallDependencies() {
  console.log(chalk.yellow('Installing dependencies...'));
  runWithInheritedIo('pnpm -w install');

  console.log(chalk.yellow('Building packages'));
  runWithInheritedIo('pnpm --filter farcaster-mobile... build');

  // sync the recent build of farcaster-expo
  runWithInheritedIo('pnpm i');
}

export async function typecheck() {
  console.log(chalk.yellow('Typechecking...'));
  runWithInheritedIo('pnpm typecheck');
}
