import { join, normalize } from 'path';

const absoluteWorkspaceRoot = normalize(`${__dirname}/..`);

const relativeAppsRoot = 'apps';
const relativePackagesRoot = 'packages';

const absoluteAppsRoot = join(absoluteWorkspaceRoot, relativeAppsRoot);
const absolutePackagesRoot = join(absoluteWorkspaceRoot, relativePackagesRoot);

const clientDataPackageName = 'farcaster-client-data';
const relativeClientDataRoot = join(
  relativePackagesRoot,
  clientDataPackageName,
);
const absoluteClientDataRoot = join(
  absoluteWorkspaceRoot,
  relativeClientDataRoot,
);

const clientHooksPackageName = 'farcaster-client-hooks';
const relativeClientHooksRoot = join(
  relativePackagesRoot,
  clientHooksPackageName,
);
const absoluteClientHooksRoot = join(
  absoluteWorkspaceRoot,
  relativeClientHooksRoot,
);

const farcasterCryptographyPackageName = 'farcaster-cryptography';
const relativeFarcasterCryptographyRoot = join(
  relativePackagesRoot,
  farcasterCryptographyPackageName,
);
const absoluteFarcasterCryptographyRoot = join(
  absoluteWorkspaceRoot,
  relativeFarcasterCryptographyRoot,
);

const farcasterCryptographyReactNativePackageName =
  'farcaster-cryptography-react-native';
const relativeFarcasterCryptographyReactNativeRoot = join(
  relativePackagesRoot,
  farcasterCryptographyReactNativePackageName,
);
const absoluteFarcasterCryptographyReactNativeRoot = join(
  absoluteWorkspaceRoot,
  relativeFarcasterCryptographyReactNativeRoot,
);

const walletPackageName = 'farcaster-wallet';
const relativeWalletRoot = join(relativeAppsRoot, walletPackageName);
const absoluteWalletRoot = join(absoluteWorkspaceRoot, relativeWalletRoot);

const farcasterExpoPackageName = 'farcaster-expo';
const relativeFarcasterExpoRoot = join(
  relativePackagesRoot,
  farcasterExpoPackageName,
);
const absoluteFarcasterExpoRoot = join(
  absoluteWorkspaceRoot,
  relativeFarcasterExpoRoot,
);

const mobileAppName = 'farcaster-mobile';
const relativeMobileRoot = join(relativeAppsRoot, mobileAppName);
const absoluteMobileRoot = join(absoluteWorkspaceRoot, relativeMobileRoot);

export {
  absoluteAppsRoot,
  absoluteClientDataRoot,
  absoluteClientHooksRoot,
  absoluteFarcasterCryptographyReactNativeRoot,
  absoluteFarcasterCryptographyRoot,
  absoluteFarcasterExpoRoot,
  absoluteMobileRoot,
  absolutePackagesRoot,
  absoluteWalletRoot,
  absoluteWorkspaceRoot,
  clientDataPackageName,
  clientHooksPackageName,
  farcasterCryptographyPackageName,
  farcasterCryptographyReactNativePackageName,
  farcasterExpoPackageName,
  relativeClientDataRoot,
  relativeClientHooksRoot,
  relativeFarcasterCryptographyReactNativeRoot,
  relativeFarcasterCryptographyRoot,
  walletPackageName,
};
