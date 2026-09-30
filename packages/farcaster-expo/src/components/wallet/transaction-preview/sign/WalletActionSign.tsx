import * as React from 'react';
import { Platform, View } from 'react-native';

import { useTheme, useWalletSurface } from '../../../../contexts';
import { ConnectionContext } from '../../../../types';
import { AutoDisplayingBottomSheetModal } from '../../../bottom-sheet';
import { WalletActionPreviewHeader } from '../WalletActionPreviewHeader';
import { WebWalletTransactionOverlay } from '../WebWalletTransactionOverlay';
import { WalletSignMessageContent } from './WalletSignMessageContent';

export function WalletActionSign({
  connectionContext,
  approve,
  reject,
  message,
}: {
  connectionContext: ConnectionContext;
  approve: () => void;
  reject: () => void;
  message: string;
}) {
  const t = useTheme();
  const modalRef = React.useRef<{ dismiss: () => void }>(null);
  const [status, setStatus] = React.useState<
    'pending' | 'approved' | 'rejected'
  >('pending');

  // Synchronous gate so rapid double-taps / a dismiss racing with an
  // approve/reject can't fire `approve` or `reject` more than once. Status
  // state drives the UI; this ref drives the invariant.
  const resolvedRef = React.useRef(false);

  const cancel = React.useCallback(() => {
    if (resolvedRef.current) {
      return;
    }
    resolvedRef.current = true;
    setStatus('rejected');
    reject();
  }, [reject]);

  const handleApprove = React.useCallback(() => {
    if (resolvedRef.current) {
      return;
    }
    resolvedRef.current = true;
    setStatus('approved');
    approve();
  }, [approve]);

  const { surface } = useWalletSurface();
  const content = (
    <View style={[t.flex, t.flexCol]}>
      <WalletActionPreviewHeader
        connectionContext={connectionContext}
        title="Signature Request"
      />
      <WalletSignMessageContent
        message={message}
        approve={handleApprove}
        cancel={cancel}
        status={status}
        surface={surface}
      />
    </View>
  );

  const onDismiss = React.useCallback(() => {
    if (resolvedRef.current) {
      return;
    }
    resolvedRef.current = true;
    reject();
  }, [reject]);

  if (surface === 'mini_app_modal') {
    return (
      <WebWalletTransactionOverlay cancel={cancel}>
        {content}
      </WebWalletTransactionOverlay>
    );
  }

  return (
    <AutoDisplayingBottomSheetModal
      ref={modalRef}
      name="WalletActionSign"
      onDismiss={onDismiss}
      handleComponent={Platform.OS === 'web' ? null : undefined}
      enableContentPanningGesture={Platform.OS !== 'web'}
    >
      {content}
    </AutoDisplayingBottomSheetModal>
  );
}
