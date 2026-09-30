import { ClientProcessedMedia } from 'farcaster-client-hooks';
import React from 'react';
import {
  MeasuredDimensions,
  SharedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { Lightbox } from '~/components/lightbox/Lightbox';

export type ActiveLightboxImage = ClientProcessedMedia & {
  rect: MeasuredDimensions | null;
  type?: 'image' | 'circle';
};

export type ActiveLightbox = {
  images: ActiveLightboxImage[];
  index: number;
};

const LightboxContext = React.createContext<{
  activeLightbox: ActiveLightbox | null;
  openLightbox: (lightbox: ActiveLightbox) => void;
  closeLightbox: () => void;
  activeLightboxRef: SharedValue<string | null>;
} | null>(null);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [activeLightbox, setActiveLightbox] =
    React.useState<ActiveLightbox | null>(null);
  const activeLightboxRef = useSharedValue<string | null>(null);

  const openLightbox = React.useCallback(
    (lightbox: ActiveLightbox) => {
      activeLightboxRef.set(lightbox.images[lightbox.index].original);
      setActiveLightbox((prev) => prev ?? lightbox);
    },
    [activeLightboxRef],
  );

  const closeLightbox = React.useCallback(() => {
    setActiveLightbox(null);
  }, []);

  const value = React.useMemo(
    () => ({
      activeLightbox,
      openLightbox,
      closeLightbox,
      activeLightboxRef,
    }),
    [activeLightbox, openLightbox, closeLightbox, activeLightboxRef],
  );

  return (
    <LightboxContext.Provider value={value}>
      {children}
      <Lightbox />
    </LightboxContext.Provider>
  );
}

export function useLightbox() {
  const context = React.useContext(LightboxContext);
  if (!context) {
    throw new Error('useLightbox must be used within a LightboxProvider');
  }
  return context;
}
