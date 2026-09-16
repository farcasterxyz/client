import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type StorefrontInfo = {
  countryCode: string;
  identifier: string;
  simCountryCodes: string[];
};

type FarcasterStorefrontModule = {
  getStorefront(): Promise<StorefrontInfo | null>;
};

const Storefront =
  Platform.OS === 'ios'
    ? requireNativeModule<FarcasterStorefrontModule>('FarcasterStorefront')
    : null;

export async function getStorefront(): Promise<StorefrontInfo | null> {
  if (!Storefront) {
    return null;
  }

  const result = await Storefront.getStorefront();
  if (!result) {
    return null;
  }

  return result;
}
