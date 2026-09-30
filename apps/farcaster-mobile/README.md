# Farcaster Mobile

This is the React Native mobile application for Farcaster, built with Expo.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Running the App](#running-the-app)
- [Development Workflow](#development-workflow)
- [Testing Push Notifications](#testing-push-notifications)
- [Code Quality](#code-quality)
- [Deploying](#deploying)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or later recommended)
2. **pnpm** (v8 or later)
   ```shell
   npm install -g pnpm
   ```
3. **Homebrew** (macOS package manager)
4. **Watchman** (installed automatically by `brew bundle`, but can also install manually)
   ```shell
   brew install watchman
   ```
5. **Java Development Kit (JDK 17)** (required for Android builds)
   ```shell
   brew install --cask temurin@17
   ```
   **Note:** JDK 21 will cause build failures due to a Kotlin JVM target mismatch with `coinbase-wallet-mobile-sdk`. Use JDK 17 to avoid this.
6. **Xcode** (for iOS development)
   - Install from the Mac App Store
   - Open Xcode after installation to accept the license agreement
   - Run: `sudo xcode-select --switch /Applications/Xcode.app`
7. **CocoaPods** (iOS dependency manager)
   ```shell
   sudo gem install cocoapods -v 1.16.2
   ```
8. **Android Studio** (for Android development)
   ```shell
   brew install --cask android-studio
   ```
   See [Android SDK Setup](#step-3b-setup-android-sdk) below for full configuration.

## Initial Setup

Follow these steps to set up your development environment:

### Step 1: Install System Dependencies

From the **workspace root** directory (`/monorepo`):

```shell
brew bundle
```

This will install all required system dependencies defined in the Brewfile.

### Step 2: Install Node Dependencies

From the **workspace root** directory:

```shell
pnpm install
```

This installs all JavaScript dependencies for all packages and apps in the monorepo.

### Step 3a: Setup iOS Pods

Navigate to the iOS directory and install CocoaPods dependencies:

```shell
cd apps/farcaster-mobile/ios
pod install
cd ../../..
```

### Step 3b: Setup Android SDK

#### Set Environment Variables

Add the following to your `~/.zshrc` (or `~/.bashrc`):

```shell
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Then reload your shell:

```shell
source ~/.zshrc
```

#### Install SDK Components

Install the required Android SDK packages:

```shell
sdkmanager --sdk_root="$ANDROID_HOME" \
  "platform-tools" \
  "platforms;android-35" \
  "build-tools;35.0.0" \
  "emulator" \
  "system-images;android-35;google_apis;arm64-v8a" \
  "ndk;27.1.12297006" \
  "cmake;3.22.1" \
  "cmdline-tools;latest"
```

#### Accept Licenses

```shell
yes | sdkmanager --sdk_root="$ANDROID_HOME" --licenses
```

#### Create an Android Emulator

```shell
avdmanager create avd \
  --name "Pixel_7_API_35" \
  --package "system-images;android-35;google_apis;arm64-v8a" \
  --device "pixel_7"
```

You can verify the emulator was created with:

```shell
avdmanager list avd
```

### Step 4: Configure Environment

Obtain the `.env` file from the team (contains `EXPO_ACCESS_TOKEN` and other required secrets) and place it at `apps/farcaster-mobile/.env`.

If you want to point the app to a local backend server, update all instances of `forceProdApi` to `false` in the codebase.

### Step 5: Setup Package Watching (Optional but Recommended)

**Important:** If you plan to make changes to any dependent packages (e.g. `farcaster-client-data` or `farcaster-client-hooks`), run this from the **workspace root**:

```shell
pnpm watch
```

This will watch relevant packages for changes, then use [Yalc](https://github.com/wclr/yalc) to rebuild and publish changes to the mobile app in real-time.

## Running the App

**⚠️ IMPORTANT WARNING**: If you have Cloudflare WARP running, you must disable it before running the app. The IP subnets of AWS conflict with Expo's network, causing errors.

### Running on iOS Simulator

#### First-Time Build

1. Navigate to the mobile app directory:
   ```shell
   cd apps/farcaster-mobile
   ```

2. Start the iOS build process:
   ```shell
   pnpm ios
   ```

3. When prompted, select your desired iOS simulator from the list of targets (e.g., "iPhone 15 Pro").

4. Wait for the build to complete (this may take 5-10 minutes on the first build).

5. The app will automatically launch in the simulator when the build completes.

#### Subsequent Runs

Once the app is built and installed on the simulator:

1. Start the Metro bundler:
   ```shell
   pnpm start
   ```

2. The app will hot-reload with your changes.

**Note:** You only need to rebuild (`pnpm ios`) when:
- Native dependencies change
- You modify native code
- You update Expo SDK version
- iOS configuration changes (app.json, Info.plist, etc.)

### Running on Physical Device

#### One-Time Setup

1. **Configure Apple Developer Account:**
   - Follow [these instructions](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md) to connect your Apple developer account with Xcode
   - Open Xcode and navigate to Preferences > Accounts
   - Add your Apple ID
   - Download manual profiles if needed

2. **Provision Your Device:**
   - Open `apps/farcaster-mobile/ios/Farcaster.xcworkspace` in Xcode
   - Select your device from the device dropdown
   - Navigate to Signing & Capabilities
   - Ensure your team is selected under "Team"
   - Resolve any provisioning profile issues

#### Running the App

1. **Connect Your iPhone:**
   - Connect your iPhone to your Mac via USB
   - Unlock your iPhone
   - Trust the computer if prompted

2. **Build and Install:**
   ```shell
   cd apps/farcaster-mobile
   pnpm ios
   ```

3. **Select Your Device:**
   - When prompted, select your physical device from the list (it will show your iPhone name)
   - Press Enter to start building

4. **Wait for Build:**
   - The build process will take 5-10 minutes
   - The Expo development client will launch on your phone automatically

5. **Start Metro Server:**
   ```shell
   pnpm start
   ```

6. **Launch the App:**
   - A QR code will appear in your terminal
   - Scan the QR code with your iPhone camera
   - Tap "Open with Farcaster" to load the JavaScript bundle

#### Troubleshooting Physical Device Setup

- If you see provisioning errors, open `Farcaster.xcworkspace` in Xcode and manually configure signing
- Ensure your device is registered in your Apple Developer account
- You may need to enable "Developer Mode" on iOS 16+ (Settings > Privacy & Security > Developer Mode)

## Development Workflow

### Working with Local Changes

When developing features that span multiple packages:

1. **Start Package Watching** (from workspace root):
   ```shell
   pnpm watch
   ```

2. **Make Changes** to packages like:
   - `packages/farcaster-client-data`
   - `packages/farcaster-client-hooks`
   - `packages/farcaster-expo`

3. **Changes Auto-Reload** in the mobile app via Yalc + Metro bundler

### Running on Android

#### First-Time Setup

If you haven't already created an emulator, see [Step 3b: Setup Android SDK](#step-3b-setup-android-sdk).

#### Start the Emulator

```shell
emulator -avd Pixel_7_API_35 &
```

Wait for the emulator to fully boot (you can verify with `adb shell getprop sys.boot_completed` returning `1`).

#### First-Time Build

1. **Start package watching** (from workspace root, if developing against packages):
   ```shell
   pnpm watch
   ```

2. **Build and run the app:**
   ```shell
   cd apps/farcaster-mobile
   pnpm android
   ```

3. When prompted, select the emulator from the device list.

4. Wait for the build to complete (the first build takes 5-10 minutes as it downloads Gradle dependencies and compiles native code).

5. The app will automatically install and launch on the emulator.

#### Subsequent Runs

Once the app is built and installed on the emulator:

1. Start the Metro bundler:
   ```shell
   pnpm start
   ```

2. The app will hot-reload with your changes.

**Note:** You only need to rebuild (`pnpm android`) when:
- Native dependencies change
- You modify native code in `android/`
- You update Expo SDK version
- Android configuration changes (app.json, build.gradle, etc.)

### Common Development Commands

From `apps/farcaster-mobile/`:

- `pnpm start` - Start Metro bundler only
- `pnpm ios` - Build and run on iOS simulator/device
- `pnpm android` - Build and run on Android emulator/device
- `pnpm test` - Run tests
- `pnpm test-watch` - Run tests in watch mode
- `pnpm lint` - Lint the codebase
- `pnpm typecheck` - Type check TypeScript

## Testing Push Notifications

**Note:** Always ensure push notifications are enabled in your device/simulator settings (Settings > Farcaster > Notifications).

### Testing on iOS Simulator

The simulator can't receive real push notifications, but you can simulate them:

#### Method 1: Using Command Line

```shell
xcrun simctl push booted com.farcaster.mobile-client ./fixtures/notifications/fake-push-notif-payload.apns
```

#### Method 2: Drag and Drop

1. Locate an `.apns` file in `fixtures/notifications/`
2. Drag and drop it onto the running simulator

#### Creating Custom Test Notifications

See [this Notion doc](https://notion.so) for information on creating custom `.apns` files.

### Testing on Physical Device

Physical devices support real push notifications:

#### With Local Backend

1. Follow the "Push Notifications" section in the backend README
2. Configure your local backend to send notifications
3. Run the app in development mode

#### With Production Backend

1. Run the app in production mode (development and production use different APNs tokens)
2. Production notifications will be delivered to your device

## Code Quality

### Linting

Check for and fix common code problems:

```shell
pnpm lint        # Check for issues
pnpm lint:fix    # Automatically fix issues
```

Uses [ESLint](https://eslint.org/) with custom configuration.

### Formatting

Standardize code formatting:

```shell
pnpm format      # Format all files
```

Uses [Prettier](https://prettier.io/) with project configuration.

### Type Checking

Verify TypeScript types:

```shell
pnpm typecheck   # Run TypeScript compiler
```

### Running All Checks

From the workspace root:

```shell
pnpm check:all   # Runs typecheck, lint, and test for all packages
```

### VSCode Integration

For the best development experience, install these VSCode extensions:

1. **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)** - Inline linting
2. **[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)** - Code formatting
3. **[TypeScript Hero](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)** - Import management

#### Recommended VSCode Settings

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript", "typescript"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

This configuration will:
- Format code with Prettier on save
- Fix ESLint violations automatically on save
- Apply consistent formatting across all file types

## Deploying

### Understanding Release Types

There are two types of releases:

1. **Over-The-Air (OTA) Updates** - JavaScript-only changes, no App Store review needed
2. **Native Builds** - Changes to native code or dependencies, requires App Store submission

### Over-The-Air (OTA) Updates

Use OTA updates when you've made **JavaScript-only changes** with no modifications to:
- Native dependencies (new npm packages with native code)
- Native code in `ios/` or `android/` directories
- App configuration (app.json, Info.plist, etc.)
- Expo SDK version

#### ⚠️ Important Warning

**Never deploy an OTA update if there have been native changes.** This can crash the app for users. When in doubt, create a new native build.

See [this PR](https://github.com/merkle-manufactory/mobile/pull/625) for more information on OTA updates and release channels.

#### Deploying an OTA Update

##### For Production/TestFlight:

```shell
cd apps/farcaster-mobile
pnpm ota-tf
```

This starts an interactive wizard that will:
1. Ask you to confirm the update details
2. Build the JavaScript bundle
3. Publish to the appropriate release channel
4. Update Expo's OTA servers

##### For Internal Testing:

```shell
cd apps/farcaster-mobile
pnpm ota
```

#### OTA Best Practices

- Always test changes thoroughly before deploying OTA
- Use descriptive update messages
- Monitor error tracking after deployment
- Be prepared to roll back if issues arise

### Native Builds

Use native builds when you've made changes to:
- Native dependencies
- iOS or Android native code
- App configuration files
- Expo SDK version
- App icons, splash screens, or other assets

#### Build Types

**iOS Builds:**
```shell
cd apps/farcaster-mobile

# For internal testing
pnpm ios:internal

# For TestFlight/App Store
pnpm ios:production

# For local development (Simulator)
pnpm ios:simulator
pnpm ios:local
```

**Android Builds:**
```shell
cd apps/farcaster-mobile

# For internal testing
pnpm android:internal

# For Play Store
pnpm android:production
```

#### Complete Release Process

For the full release workflow, including version bumping, changelog management, and submission guidelines, see:

📚 [Client Release Processes](https://notion.so)

#### Build Configuration

Builds are configured using Expo Application Services (EAS):
- Configuration file: `eas.json`
- Build profiles: `development`, `preview`, `production`
- Credentials managed through EAS
## Android Splash Screen Configuration

### Known Issue

There's a caching bug with icon and splash screen generation. When updating these assets, use the following workaround.

### Updating Android Assets Safely

**⚠️ Warning:** Do NOT delete the `android` folder in the main project, as it contains necessary third-party integration changes.

#### Step-by-Step Process:

1. **Update Asset Files** (see list below)

2. **Create a Clean Copy:**
   ```shell
   cd ..
   cp -r farcaster-mobile farcaster-mobile-temp
   cd farcaster-mobile-temp
   ```

3. **Remove Android Folder in Copy:**
   ```shell
   rm -rf android
   ```

4. **Rebuild Android Workspace:**
   ```shell
   pnpm android
   ```
   This recreates the `android` folder with fresh assets.

5. **Copy Generated Assets:**
   ```shell
   cp -r android/app/src/main/res/* ../farcaster-mobile/android/app/src/main/res/
   ```

6. **Cleanup:**
   ```shell
   cd ..
   rm -rf farcaster-mobile-temp
   ```

### Configuration Reference

#### Settings (in app.json)

- `android.adaptiveIcon.foregroundImage` - Path to homescreen icon foreground
- `android.adaptiveIcon.backgroundColor` - Homescreen icon background color
- `android.splash.image` - Splash screen image path (shown after icon animation)
- `android.splash.backgroundColor` - Splash background color (should match image background)

#### Key Files

- `src/assets/images/icon-android-adaptive.png` - Homescreen icon foreground image
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` - Launch animation foreground

## Troubleshooting

### Common Build Errors

#### General Build Failures

If you encounter build errors, try these solutions in order:

**Solution 1: Clean Node Modules**
```shell
rm -rf node_modules
pnpm install
pnpm ios
```

**Solution 2: Clean iOS Pods**
```shell
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
pnpm ios
```

**Solution 3: Deep Clean**
```shell
# From workspace root
pnpm clean
pnpm install

# From mobile app
cd apps/farcaster-mobile
pnpm ios
```

### CocoaPods Issues

#### CocoaPods Installation Errors

If you encounter CocoaPods errors:

1. **Uninstall Current Version:**
   ```shell
   brew uninstall cocoapods
   ```

2. **Install Required Gems:**
   ```shell
   sudo gem install activesupport -v 6.1.7.10
   sudo gem install zeitwerk -v 2.6.18
   sudo gem install drb -v 2.0.6
   sudo gem install rexml -v 3.2.5
   ```
   
   **Note:** Uninstall newer versions of `rexml` if present:
   ```shell
   sudo gem uninstall rexml
   # Select the newer version when prompted
   ```

3. **Install CocoaPods:**
   ```shell
   sudo gem install cocoapods -v 1.16.2
   ```

4. **Verify Installation:**
   ```shell
   pod --version  # Should show 1.16.2
   ```

### Xcode Issues

#### "Xcode Not Found" Errors

If you see errors about Xcode not being installed (even though it is):

```shell
sudo xcode-select --switch /Applications/Xcode.app
```

Then verify:
```shell
xcode-select -p  # Should output: /Applications/Xcode.app/Contents/Developer
```

#### Xcode Command Line Tools

If you need to reinstall command line tools:

```shell
sudo rm -rf /Library/Developer/CommandLineTools
xcode-select --install
```

### Android Build Issues

#### Kotlin JVM Target Mismatch

If you see an error like:
```
Execution failed for task ':coinbase-wallet-mobile-sdk:compileDebugKotlin'.
> Inconsistent JVM-target compatibility detected for tasks 'compileDebugJavaWithJavac' (17) and 'compileDebugKotlin' (21).
```

This means your JDK version is too new. Install and use JDK 17:
```shell
brew install --cask temurin@17
```

Then add to your `~/.zshrc`:
```shell
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

#### Gradle Lock File Conflict

If you see:
```
Timeout waiting to lock build logic queue. It is currently in use by another Gradle instance.
```

Kill the stale Gradle process and remove the lock:
```shell
# Stop all Gradle daemons
cd apps/farcaster-mobile/android && ./gradlew --stop

# If that doesn't work, kill the process manually
kill <Owner PID from error message>
rm -f apps/farcaster-mobile/android/.gradle/noVersion/buildLogic.lock
```

#### ANDROID_HOME Not Set

If you see `SDK location not found`:
```shell
# Add to ~/.zshrc
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
source ~/.zshrc
```

#### Clean Android Build

```shell
cd apps/farcaster-mobile/android
./gradlew clean
cd ..
pnpm android
```

### Metro Bundler Issues

#### Port Already in Use

If Metro is already running or port 8081 is in use:

```shell
# Kill existing Metro processes
lsof -ti:8081 | xargs kill -9

# Or use the built-in reset
pnpm start --reset-cache
```

#### Cache Issues

Clear Metro bundler cache:

```shell
pnpm start -- --reset-cache
```

Or manually:
```shell
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

### Simulator Issues

#### Simulator Won't Launch

1. **Restart Simulator:**
   - Close all simulators
   - Open Xcode > Window > Devices and Simulators
   - Right-click the simulator > Delete
   - Create a new simulator

2. **Reset Simulator:**
   ```shell
   xcrun simctl shutdown all
   xcrun simctl erase all
   ```

#### App Won't Install on Simulator

```shell
# Uninstall the app
xcrun simctl uninstall booted com.farcaster.mobile-client

# Clean build
pnpm ios --reset-cache
```

### Physical Device Issues

#### "Could Not Launch" Error

1. Ensure device is unlocked
2. Trust the computer on your iPhone (Settings > General > Device Management)
3. Verify Developer Mode is enabled (iOS 16+):
   - Settings > Privacy & Security > Developer Mode

#### Signing Certificate Errors

1. Open `ios/Farcaster.xcworkspace` in Xcode
2. Select the Farcaster target
3. Go to Signing & Capabilities
4. Select your team
5. Click "Try Again" to generate certificates

### Network Issues

#### Can't Connect to Metro

If your device/simulator can't reach Metro:

1. **Disable Cloudflare WARP** (if installed)
2. **Check firewall settings** (allow port 8081)
3. **Verify network:**
   ```shell
   # Should show Metro running
   lsof -i :8081
   ```

### Still Having Issues?

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/expo) with your error
3. Ask in team Slack or consult the team
4. Try the "nuclear option":
   ```shell
   # From workspace root
   pnpm nuke
   pnpm install
   cd apps/farcaster-mobile
   pnpm ios
   ```
