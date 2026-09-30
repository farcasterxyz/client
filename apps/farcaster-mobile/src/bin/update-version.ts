/* eslint-disable no-console */
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import minimist from 'minimist';
import { join } from 'path';

import { MOBILE_ROOT_DIR } from './common';

const APP_JSON_PATH = join(MOBILE_ROOT_DIR, 'app.json');
const INFO_PLIST_PATH = join(MOBILE_ROOT_DIR, 'ios', 'Farcaster', 'Info.plist');
const PBXPROJ_PATH = join(
  MOBILE_ROOT_DIR,
  'ios',
  'Farcaster.xcodeproj',
  'project.pbxproj',
);
const IOS_EXTENSION_INFOPLISTS = ['FarcasterNotifications/Info.plist'];
const ANDROID_GRADLE_PATH = join(
  MOBILE_ROOT_DIR,
  'android',
  'app',
  'build.gradle',
);
const ANDROID_STRINGS_XML_PATH = join(
  MOBILE_ROOT_DIR,
  'android',
  'app',
  'src',
  'main',
  'res',
  'values',
  'strings.xml',
);

type Platform = 'ios' | 'android';

type CliArgs = {
  version?: string;
  'build-number'?: string;
  platform?: string;
  'dry-run'?: boolean;
  'keep-runtime-version'?: boolean;
};

type WriteOptions = {
  dryRun: boolean;
};

function writeFile(path: string, contents: string, options: WriteOptions) {
  if (options.dryRun) {
    console.log(chalk.blue(`[dry-run] ${path} would be updated.`));
    return;
  }

  writeFileSync(path, contents);
}

function readCurrentBuildNumbers(): { ios: number; android: number } {
  const raw = readFileSync(APP_JSON_PATH, 'utf-8');
  const data = JSON.parse(raw);

  const ios = Number.parseInt(data.expo?.ios?.buildNumber ?? '0', 10);
  const android = data.expo?.android?.versionCode ?? 0;

  return { ios, android };
}

function updateAppJson(
  version: string,
  buildNumber: number,
  platform: Platform,
  options: WriteOptions & { keepRuntimeVersion?: boolean },
) {
  const raw = readFileSync(APP_JSON_PATH, 'utf-8');
  const data = JSON.parse(raw);

  data.expo = data.expo ?? {};
  data.expo.version = version;

  if (platform === 'ios') {
    const previousIosBuild = data.expo.ios?.buildNumber;
    const previousRuntimeVersion = data.expo.ios?.runtimeVersion;
    data.expo.ios = data.expo.ios ?? {};
    data.expo.ios.buildNumber = String(buildNumber);
    if (!options.keepRuntimeVersion) {
      data.expo.ios.runtimeVersion = version;
    }
    const runtimeVersionMsg = options.keepRuntimeVersion
      ? `iOS runtimeVersion → ${previousRuntimeVersion} (kept)`
      : `iOS runtimeVersion → ${version}`;
    console.log(
      chalk.yellow('Updating app.json'),
      `(version → ${version}, iOS build ${previousIosBuild ?? 'n/a'} → ${buildNumber}, ${runtimeVersionMsg})`,
    );
  } else {
    const previousAndroidCode = data.expo.android?.versionCode;
    const previousRuntimeVersion = data.expo.android?.runtimeVersion;
    data.expo.android = data.expo.android ?? {};
    data.expo.android.versionCode = buildNumber;
    if (!options.keepRuntimeVersion) {
      data.expo.android.runtimeVersion = version;
    }
    const runtimeVersionMsg = options.keepRuntimeVersion
      ? `Android runtimeVersion → ${previousRuntimeVersion} (kept)`
      : `Android runtimeVersion → ${version}`;
    console.log(
      chalk.yellow('Updating app.json'),
      `(version → ${version}, Android versionCode ${previousAndroidCode ?? 'n/a'} → ${buildNumber}, ${runtimeVersionMsg})`,
    );
  }

  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  if (serialized !== raw) {
    writeFile(APP_JSON_PATH, serialized, options);
  }
}

