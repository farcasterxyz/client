import { SignManifest } from '@farcaster/miniapp-core';
import * as Dialog from '@radix-ui/react-dialog';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiJsonFarcasterSignature } from 'farcaster-client-data';
import {
  SharedSignManifestProvider,
  useSignManifest,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { useCallback } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';

type SignManifestProviderProps = {
  children: React.ReactNode;
  url?: string;
};

export const WebSpecificSignManifestProvider: React.FC<
  SignManifestProviderProps
> = ({ children, url }) => {
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const { trackEvent } = useTrackEvent();

  // Web-specific signer function that uses embedded wallet bridge
  const signManifestFn = useCallback(
    async (domain: string): Promise<ApiJsonFarcasterSignature> => {
      if (!embeddedWalletBridge) {
        throw new SignManifest.GenericError('Wallet bridge not available');
      }
      return await embeddedWalletBridge.silentlySignManifest({ domain });
    },
    [embeddedWalletBridge],
  );

  // Web-specific bottom sheet function that renders Dialog UI
  const bottomSheetFn = useCallback(
    ({
      onOpen,
      onConfirm,
      domain,
      hostDomain,
    }: {
      onOpen: () => void;
      onConfirm: () => void;
      domain: string;
      hostDomain: string;
    }) => (
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open) {
            onOpen();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-10 animate-overlay-show bg-overlay" />
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-content-show">
            <div className="mx-auto w-full max-w-[424px] animate-frame-action-content-show rounded-xl border p-6 pb-4 bg-app border-default">
              <div className="flex w-full flex-col space-y-4">
                <h3 className="text-center text-xl font-semibold">
                  Security verification
                </h3>
                <div className="text-center text-secondary">
                  Mini app "{hostDomain}" is requesting to sign a domain
                  manifest for:
                </div>
                <div className="px-3 py-1.5 text-center bg-surface-secondary text-brand">
                  {domain}
                </div>
                <div className="text-center text-secondary">
                  This creates a cryptographic signature proving your ownership
                  of this domain for Farcaster integration.
                </div>
              </div>
              <div className="mt-6 flex w-full flex-row space-x-2">
                <DefaultButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  className="h-[40px] w-[180px]"
                  variant="inverted"
                >
                  Reject
                </DefaultButton>
                <DefaultButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm();
                  }}
                  className="h-[40px] w-[180px]"
                  variant="normal"
                >
                  Approve
                </DefaultButton>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    ),
    [],
  );

  const handleSignManifestRequest = useCallback(
    (params: { domain: string; hostDomain: string }) => {
      trackEvent(AnalyticsEvent.SignManifestAction, {
        domain: params.domain,
        hostDomain: params.hostDomain,
      });
    },
    [trackEvent],
  );

  return (
    <SharedSignManifestProvider
      url={url}
      signManifestFn={signManifestFn}
      bottomSheetFn={bottomSheetFn}
      onSignManifestRequest={handleSignManifestRequest}
    >
      {children}
    </SharedSignManifestProvider>
  );
};

// Keep the old name as an alias for backward compatibility
export const SignManifestProvider = WebSpecificSignManifestProvider;

// Re-export shared hook for backward compatibility
export { useSignManifest };
