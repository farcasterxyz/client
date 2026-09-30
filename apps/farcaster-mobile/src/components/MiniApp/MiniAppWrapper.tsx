import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useDefaultToastProviderProps } from 'farcaster-expo';
import * as React from 'react';
import { ToastProvider } from 'react-native-toast-notifications';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { ConnectedWalletProvider } from '~/contexts/ConnectWalletProvider';

// We render this component outside of the MiniApp BottomSheet so that the
// BottomSheetModalProvider can measure their container properly
function MiniAppWrapper({ children }: { children: React.ReactNode }) {
  const defaultToastProviderProps = useDefaultToastProviderProps();
  return (
    <ToastProvider {...defaultToastProviderProps} offsetBottom={0}>
      <React.Suspense
        fallback={<FullScreenLoadingIndicator debugName="MiniAppWrapper" />}
      >
        {/* this BottomSheetModalProvider is so that transactions from
            mini apps can be rendered inside ConnectedWalletProvider */}
        <BottomSheetModalProvider>
          <ConnectedWalletProvider>
            {/* this BottomSheetModalProvider is so that the kebab menu
                BottomSheet can have context from ConnectedWalletProvider */}
            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
          </ConnectedWalletProvider>
        </BottomSheetModalProvider>
      </React.Suspense>
    </ToastProvider>
  );
}

export { MiniAppWrapper };