function replacePlistValue(contents: string, key: string, value: string) {
  const pattern = new RegExp(
    `(\\<key\\>${key}\\<\\/key\\>\\s*\\<string\\>)([^<]+)(\\<\\/string\\>)`,
  );

  if (!pattern.test(contents)) {
    throw new Error(`Could not find <key>${key}</key> in Info.plist`);
  }

  return contents.replace(pattern, `$1${value}$3`);
}

function updateInfoPlist(
  version: string,
  buildNumber: number,
  options: WriteOptions,
) {
  const raw = readFileSync(INFO_PLIST_PATH, 'utf-8');
  const versionMatch = raw.match(
    /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/,
  );
  const buildMatch = raw.match(
    /<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/,
  );

  const updated = replacePlistValue(
    replacePlistValue(raw, 'CFBundleShortVersionString', version),
    'CFBundleVersion',
    String(buildNumber),
  );

  console.log(
    chalk.yellow('Updating ios/Farcaster/Info.plist'),
    `(CFBundleShortVersionString ${versionMatch?.[1] ?? 'n/a'} → ${version}, CFBundleVersion ${
      buildMatch?.[1] ?? 'n/a'
    } → ${buildNumber})`,
  );

  if (updated !== raw) {
    writeFile(INFO_PLIST_PATH, updated, options);
  }
}

function updateExtensionVersions(
  version: string,
  buildNumber: number,
  options: WriteOptions,
) {
  const raw = readFileSync(PBXPROJ_PATH, 'utf-8');

  const buildConfigBlock =
    /\t+[0-9A-F]{24} \/\* (?:Debug|Release) \*\/ = \{\n\t+isa = XCBuildConfiguration;\n[\s\S]*?\n\t+name = (?:Debug|Release);\n\t+\};/g;

  let updatedBlocks = 0;
  const updated = raw.replace(buildConfigBlock, (block) => {
    const isExtensionBlock = IOS_EXTENSION_INFOPLISTS.some((plist) =>
      block.includes(`INFOPLIST_FILE = ${plist};`),
    );
    if (!isExtensionBlock) {
      return block;
    }

    updatedBlocks += 1;
    return block
      .replace(
        /CURRENT_PROJECT_VERSION = [^;]+;/,
        `CURRENT_PROJECT_VERSION = ${buildNumber};`,
      )
      .replace(/MARKETING_VERSION = [^;]+;/, `MARKETING_VERSION = ${version};`);
  });

  if (updatedBlocks === 0) {
    throw new Error(
      `Could not find any iOS app-extension build configurations in project.pbxproj ` +
        `(looked for INFOPLIST_FILE: ${IOS_EXTENSION_INFOPLISTS.join(', ')}). ` +
        `Update IOS_EXTENSION_INFOPLISTS if an extension was renamed or removed.`,
    );
  }

  console.log(
    chalk.yellow('Updating ios/Farcaster.xcodeproj/project.pbxproj'),
    `(${updatedBlocks} app-extension build config(s) → MARKETING_VERSION ${version}, CURRENT_PROJECT_VERSION ${buildNumber})`,
  );

  if (updated !== raw) {
    writeFile(PBXPROJ_PATH, updated, options);
  }
}

function updateAndroidGradle(
  version: string,
  buildNumber: number,
  options: WriteOptions,
) {
  const raw = readFileSync(ANDROID_GRADLE_PATH, 'utf-8');
  const versionNamePattern = /versionName\s+"([^"]+)"/;
  const versionCodePattern = /versionCode\s+(\d+)/;

  const versionNameMatch = raw.match(versionNamePattern);
  const versionCodeMatch = raw.match(versionCodePattern);

  if (!versionNameMatch || !versionCodeMatch) {
    throw new Error('Could not find versionName/versionCode in build.gradle');
  }

  const updated = raw
    .replace(versionNamePattern, `versionName "${version}"`)
    .replace(versionCodePattern, `versionCode ${buildNumber}`);

  console.log(
    chalk.yellow('Updating android/app/build.gradle'),
    `(versionName ${versionNameMatch[1]} → ${version}, versionCode ${versionCodeMatch[1]} → ${buildNumber})`,
  );

  if (updated !== raw) {
    writeFile(ANDROID_GRADLE_PATH, updated, options);
  }
}

