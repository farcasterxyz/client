import { SignIn, SignInOptions } from '@farcaster/miniapp-host';
import * as Dialog from '@radix-ui/react-dialog';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useNonSuspenseUserAppContext } from 'farcaster-client-hooks';
import React, { useCallback, useEffect } from 'react';

import { Image } from '~/components/images/Image';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useEmbeddedWalletSiwf } from '~/hooks/siwf/useEmbeddedWalletSiwf';
import { useRemoteSiwf } from '~/hooks/siwf/useRemoteSiwf';

import phone from './phone.png';
import phoneDark from './phoneDark.png';

const LocalSiwfSignIn: React.FC<{
  domain: string;
  name?: string;
  targetUrl: string;
  options: SignInOptions;
  onSignIn: (result: SignIn.SignInResult) => void;
}> = ({ domain, name, targetUrl, options, onSignIn }) => {
  const { trackEvent } = useAnalytics();

  const handleSignIn = useCallback(
    (result: SignIn.SignInResult) => {
      trackEvent(AnalyticsEvent.SignInWithAuthAddress, {
        domain: name ?? domain,
      });
      onSignIn(result);
    },
    [name, domain, trackEvent, onSignIn],
  );

  useEmbeddedWalletSiwf({
    domain,
    targetUrl,
    options,
    onSignIn: handleSignIn,
  });

  return null;
};

const RemoteSiwfSignIn: React.FC<{
  domain: string;
  targetUrl: string;
  options: SignInOptions;
  name?: string;
  onSignIn: (result: SignIn.SignInResult) => void;
  onDismiss: () => void;
  renderInPortal?: boolean;
}> = ({
  domain,
  targetUrl,
  options,
  name,
  onSignIn,
  onDismiss,
  renderInPortal = true,
}) => {
  const { trackEvent } = useAnalytics();

  const { request } = useRemoteSiwf({
    domain,
    targetUrl,
    options,
  });

  const handleSignIn = useCallback(
    (result: SignIn.SignInResult) => {
      trackEvent(AnalyticsEvent.SignInWithCustodyAddress, {
        domain: name ?? domain,
      });
      onSignIn(result);
    },
    [name, domain, trackEvent, onSignIn],
  );

  useEffect(() => {
    if (request) {
      if (request.error === 'rejected') {
        onDismiss();
        return;
      }

      if (request.signature) {
        handleSignIn({
          authMethod: 'custody',
          message: request.message,
          signature: request.signature,
        });
      }
    }
  }, [onDismiss, handleSignIn, request]);

  if (renderInPortal) {
    return (
      <Dialog.Root
        defaultOpen
        onOpenChange={(open) => {
          if (!open) {
            onDismiss();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-10 animate-overlay-show bg-overlay" />
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-content-show">
            <SignInDialogInner name={name ?? domain} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 top-[60px] animate-overlay-show bg-black/30 dark:bg-white/30"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      />

      <div
        className="absolute inset-x-4 bottom-4 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <SignInDialogInner name={name ?? domain} />
      </div>
    </>
  );
};

interface SignInDialogProps {
  domain: string;
  targetUrl: string;
  options: SignInOptions;
  name?: string;
  onDismiss: () => void;
  onSignIn: (result: SignIn.SignInResult) => void;
  renderInPortal?: boolean;
}

export const SignInDialog: React.FC<SignInDialogProps> = ({
  domain,
  targetUrl,
  options,
  name,
  onDismiss,
  onSignIn,
  renderInPortal = true,
}) => {
  const isGeoRestricted = useWalletGeoRestricted();
  const { data: userAppContext } = useNonSuspenseUserAppContext({
    refetchOnMount: true,
  });

  const useLocalSiwf =
    !isGeoRestricted &&
    userAppContext?.authAddressState === 'added' &&
    options.acceptAuthAddress;

  if (useLocalSiwf) {
    return (
      <LocalSiwfSignIn
        domain={domain}
        name={name}
        targetUrl={targetUrl}
        options={options}
        onSignIn={onSignIn}
      />
    );
  }

  return (
    <RemoteSiwfSignIn
      domain={domain}
      targetUrl={targetUrl}
      options={options}
      name={name}
      onSignIn={onSignIn}
      onDismiss={onDismiss}
      renderInPortal={renderInPortal}
    />
  );
};

interface SignInDialogInnerProps {
  name: string;
}

const SignInDialogInner: React.FC<SignInDialogInnerProps> = ({ name }) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent(AnalyticsEvent.SignInDialogOpened, { domain: name });
  }, [name, trackEvent]);

  return (
    <div className="mx-auto w-full max-w-[424px] animate-frame-action-content-show space-y-3 rounded-xl px-4 py-8 bg-app border-default">
      <div className="relative mx-auto flex size-[144px] items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[63px] w-[163px] rounded-lg bg-faint" />
        </div>
        <Image
          src={phone}
          alt="phone"
          className="z-0 block h-[98px] w-[53px] dark:hidden"
        />
        <Image
          src={phoneDark}
          alt="phone"
          className="z-0 hidden h-[98px] w-[53px] dark:block"
        />
      </div>

      <h3 className="text-xl font-semibold">
        Open Farcaster on your phone to
        <br />
        Sign in with Farcaster
      </h3>
      <div className="text-muted">
        Tap "continue" in your Farcaster mobile app to continue using {name}.
      </div>
    </div>
  );
};
