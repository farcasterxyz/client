import { DdRum } from '@datadog/mobile-react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ToastProvider } from 'farcaster-expo';
import React, { useCallback, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { CollectibleCastByCastHash } from '~/components/CollectibleCast/CollectibleCast';
import { DismissibleSheet } from '~/components/DismissibleSheet';
import { toastRenderType } from '~/components/toasts';
import { LightboxProvider } from '~/contexts/LightboxProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { CommonStackParamList } from '~/types';

type CollectibleCastDisplayScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CollectibleCastDisplay'
>;

export function CollectibleCastDisplayScreen({
  route,
}: CollectibleCastDisplayScreenProps) {
  const goBack = useGoBack();
  const slideProgress = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const handleBack = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      goBack();
    });
  }, [goBack]);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      DdRum.addViewLoadingTime(true);
    });
  }, []);

  return (
    <LightboxProvider>
      <ToastProvider renderType={toastRenderType} offsetTop={22}>
        <BottomSheetModalProvider>
          <DismissibleSheet
            slideProgress={slideProgress}
            onDismiss={handleBack}
            scrollOffset={scrollOffset}
          >
            <CollectibleCastByCastHash
              castHash={route.params.castHash}
              username={route.params.username}
              scrollOffset={scrollOffset}
              slideProgress={slideProgress}
            />
          </DismissibleSheet>
        </BottomSheetModalProvider>
      </ToastProvider>
    </LightboxProvider>
  );
}
