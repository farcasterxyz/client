/* eslint-disable no-console */
import { execSync, ExecSyncOptions } from 'child_process';
import { readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

import {
  absoluteAppsRoot,
  absoluteClientDataRoot,
  absoluteClientHooksRoot,
  absoluteFarcasterCryptographyReactNativeRoot,
  absoluteFarcasterCryptographyRoot,
  absoluteFarcasterExpoRoot,
  absolutePackagesRoot,
} from './config';

type RequiredCwdOption = { cwd: string };

type PackageJson = {
  devDependencies: undefined | Record<string, string>;
  dependencies: undefined | Record<string, string>;
};
type PackageInfoDataObject = {
  name: undefined | string;
  description: undefined | string;
  version: string;
  dependencies: undefined | string[];
  devDependencies: undefined | string[];
};

type PackageInfoWithObjectData = {
  type: string;
  data: PackageInfoDataObject;
};

type PackageInfoWithStringData = {
  type: string;
  data: string;
};

type PackageInfo = PackageInfoWithObjectData | PackageInfoWithStringData;

const isPackageInfoWithObjectData = (
  info: PackageInfo,
): info is PackageInfoWithObjectData => typeof info === 'object';

async function getDirectories(source: string) {
  const results = await readdir(source, { withFileTypes: true });
  return results
    .filter((result) => result.isDirectory())
    .map((result) => result.name);
}

async function getAllApps() {
  const results = await getDirectories(absoluteAppsRoot);
  return results.map((result) => join(absoluteAppsRoot, result));
}

async function getAllPackages() {
  const results = await getDirectories(absolutePackagesRoot);
  return results.map((result) => join(absolutePackagesRoot, result));
}

async function getAllAppsAndPackages() {
  const apps = await getAllApps();
  const packages = await getAllPackages();
  return [...apps, ...packages];
}

function getPackageJsonPath(packagePath: string) {
  const pkgJsonPath = join(packagePath, 'package.json');
  return pkgJsonPath;
}

function getPackageJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function run(command: string, options: ExecSyncOptions & RequiredCwdOption) {
  return execSync(command, { stdio: 'inherit', ...options });
}

function publishClientData() {
  try {
    run(`pnpm build`, {
      cwd: absoluteClientDataRoot,
    });
  } catch (error) {
    console.error(error);
  }
}

function publishClientHooks() {
  try {
    run(`pnpm build`, {
      cwd: absoluteClientHooksRoot,
    });
  } catch (error) {
    console.error(error);
  }
}

function publishFarcasterCryptography() {
  try {
    run(`pnpm build`, {
      cwd: absoluteFarcasterCryptographyRoot,
    });
  } catch (error) {
    console.error(error);
  }
}

function publishFarcasterCryptographyReactNative() {
  try {
    run(`pnpm build`, {
      cwd: absoluteFarcasterCryptographyReactNativeRoot,
    });
  } catch (error) {
    console.error(error);
  }
}

function publishFarcasterExpo() {
  try {
    run(`pnpm build`, {
      cwd: absoluteFarcasterExpoRoot,
    });
  } catch (error) {
    console.error(error);
  }
}

export {
  getAllAppsAndPackages,
  getPackageJson,
  getPackageJsonPath,
  publishClientData,
  publishClientHooks,
  publishFarcasterCryptography,
  publishFarcasterCryptographyReactNative,
  publishFarcasterExpo,
  run,
};
