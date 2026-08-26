import { requireNativeModule } from 'expo-modules-core';

type FarcasterAppLinkingModule = {
  openInstalledAppForUrl(url: string): Promise<boolean>;
};

let FarcasterAppLinking: FarcasterAppLinkingModule | null = null;

try {
  FarcasterAppLinking = requireNativeModule<FarcasterAppLinkingModule>(
    'FarcasterAppLinking',
  );
} catch {
  FarcasterAppLinking = null;
}

async function openInstalledAppForUrl(url: string): Promise<boolean> {
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }

  if (!FarcasterAppLinking) {
    return false;
  }

  try {
    return await FarcasterAppLinking.openInstalledAppForUrl(url);
  } catch {
    return false;
  }
}

export { openInstalledAppForUrl };
