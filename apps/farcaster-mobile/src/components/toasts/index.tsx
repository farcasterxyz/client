import {
  ProfileTokenToast,
  SuccessToast,
  TransactionToast,
} from 'farcaster-expo';
import * as React from 'react';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import { CastActionErrorToast } from './CastActionErrorToast';
import { CastActionToast } from './CastActionToast';
import { CastBookmarkedToast } from './CastBookmarkedToast';
import { CastBookmarkRemovedToast } from './CastBookmarkRemovedToast';
import { GenericToast } from './GenericToast';
import { ShareSheetCopyToClipboardToast } from './ShareSheetCopyToClipboardToast';
import { ShareSheetDirectCastsToast } from './ShareSheetDirectCastsToast';

export const toastRenderType = {
  castBookmarked: (toast: ToastProps) => <CastBookmarkedToast {...toast} />,
  castBookmarkRemoved: () => <CastBookmarkRemovedToast />,
  castAction: (toast: ToastProps) => <CastActionToast {...toast} />,
  castActionError: (toast: ToastProps) => <CastActionErrorToast {...toast} />,
  shareSheetCopyToClipboard: () => <ShareSheetCopyToClipboardToast />,
  shareSheetDirectCasts: (toast: ToastProps) => (
    <ShareSheetDirectCastsToast {...toast} />
  ),
  generic: (toast: ToastProps) => <GenericToast {...toast} />,
  profileToken: (toast: ToastProps) => <ProfileTokenToast {...toast} />,
  transaction: (toast: ToastProps) => <TransactionToast {...toast} />,
  success: (toast: ToastProps) => <SuccessToast {...toast} />,
};
