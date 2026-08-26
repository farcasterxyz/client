#!/usr/bin/env npx tsx
/* eslint-disable no-console */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import transformer from '@margelo/hermes-profile-transformer';
import type { DurationEvent } from '@margelo/hermes-profile-transformer/dist/types/EventInterfaces';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('appId', {
    demandOption: true,
    type: 'string',
    default: 'com.farcaster.mobile',
    description: 'Android app package ID',
  })
  .option('out', {
    default: './.profiling/profiles',
    type: 'string',
    description: 'Output directory for profiles',
  })
  .option('map', {
    default: './.profiling/symbols/index.bundle.js.map',
    type: 'string',
    description: 'Path to source map file',
  }).argv as {
  appId: string;
  out: string;
  map: string;
};

const exec = (cmd: string, options?: { ignoreError?: boolean }) => {
  try {
    return execSync(cmd, { stdio: 'pipe', ...options })
      .toString()
      .trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (options?.ignoreError) return '';
    throw error;
  }
};

const adb = (cmd: string) => execSync(`adb ${cmd}`, { stdio: 'inherit' });

function toggleProfiler() {
  console.log('   Sending profiler command...');

  // Use the service approach that we know works
  adb(
    `shell am startservice -a com.farcaster.mobile.profiling.TOGGLE ${argv.appId}/.profiling.ProfilerService`,
  );

  // Give it a moment to process
  execSync('sleep 1');
}

async function askUserChoice(question: string): Promise<boolean> {
  console.log(question);
  console.log('   [Y]es / [N]o: ');

  return new Promise((resolve) => {
    const handler = (data: Buffer) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        process.stdin.off('data', handler);
        resolve(true);
      } else if (answer === 'n' || answer === 'no') {
        process.stdin.off('data', handler);
        resolve(false);
      } else {
        console.log('   Please answer Y or N: ');
      }
    };

    process.stdin.on('data', handler);
  });
}

