import { SkTypefaceFontProvider } from '@shopify/react-native-skia';
import * as React from 'react';

type SkiaFontContextType = {
  fontManager: SkTypefaceFontProvider | null;
};

const SkiaFontContext = React.createContext<SkiaFontContextType>({
  fontManager: null,
});

export const useSkiaFont = () => React.useContext(SkiaFontContext);

type SkiaFontProviderProps = {
  fontManager: SkTypefaceFontProvider | null;
  children: React.ReactNode;
};

export function SkiaFontProvider({
  fontManager,
  children,
}: SkiaFontProviderProps) {
  const context = React.useMemo(() => ({ fontManager }), [fontManager]);
  return (
    <SkiaFontContext.Provider value={context}>
      {children}
    </SkiaFontContext.Provider>
  );
}
