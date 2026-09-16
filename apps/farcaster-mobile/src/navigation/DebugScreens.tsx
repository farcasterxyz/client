import React from 'react';

// I can't figure out how to get these types to work after upgrading Typescript. Feel free to add if you can.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DebugScreens = (Stack: any) => [
  <Stack.Screen
    key="DebugMenu"
    name="DebugMenu"
    getComponent={() =>
      require('~/screens/Debug/DebugMenuScreen').DebugMenuScreen
    }
    options={{ headerTitle: 'Debug Menu' }}
  />,
  <Stack.Screen
    key="DebugBenchmarks"
    name="DebugBenchmarks"
    getComponent={() =>
      require('~/screens/Debug/DebugBenchmarksScreen').DebugBenchmarksScreen
    }
    options={{ headerTitle: 'Debug Benchmarks' }}
  />,
  <Stack.Screen
    key="DebugCryptography"
    name="DebugCryptography"
    getComponent={() =>
      require('~/screens/Debug/DebugCryptographyScreen').DebugCryptographyScreen
    }
    options={{ headerTitle: 'Debug Cryptography' }}
  />,
  <Stack.Screen
    key="DebugStorage"
    name="DebugStorage"
    getComponent={() =>
      require('~/screens/Debug/DebugStorageScreen').DebugStorageScreen
    }
    options={{ headerTitle: 'Debug Storage' }}
  />,
  <Stack.Screen
    key="DebugNewOnboarding"
    name="DebugNewOnboarding"
    getComponent={() =>
      require('~/screens/Debug/DebugNewOnboardingScreen')
        .DebugNewOnboardingScreen
    }
    options={{ headerTitle: 'Debug Onboarding' }}
  />,
  <Stack.Screen
    key="DebugErrors"
    name="DebugErrors"
    getComponent={() =>
      require('~/screens/Debug/DebugErrorsScreen').DebugErrorsScreen
    }
    options={{ headerTitle: 'Debug Errors' }}
  />,
  <Stack.Screen
    key="DebugFeed"
    name="DebugFeed"
    getComponent={() =>
      require('~/screens/Debug/DebugFeedScreen').DebugFeedScreen
    }
    options={{ headerTitle: 'Debug Feed' }}
  />,
  <Stack.Screen
    key="DebugLogs"
    name="DebugLogs"
    getComponent={() =>
      require('~/screens/Debug/DebugLogsScreen').DebugLogsScreen
    }
    options={{ headerTitle: 'Debug Logs' }}
  />,
  <Stack.Screen
    key="DebugInAppBrowserLauncher"
    name="DebugInAppBrowserLauncher"
    getComponent={() =>
      require('~/screens/Debug/DebugInAppBrowserLauncherScreen')
        .DebugInAppBrowserLauncherScreen
    }
    options={{ headerTitle: 'Debug In-App Browser' }}
  />,
  <Stack.Screen
    key="DebugInAppPurchases"
    name="DebugInAppPurchases"
    getComponent={() =>
      require('~/screens/Debug/DebugInAppPurchasesScreen')
        .DebugInAppPurchasesScreen
    }
    options={{ headerTitle: 'Debug In-app Purchases' }}
  />,
  <Stack.Screen
    key="DebugImages"
    name="DebugImages"
    getComponent={() =>
      require('~/screens/Debug/DebugImagesScreen').DebugImagesScreen
    }
    options={{ headerTitle: 'Debug Images' }}
  />,
  <Stack.Screen
    key="DebugNavigateTo"
    name="DebugNavigateTo"
    getComponent={() =>
      require('~/screens/Debug/DebugNavigateToScreen').DebugNavigateToScreen
    }
    options={{ headerTitle: 'Debug Navigate To' }}
  />,
  <Stack.Screen
    key="DebugNavigationHistory"
    name="DebugNavigationHistory"
    getComponent={() =>
      require('~/screens/Debug/DebugNavigationHistoryScreen')
        .DebugNavigationHistoryScreen
    }
    options={{ headerTitle: 'Debug Navigation' }}
  />,
  <Stack.Screen
    key="DebugRelease"
    name="DebugRelease"
    getComponent={() =>
      require('~/screens/Debug/DebugReleaseScreen').DebugReleaseScreen
    }
    options={{ headerTitle: 'Debug Release' }}
  />,
  <Stack.Screen
    key="DebugAppAttest"
    name="DebugAppAttest"
    getComponent={() =>
      require('~/screens/Debug/DebugAppAttestScreen').DebugAppAttestScreen
    }
    options={{ headerTitle: 'Debug App Attest' }}
  />,
  <Stack.Screen
    key="DebugStorefront"
    name="DebugStorefront"
    getComponent={() =>
      require('~/screens/Debug/DebugStorefrontScreen').DebugStorefrontScreen
    }
    options={{ headerTitle: 'Debug Storefront' }}
  />,
  <Stack.Screen
    key="DebugTimeoutHistory"
    name="DebugTimeoutHistory"
    getComponent={() =>
      require('~/screens/Debug/DebugTimeoutHistoryScreen')
        .DebugTimeoutHistoryScreen
    }
    options={{ headerTitle: 'Debug Timeout History' }}
  />,
  <Stack.Screen
    key="DebugPushNotifications"
    name="DebugPushNotifications"
    getComponent={() =>
      require('~/screens/Debug/DebugPushNotificationsScreen')
        .DebugPushNotificationsScreen
    }
    options={{ headerTitle: 'Debug Push Notifications' }}
  />,
  <Stack.Screen
    key="DebugSyncChannel"
    name="DebugSyncChannel"
    getComponent={() =>
      require('~/screens/Debug/DebugSyncChannelScreen').DebugSyncChannelScreen
    }
    options={{ headerTitle: 'Debug Sync Channel' }}
  />,
  <Stack.Screen
    key="DebugVerificationRemoval"
    name="DebugVerificationRemoval"
    getComponent={() =>
      require('~/screens/Debug/DebugVerificationRemovalScreen')
        .DebugVerificationRemovalScreen
    }
    options={{ headerTitle: 'Debug verifications' }}
  />,
  <Stack.Screen
    key="DebugConnectWallet"
    name="DebugConnectWallet"
    getComponent={() =>
      require('~/screens/Debug/DebugConnectWalletScreen')
        .DebugConnectWalletScreen
    }
    options={{ headerTitle: 'Debug Connect Wallet' }}
  />,
  <Stack.Screen
    key="DebugCamera"
    name="DebugCamera"
    getComponent={() =>
      require('~/screens/Debug/DebugCameraScreen').DebugCameraScreen
    }
    options={{ headerTitle: 'Debug Camera' }}
  />,
  <Stack.Screen
    key="DebugUserQuality"
    name="DebugUserQuality"
    getComponent={() =>
      require('~/screens/Debug/DebugUserQualityScreen').DebugUserQualityScreen
    }
  />,
  <Stack.Screen
    key="DebugAdminTools"
    name="DebugAdminTools"
    getComponent={() =>
      require('~/screens/Debug/DebugAdminToolsScreen').DebugAdminToolsScreen
    }
    options={{ headerTitle: 'Debug Admin Tools' }}
  />,
  <Stack.Screen
    key="DebugEmbeddedWallet"
    name="DebugEmbeddedWallet"
    getComponent={() =>
      require('~/screens/Debug/DebugEmbeddedWalletScreen')
        .DebugEmbeddedWalletScreen
    }
    options={{ headerTitle: 'Debug Embedded Wallet' }}
  />,
  <Stack.Screen
    key="DebugSecureMode"
    name="DebugSecureMode"
    getComponent={() =>
      require('~/screens/Debug/DebugSecureModeScreen').DebugSecureModeScreen
    }
    options={{ headerTitle: 'Debug Advanced Protection' }}
  />,
  <Stack.Screen
    key="DebugTrendingFollowRecommendation"
    name="DebugTrendingFollowRecommendation"
    getComponent={() =>
      require('~/screens/Debug/DebugTrendingFollowRecommendationScreen')
        .DebugTrendingFollowRecommendationScreen
    }
    options={{ headerTitle: 'Test Trending Follow Recommendation' }}
  />,
  <Stack.Screen
    key="DebugNuxTasks"
    name="DebugNuxTasks"
    getComponent={() =>
      require('~/screens/Debug/DebugNuxTasksScreen').DebugNuxTasksScreen
    }
    options={{ headerTitle: 'Debug NUX Tasks' }}
  />,
  <Stack.Screen
    key="DebugCollectibleCasts"
    name="DebugCollectibleCasts"
    getComponent={() =>
      require('~/screens/Debug/DebugCollectibleCastsScreen')
        .DebugCollectibleCastsScreen
    }
    options={{ headerTitle: 'Debug Collectible Casts' }}
  />,
];

export { DebugScreens };