async function fetchSourceMapFromMetro(): Promise<boolean> {
  const mapDir = path.dirname(argv.map);
  if (!fs.existsSync(mapDir)) {
    fs.mkdirSync(mapDir, { recursive: true });
  }

  // Check if source map already exists
  if (fs.existsSync(argv.map)) {
    const existingSize = fs.statSync(argv.map).size;
    const sizeMB = Math.round(existingSize / 1024 / 1024);
    console.log(`\n📦 Existing source map found (${sizeMB}MB)`);

    const reuseExisting = await askUserChoice(
      '   Do you want to reuse the existing source map?',
    );

    if (reuseExisting) {
      console.log('   ✓ Reusing existing source map\n');
      return true;
    }
    console.log('   Downloading fresh source map from Metro...\n');
  }

  console.log('▶︎ Fetching source map from Metro server...');

  // Check if Metro is running
  const metroHost = 'localhost';
  const metroPort = 8081;

  try {
    // Test if Metro is accessible
    const testUrl = `http://${metroHost}:${metroPort}/status`;
    const statusResponse = exec(
      `curl -s -o /dev/null -w "%{http_code}" "${testUrl}"`,
      { ignoreError: true },
    );

    if (statusResponse !== '200') {
      console.warn('   Metro server not running on port 8081');
      return false;
    }

    console.log('   Metro server detected, downloading source map...');

    // Use the known working URLs for farcaster-mobile
    const sourceMapUrl = `http://${metroHost}:${metroPort}/apps/farcaster-mobile/index.map?platform=android&dev=true&minify=false`;
    const absoluteMapPath = path.resolve(argv.map);

    // Download the source map
    execSync(`curl -s "${sourceMapUrl}" -o "${absoluteMapPath}"`, {
      stdio: 'pipe',
    });

    // Verify the download
    if (fs.existsSync(absoluteMapPath)) {
      const fileSize = fs.statSync(absoluteMapPath).size;

      if (fileSize > 1000) {
        // Quick check that it's a valid source map
        const mapContent = fs
          .readFileSync(absoluteMapPath, 'utf8')
          .substring(0, 100);
        if (mapContent.includes('"version":3')) {
          console.log(
            `   ✓ Source map downloaded (${Math.round(fileSize / 1024 / 1024)}MB)`,
          );
          return true;
        }
      }
      console.error('   Downloaded file is empty or invalid');
      return false;
    } else {
      console.error('   Failed to download source map - file does not exist');
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('   Error fetching from Metro:', error.message);
    return false;
  }
}

async function waitForLatestProfile(
  cacheDir: string,
  startTime: number,
): Promise<string | null> {
  console.log('   Waiting for profile file...');

  for (let i = 0; i < 10; i++) {
    try {
      const files = exec(
        `adb shell ls -la ${cacheDir}/*.cpuprofile 2>/dev/null || true`,
      );
      if (!files) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      // Parse the file listing to find files newer than startTime
      const lines = files
        .split('\n')
        .filter((line) => line.includes('.cpuprofile'));

      for (const line of lines) {
        const match = line.match(/profile_(\d+)\.cpuprofile/);
        if (match) {
          const fileTime = parseInt(match[1]);
          if (fileTime > startTime) {
            return `${cacheDir}/profile_${fileTime}.cpuprofile`;
          }
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Fallback: just get the latest file
  try {
    const latestFile = exec(
      `adb shell ls -t ${cacheDir}/*.cpuprofile 2>/dev/null | head -n1`,
    );
    return latestFile || null;
  } catch {
    return null;
  }
}

(async () => {
  console.log('🎯 React Native Hermes Profiler\n');

  // Ensure we're running from monorepo root
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(
      '❌ This script must be run from the monorepo root directory',
    );
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.name !== 'merkle-monorepo') {
      console.error(
        '❌ This script must be run from the monorepo root directory',
      );
      console.log('   Current directory:', process.cwd());
      process.exit(1);
    }
  } catch {
    console.error('❌ Could not verify monorepo root directory');
    process.exit(1);
  }

  // Create profiling directories if they don't exist
  const profilingDirs = ['profiling/profiles', 'profiling/symbols'];
  for (const dir of profilingDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Check if app is running
  try {
    const pid = exec(`adb shell pidof -s ${argv.appId}`);
    console.log(`✓ App is running (PID: ${pid})\n`);
  } catch {
    console.error(
      `❌ App ${argv.appId} is not running. Please start the app first.`,
    );
    process.exit(1);
  }

  // Handle source map - fetch from Metro
  let hasSourceMap = false;

  // Always try to fetch from Metro
  try {
    hasSourceMap = await fetchSourceMapFromMetro();
    if (hasSourceMap) {
      console.log('');
    }
  } catch (error) {
    console.warn('   Metro fetch failed:', error.message);
  }

  // Exit if no source map available
  if (!hasSourceMap && !fs.existsSync(argv.map)) {
    console.error(
      '❌ No source map available - Metro must be running on port 8081',
    );
    console.log(
      '   Start the app with: cd apps/farcaster-mobile && npx expo run:android --variant release',
    );
    process.exit(1);
  }

  const startTime = Date.now();

  // Enable profiling via system property
  console.log('▶︎ Enabling profiling...');
  try {
    exec(`adb shell setprop debug.farcaster.profiling true`);
    console.log('   ✓ Profiling enabled via system property');
  } catch (error) {
    console.error('   ❌ Failed to enable profiling property');
    console.error('   Make sure ADB has root access or try: adb root');
    process.exit(1);
  }

  console.log('▶︎ Starting profiler...');
  toggleProfiler();

  // Check if profiler started successfully
  execSync('sleep 1');
  const logCheck = exec(`adb logcat -d -s ProfilerService:* | tail -10`, {
    ignoreError: true,
  });
  if (logCheck.includes('Started Hermes profiling')) {
    console.log('   ✓ Profiler started successfully');
  } else {
    console.log(
      "   Note: Check adb logcat -s ProfilerService if profiling doesn't work as expected",
    );
  }

  console.log('\n📱 Profiling is ON - interact with your app now');
  console.log('   Press <Enter> when done to stop profiling...\n');

  await new Promise((r) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.once('data', () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      r(undefined);
    });
  });

  console.log('\n▶︎ Stopping profiler...');
  toggleProfiler();

  // Wait for and find the profile file - try external directory first
  const externalDir = `/storage/emulated/0/Android/data/${argv.appId}/files`;
  const cacheDir = `/data/user/0/${argv.appId}/cache`;

  let profilePath = await waitForLatestProfile(externalDir, startTime);
  if (!profilePath) {
    // Fallback to cache directory
    profilePath = await waitForLatestProfile(cacheDir, startTime);
  }

  if (!profilePath) {
    console.error(
      '❌ No profile file found. Make sure profiling is working correctly.',
    );
    console.error(
      '   Check adb logcat for errors: adb logcat | grep -E "HermesProfiler"',
    );
    process.exit(1);
  }

  console.log(`   Found profile: ${path.basename(profilePath)}`);

  // Pull the profile
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const localRaw = path.join(argv.out, `profile_${timestamp}.cpuprofile`);

  console.log('▶︎ Downloading profile from device...');
  adb(`pull ${profilePath} ${localRaw}`);

  console.log(`   Saved to: ${localRaw}`);

  // Transform if source map exists
  if (fs.existsSync(argv.map)) {
    console.log('▶︎ Symbolicating profile...');

    try {
      const chromeTrace = localRaw.replace(/\.cpuprofile$/, '.chrome.json');

      // Use the bundle name that works with our Metro setup
      const bundleNames = [
        'index.bundle', // This is what typically works
        'index.js', // Fallback option
      ];

      let events: DurationEvent[] | null = null;
      let successfulBundle: string | null = null;

      for (const bundleName of bundleNames) {
        try {
          console.log(`   Trying bundle name: ${bundleName}`);
          events = await transformer(localRaw, argv.map, bundleName);

          // Check if we got meaningful results (more than just root entries)
          const meaningfulEvents = events.filter((e) => e.name !== '[root]');

          if (meaningfulEvents.length > 0) {
            successfulBundle = bundleName;
            console.log(`   ✓ Success with bundle name: ${bundleName}`);
            break;
          } else {
            console.log(
              `   ${bundleName}: got ${events.length} events but all were [root]`,
            );
          }
        } catch (e) {
          console.log(`   ${bundleName}: failed - ${e.message}`);
        }
      }

      if (!events || events.filter((e) => e.name !== '[root]').length === 0) {
        throw new Error('No meaningful symbols found with any bundle name');
      }

      fs.writeFileSync(chromeTrace, JSON.stringify(events));

      console.log(`\n✅ Success! Symbolicated profile saved to:`);
      console.log(`   ${chromeTrace}`);
      console.log(`   Used bundle name: ${successfulBundle}`);
      console.log(
        `   Found ${events.filter((e) => e.name !== '[root]').length} symbolicated functions`,
      );
      console.log(`\n📊 To view:`);
      console.log(`   1. Open Chrome DevTools`);
      console.log(`   2. Go to Performance tab`);
      console.log(
        `   3. Click "Load profile" and select the .chrome.json file`,
      );
    } catch (error) {
      console.error('⚠️  Symbolication failed:', error.message);
      console.log(`\n✅ Raw profile saved to: ${localRaw}`);
      console.log(
        `   You can still open this in Chrome DevTools (without symbols)`,
      );
      console.log(`   The source map might not match the running app version`);
    }
  } else {
    console.log(`\n✅ Raw profile saved to: ${localRaw}`);
    console.log(`   Open in Chrome DevTools → Performance → Load profile`);
  }

  // Cleanup on device
  try {
    console.log('\n🧹 Cleaning up...');
    exec(`adb shell rm ${profilePath}`);
    // Disable profiling property
    exec(`adb shell setprop debug.farcaster.profiling false`);
    console.log('   ✓ Profiling disabled');
  } catch {
    // Ignore cleanup errors
  }

  console.log('\n🎉 Done!');

  // Check if speedscope is installed and offer to open the profile
  try {
    exec('which speedscope');
    console.log('\n🔍 Opening profile in speedscope...');
    const absoluteProfilePath = path.resolve(localRaw);
    execSync(`speedscope "${absoluteProfilePath}"`, { stdio: 'inherit' });
  } catch {
    console.log(
      '\n💡 Tip: Install speedscope for a better profiling experience:',
    );
    console.log('   pnpm add -g speedscope');
    console.log('   Then run: speedscope ' + path.resolve(localRaw));
  }
})();
