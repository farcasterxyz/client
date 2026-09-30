import { openBrowserAsync } from 'expo-web-browser';
import { ApiUser, ApiWalletAssetMetadata } from 'farcaster-client-data';
import React, { createContext, useCallback, useContext } from 'react';
import { Linking, Platform } from 'react-native';

import { useSharedNavigationContext } from '../../../../contexts';
import { useHaptics } from '../../../../hooks';
import { LaunchFrameParams } from '../../../../types';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  logErrorInDevOnly,
} from '../../../../utils';

const ActivityBottomSheetContext = createContext<{
  isActive: boolean;
  onUserPress?: (user: ApiUser) => void;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onDismiss?: () => void;
  openExplorerUrl?: (url: string) => void;
  handleTokenPress?: (token?: ApiWalletAssetMetadata) => void;
}>({ isActive: false });

export function useActivityBottomSheetContext() {
  const context = useContext(ActivityBottomSheetContext);
  if (context.isActive !== true) {
    logErrorInDevOnly(
      '⚠️ ActivityBottomSheetContext is not active. This is a bug.',
    );
  }
  return context;
}

export function ActivityBottomSheetProvider({
  children,
  onUserPress,
  onLaunchFrame,
  onDismiss,
}: {
  children: React.ReactNode;
  onUserPress?: (user: ApiUser) => void;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onDismiss?: () => void;
}) {
  const openExplorerUrl = useCallback(
    (url: string) => {
      if (Platform.OS === 'web') {
        Linking.openURL(url);
      } else {
        openBrowserAsync(url);
      }
      onDismiss?.();
    },
    [onDismiss],
  );
  const newOnUserPress = useCallback(
    (user: ApiUser) => {
      onUserPress?.(user);
      onDismiss?.();
    },
    [onUserPress, onDismiss],
  );

  const newOnLaunchFrame = useCallback(
    (frame: LaunchFrameParams) => {
      onLaunchFrame?.(frame);
      onDismiss?.();
    },
    [onLaunchFrame, onDismiss],
  );

  const newOnDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const { push } = useSharedNavigationContext();
  const { triggerImpactAsync } = useHaptics();

  const handleTokenPress = useCallback(
    (token?: ApiWalletAssetMetadata) => {
      if (!token) {
        return;
      }

      triggerImpactAsync();
      push({
        path: 'Token',
        params: {
          ca: token.ca || EIP7528_NATIVE_ASSET_ADDRESS,
          chain: token.chain || 'base',
          via: 'wallet_activity',
        },
      });
      onDismiss?.();
    },
    [push, triggerImpactAsync, onDismiss],
  );

  return (
    <ActivityBottomSheetContext.Provider
      value={{
        isActive: true,
        onUserPress: newOnUserPress,
        onLaunchFrame: newOnLaunchFrame,
        onDismiss: newOnDismiss,
        openExplorerUrl,
        handleTokenPress,
      }}
    >
      {children}
    </ActivityBottomSheetContext.Provider>
  );
}
