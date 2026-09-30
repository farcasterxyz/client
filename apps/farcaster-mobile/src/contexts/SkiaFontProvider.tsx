import { useFonts } from '@shopify/react-native-skia';
import { SkiaFontProvider as BaseSkiaFontProvider } from 'farcaster-expo';
import * as React from 'react';

type SkiaFontProviderProps = {
  children: React.ReactNode;
};

function SkiaFontProvider({ children }: SkiaFontProviderProps) {
  const skiaFontManager = useFonts({
    Inter: [
      require('~/assets/fonts/Inter-Light.ttf'),
      require('~/assets/fonts/Inter-Regular.ttf'),
      require('~/assets/fonts/Inter-Medium.ttf'),
      require('~/assets/fonts/Inter-SemiBold.ttf'),
      require('~/assets/fonts/Inter-Bold.ttf'),
    ],
  });

  return (
    <BaseSkiaFontProvider fontManager={skiaFontManager}>
      {children}
    </BaseSkiaFontProvider>
  );
}

export { SkiaFontProvider };
