import { Octicons } from '@expo/vector-icons';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import {
  ApiRemoteSiwfRequest,
  ApiRemoteSiwfRequestSourceFrame,
  ApiUser,
} from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useGetRemoteSiwfRequest,
  useRemoteSiwfRequest,
  useUpdateRemoteSiwfRequest,
} from 'farcaster-client-hooks';
import { useRootToast, WalletIcon } from 'farcaster-expo';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { BottomSheetContentContainer } from '~/components/BottomSheet';
import { ButtonV2 } from '~/components/ButtonV2';
import { FrameIconImage } from '~/components/FrameIconImage';
import { ModalPrompt } from '~/components/prompts/ModalPrompt';
import { Text2 } from '~/components/Text';
import { remoteSiwfRequestPrompt } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { trackError } from '~/utils/ErrorUtils';
import { logInDevOnly } from '~/utils/LogUtils';

export const TRANSACTION_TTL_MS = 90_000; // 1.5 minutes
export const BUTTON_ENABLE_DELAY_MS = 750;

export const RemoteSiwfRequestPrompt: React.FC = React.memo(() => {
  const { activePromptKey, hideGlobalPrompt, globalData } = useGlobalPrompts();

  const shouldPresent = useCallback(() => {
    return activePromptKey === remoteSiwfRequestPrompt;
  }, [activePromptKey]);

  return (
    <ModalPrompt
      name="remoteSiwfRequest"
      shouldPresent={shouldPresent}
      height={'60%'}
      enableDynamicSizing={true}
      storageKey={remoteSiwfRequestPrompt}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={true}
    >
      <Suspense>
        {globalData.remoteSiwfRequest && (
          <MaybeRemoteSiwfRequest token={globalData.remoteSiwfRequest.token} />
        )}
      </Suspense>
    </ModalPrompt>
  );
});

RemoteSiwfRequestPrompt.displayName = 'RemoteSiwfRequestPrompt';

function MaybeRemoteSiwfRequest({ token }: { token: string }) {
  const { hideGlobalPrompt, showGlobalPrompt } = useGlobalPrompts();
  const getRemoteSiwfRequest = useGetRemoteSiwfRequest();
  const { data } = useRemoteSiwfRequest(
    {
      token,
    },
    {
      refetchInterval: 500,
    },
  );

  useEffect(() => {
    if (!data.result.request) {
      getRemoteSiwfRequest({})
        .then((data) => {
          // check for newer request
          if (data.request?.token) {
            showGlobalPrompt({
              key: remoteSiwfRequestPrompt,
              globalPromptData: {
                remoteSiwfRequest: { token: data.request.token },
              },
            });
            return;
          }

          hideGlobalPrompt();
        })
        .catch(() => {
          hideGlobalPrompt();
        });
    }
  }, [
    data.result.request,
    getRemoteSiwfRequest,
    hideGlobalPrompt,
    showGlobalPrompt,
  ]);

  if (data.result.request) {
    return <RemoteSiwfRequest request={data.result.request} />;
  }

  return null;
}

function RemoteSiwfRequest({ request }: { request: ApiRemoteSiwfRequest }) {
  const { dismiss: dismissSheet } = useBottomSheetModal();
  const toast = useRootToast();
  const { account } = useWallet();
  const updateRequest = useUpdateRemoteSiwfRequest();
  const user = useCurrentUser_UNSAFE();

  const implicitlyReject = useRef(true);
  const [accepting, setAccepting] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const renderTime = useRef(Date.now());

  const reject = useCallback(async () => {
    logInDevOnly('Rejected SIWF request', request.token);
    void updateRequest({ token: request.token, error: 'rejected' });
    implicitlyReject.current = false;
  }, [request.token, updateRequest]);

  const cancel = useCallback(async () => {
    reject();
    dismissSheet();
  }, [dismissSheet, reject]);

  const cancelDueToTimeout = useCallback(async () => {
    toast.show('Transaction expired. Please try again.', {
      type: 'generic',
    });
    cancel();
  }, [cancel, toast]);

  // Auto-cancel SIWF request if it expires
  useEffect(() => {
    const timeout = setTimeout(() => {
      cancelDueToTimeout();
    }, TRANSACTION_TTL_MS);
    return () => clearTimeout(timeout);
  }, [cancelDueToTimeout]);

  const approve = useCallback(async () => {
    // Quick security check - if the transaction has expired, reject it
    const now = Date.now();
    const timeSinceRender = now - renderTime.current;
    if (timeSinceRender > TRANSACTION_TTL_MS) {
      cancelDueToTimeout();
      return;
    }

    if (request) {
      try {
        setAccepting(true);
        const signature = await account!.signMessage({
          message: request.message,
        });
        await updateRequest({ token: request.token, signature });
        implicitlyReject.current = false;
        dismissSheet();
        if (request.source.type === 'frame') {
          toast.show(
            `Signed into ${request.source.frame?.name ?? request.source.domain}`,
            {
              type: 'generic',
            },
          );
        } else if (request.source.type === 'wallet') {
          toast.show('Approved web access to your wallet', {
            type: 'generic',
          });
        }
      } catch (e) {
        trackError(e);
      } finally {
        setAccepting(false);
      }
    }
  }, [
    request,
    account,
    updateRequest,
    dismissSheet,
    toast,
    cancelDueToTimeout,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setButtonEnabled(true);
    }, BUTTON_ENABLE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (request?.error || request?.signature) {
      logInDevOnly('Request is no longer valid');
      implicitlyReject.current = false;
      dismissSheet();
    }
  }, [request, dismissSheet]);

  useEffect(() => {
    return () => {
      if (implicitlyReject.current) {
        logInDevOnly('Rejecting from dismiss');
        void reject();
      }
    };
    // Intentionally only want this to run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BottomSheetContentContainer>
      {request.source.type === 'frame' && (
        <RemoteSiwfRequestFrame
          source={request.source}
          user={user}
          cancel={cancel}
          approve={approve}
          accepting={accepting}
          buttonEnabled={buttonEnabled}
        />
      )}
      {request.source.type === 'wallet' && (
        <RemoteSiwfRequestWallet
          cancel={cancel}
          approve={approve}
          accepting={accepting}
          buttonEnabled={buttonEnabled}
        />
      )}
    </BottomSheetContentContainer>
  );
}