function updateAndroidStringsXml(version: string, options: WriteOptions) {
  const raw = readFileSync(ANDROID_STRINGS_XML_PATH, 'utf-8');
  const pattern =
    /(<string name="expo_runtime_version"[^>]*>)([^<]+)(<\/string>)/;
  const match = raw.match(pattern);

  if (!match) {
    throw new Error(
      'Could not find expo_runtime_version in android strings.xml',
    );
  }

  const updated = raw.replace(pattern, `$1${version}$3`);

  console.log(
    chalk.yellow('Updating android strings.xml'),
    `(expo_runtime_version ${match[2]} → ${version})`,
  );

  if (updated !== raw) {
    writeFile(ANDROID_STRINGS_XML_PATH, updated, options);
  }
}

function validateVersion(version: string) {
  const semverPattern = /^\d+\.\d+\.\d+$/;
  if (!semverPattern.test(version)) {
    throw new Error(
      `Version "${version}" is invalid. Expected format like 2.0.14.`,
    );
  }
}

function main() {
  const args = minimist<CliArgs>(process.argv.slice(2), {
    string: ['version', 'build-number', 'platform'],
    boolean: ['dry-run', 'keep-runtime-version'],
    alias: {
      version: 'v',
      'build-number': 'b',
      platform: 'p',
    },
  });

  const releaseVersion = args.version;
  const buildNumberInput = args['build-number'];
  const platform = args.platform as Platform | undefined;

  if (!releaseVersion) {
    console.error(chalk.red('Missing required argument --version'));
    process.exit(1);
  }

  if (!platform || (platform !== 'ios' && platform !== 'android')) {
    console.error(
      chalk.red(
        'Missing or invalid --platform argument. Must be "ios" or "android".',
      ),
    );
    process.exit(1);
  }

  validateVersion(releaseVersion);

  let buildNumber: number;

  if (buildNumberInput) {
    buildNumber = Number.parseInt(buildNumberInput, 10);
    if (Number.isNaN(buildNumber) || buildNumber <= 0) {
      console.error(
        chalk.red(
          `Build number "${buildNumberInput}" is invalid. It must be a positive integer.`,
        ),
      );
      process.exit(1);
    }
  } else {
    const current = readCurrentBuildNumbers();
    buildNumber = Math.max(current.ios, current.android) + 1;
    console.log(
      chalk.gray(
        `Auto-incrementing build number: max(iOS=${current.ios}, Android=${current.android}) + 1 = ${buildNumber}`,
      ),
    );
  }

  const dryRun = args['dry-run'] ?? false;
  const keepRuntimeVersion = args['keep-runtime-version'] ?? false;

  console.log(
    chalk.green(
      `Applying version ${releaseVersion} (build ${buildNumber}) for ${platform}${keepRuntimeVersion ? ' (keeping runtimeVersion)' : ''}`,
    ),
    dryRun ? chalk.blue('(dry-run)') : '',
  );

  const writeOptions: WriteOptions & { keepRuntimeVersion?: boolean } = {
    dryRun,
    keepRuntimeVersion,
  };

  updateAppJson(releaseVersion, buildNumber, platform, writeOptions);

  if (platform === 'ios') {
    updateInfoPlist(releaseVersion, buildNumber, writeOptions);
    updateExtensionVersions(releaseVersion, buildNumber, writeOptions);
  } else {
    updateAndroidGradle(releaseVersion, buildNumber, writeOptions);
    if (!keepRuntimeVersion) {
      updateAndroidStringsXml(releaseVersion, writeOptions);
    } else {
      console.log(
        chalk.yellow('Skipping android strings.xml'),
        '(expo_runtime_version kept unchanged)',
      );
    }
  }

  console.log(
    dryRun
      ? chalk.blue('\nDry run complete. No files were changed.')
      : chalk.green('\nVersion files updated successfully.'),
  );
}

try {
  main();
} catch (error) {
  console.error(chalk.red((error as Error).message));
  process.exit(1);
}