function RemoteSiwfRequestWallet({
  cancel,
  approve,
  accepting,
  buttonEnabled,
}: {
  cancel: () => void;
  approve: () => void;
  accepting: boolean;
  buttonEnabled: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={[t.itemsCenter, t.mB4, { gap: 10 }]}>
        <View
          style={[
            t.bgFaint,
            t.roundedFull,
            t.justifyCenter,
            t.itemsCenter,
            { width: 64, height: 64 },
          ]}
        >
          <WalletIcon size={32} color={t.colors.text.primary} />
        </View>
        <Text2 size="lg" weight="semibold" align="center">
          Use wallet on web
        </Text2>
        <Text2>Tap “Approve” to continue using your wallet on web.</Text2>
      </View>
      <View style={[t.mT4, t.flexRow, { gap: 10 }]}>
        <ButtonV2
          onPress={cancel}
          title="Cancel"
          width="flex1"
          variant="secondary"
          disabled={accepting}
        />
        <ButtonV2
          onPress={approve}
          title="Approve"
          width="flex1"
          disabled={!buttonEnabled || accepting}
        />
      </View>
    </View>
  );
}

function RemoteSiwfRequestFrame({
  source,
  user,
  cancel,
  approve,
  accepting,
  buttonEnabled,
}: {
  source: ApiRemoteSiwfRequestSourceFrame;
  user: ApiUser;
  cancel: () => void;
  approve: () => void;
  accepting: boolean;
  buttonEnabled: boolean;
}) {
  const t = useTheme();
  const requester = source.frame?.name ?? source.domain;
  return (
    <View style={{ gap: 12 }}>
      <View style={[t.itemsCenter, t.mB4, { gap: 10 }]}>
        {source.frame && (
          <>
            <FrameIconImage imageUrl={source.frame.iconUrl} size={56} />
          </>
        )}
        <View>
          <Text2 size="lg" weight="bold" align="center">
            {requester} wants you to
          </Text2>
          <Text2 size="lg" weight="bold" align="center">
            Sign in with Farcaster
          </Text2>
        </View>
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            { gap: 4, borderRadius: 36 },
            t.p1,
            t.borderDefault,
            t.borderHairline,
          ]}
        >
          <Avatar pfpUrl={user.pfp?.url} diameter={16} />
          <Text2 color="secondary" size="sm" weight="medium">
            {resolveUsernameShort(user)}
          </Text2>
        </View>
      </View>
      <Text2 color="tertiary" weight="semibold">
        {requester} will be able to:
      </Text2>
      <View
        style={[
          t.bgFaint,
          t.p2,
          t.roundedLg,
          t.flexRow,
          t.itemsCenter,
          { gap: 8 },
        ]}
      >
        <Octicons name="person" size={16} />
        <Text2 weight="medium">View your public profile</Text2>
      </View>
      <View style={[t.mT4, t.flexRow, { gap: 10 }]}>
        <ButtonV2
          onPress={cancel}
          title="Cancel"
          width="flex1"
          variant="secondary"
          disabled={accepting}
        />
        <ButtonV2
          onPress={approve}
          title="Continue"
          width="flex1"
          disabled={!buttonEnabled || accepting}
        />
      </View>
    </View>
  );
}
