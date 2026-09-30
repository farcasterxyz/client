import { Octicons } from '@expo/vector-icons';
import { BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import {
  resolveUsername,
  useAlterPlaintextDirectCastConversationCategory,
  useChangeMemberInPlaintextDirectCastGroup,
  useChangeNotificationsInPlaintextDirectCastConversation,
  useCreateFollow,
  useDirectCastConversation,
  useGloballyCachedUser,
  useManuallyMarkConversationUnread,
  useMarkConversationRead,
  usePinDirectCastConversation,
  useTrackEvent,
  useUnpinDirectCastConversation,
  useUnseen,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, {
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';
import { useToast } from 'react-native-toast-notifications';

import {
  BottomSheetContentContainer,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { Button } from '~/components/Button';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { CastAvatar } from '~/components/casts/CastAvatar';
import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { Heading, Text2 } from '~/components/Text';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { trackError } from '~/utils/ErrorUtils';

import { useAnalytics } from './AnalyticsProvider';
import { MuteUserProvider, useMuteUser } from './MuteUserProvider';
import { useTheme } from './ThemeProvider';

const UnmuteIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18.626 15.166C18.3022 15.4244 6.37669 2.99403 6.11836 2.67024C5.86002 2.34646 5.91308 1.87456 6.23686 1.61622C6.2538 1.60271 6.27081 1.58926 6.2879 1.5759C7.54645 0.591226 9.21083 0 11.0001 0C14.6816 0 18 2.56545 18 6V10.5389C18 11.1805 18.19 11.8078 18.5459 12.3417L19.8741 14.334C20.1039 14.6786 20.0107 15.1443 19.6661 15.374C19.3214 15.6038 18.8558 15.5107 18.626 15.166Z"
        fill={t.colors.text.primary}
      />
      <Path
        d="M0.21967 0.21967C0.512563 -0.0732233 0.987437 -0.0732233 1.28033 0.21967L21.7803 20.7197C22.0732 21.0126 22.0732 21.4874 21.7803 21.7803C21.4874 22.0732 21.0126 22.0732 20.7197 21.7803L16.9393 18H14.5H7.5H2.51759C1.67945 18 1 17.3206 1 16.4824C1 16.1828 1.08869 15.8899 1.25488 15.6406L3.45416 12.3417C3.81008 11.8078 4 11.1805 4 10.5389V6C4 5.70608 4.02504 5.41688 4.07334 5.134L0.21967 1.28033C-0.0732233 0.987437 -0.0732233 0.512563 0.21967 0.21967Z"
        fill={t.colors.text.primary}
      />
      <Path
        d="M12.0001 22.5C10.4146 22.5 9.07529 21.4457 8.64502 20H15.3551C14.9249 21.4457 13.5856 22.5 12.0001 22.5Z"
        fill={t.colors.text.primary}
      />
    </Svg>
  );
});

const PinIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.0699 17.3335L13.0615 22.2993C13.0615 22.731 12.7116 23.0196 12.2799 23.0196C11.8482 23.0196 11.4983 22.731 11.4983 22.2993L11.5066 17.3335L5.95335 17.3335C4.56275 17.3335 3.68375 15.8396 4.35908 14.624L6.67927 10.6669C6.69146 10.4598 6.7304 10.1807 6.77649 9.85034C6.93835 8.69029 7.18841 6.8981 6.67778 5.37062L5.94395 3.70281C5.4136 2.49746 6.29641 1.14453 7.61328 1.14453H16.9466C18.2634 1.14453 19.1463 2.49746 18.6159 3.70281L17.8821 5.37061C17.4657 6.86113 17.7254 8.60369 17.8985 9.765C17.9533 10.1327 17.9994 10.4422 18.0126 10.6669L20.2174 14.624C20.8928 15.8396 20.0138 17.3335 18.6232 17.3335L13.0699 17.3335ZM7.97325 11.4256L5.66537 15.3617C5.55489 15.5758 5.70999 15.8335 5.95335 15.8335L10.9987 15.8335V15.8305H14.9987V15.8335L18.6232 15.8335C18.8699 15.8335 19.0259 15.5686 18.9064 15.3529L16.7023 11.397C16.5924 11.1998 16.5285 10.9803 16.5152 10.755C16.5064 10.6054 16.471 10.3632 16.4083 9.94212C16.3507 9.55549 16.2795 9.07311 16.2283 8.55062C16.1279 7.52622 16.0885 6.21602 16.4374 4.96702C16.4565 4.89857 16.4805 4.83156 16.5091 4.76651L17.2429 3.0987C17.3371 2.88471 17.1804 2.64453 16.9466 2.64453L7.61328 2.64453C7.37949 2.64453 7.22277 2.88472 7.31692 3.0987L8.05076 4.76651C8.06926 4.80857 8.08583 4.85146 8.1004 4.89505C8.52252 6.15777 8.52121 7.48381 8.44064 8.52051C8.39955 9.04926 8.33458 9.53567 8.28025 9.92724L8.26495 10.0374C8.21493 10.3972 8.18511 10.6117 8.17669 10.755C8.16278 10.9914 8.09306 11.2212 7.97325 11.4256Z"
        fill={t.colors.text.primary}
      />
    </Svg>
  );
});

const MuteIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 0.75C8.13439 0.75 4.65 3.36318 4.65 6.86163V11.485C4.65 12.1385 4.45058 12.7775 4.07687 13.3213L1.76762 16.6816C1.59312 16.9355 1.5 17.2339 1.5 17.5391C1.5 18.3928 2.21342 19.0849 3.09347 19.0849H8.325C8.325 21.0538 9.97035 22.65 12 22.65C14.0296 22.65 15.675 21.0538 15.675 19.0849H20.9065C21.7866 19.0849 22.5 18.3928 22.5 17.5391C22.5 17.2339 22.4069 16.9355 22.2324 16.6816L19.9231 13.3213C19.5494 12.7775 19.35 12.1385 19.35 11.485V6.86163C19.35 3.36318 15.8656 0.75 12 0.75ZM6.225 6.86163C6.225 4.4532 8.72667 2.27791 12 2.27791C15.2733 2.27791 17.775 4.4532 17.775 6.86163V11.485C17.775 12.4402 18.0665 13.374 18.6126 14.1688L20.9219 17.5291C20.9239 17.5321 20.925 17.5355 20.925 17.5391C20.925 17.5429 20.9239 17.5458 20.9239 17.5458C20.9239 17.5458 20.9218 17.5496 20.9196 17.5517C20.9173 17.5539 20.9135 17.5559 20.9135 17.5559C20.9135 17.5559 20.9105 17.557 20.9065 17.557H3.09347C3.08947 17.557 3.08652 17.5559 3.08652 17.5559C3.08652 17.5559 3.08265 17.5539 3.08041 17.5517C3.07817 17.5496 3.07613 17.5458 3.07613 17.5458C3.07613 17.5458 3.075 17.5429 3.075 17.5391C3.075 17.5355 3.07608 17.5321 3.0781 17.5291L5.38735 14.1688C5.93354 13.374 6.225 12.4402 6.225 11.485V6.86163ZM14.1 19.0849H9.9C9.9 20.21 10.8402 21.1221 12 21.1221C13.1598 21.1221 14.1 20.21 14.1 19.0849Z"
        fill={t.colors.text.primary}
      />
    </Svg>
  );
});

const UnpinIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.03033 0.96967C1.73744 0.676777 1.26256 0.676777 0.96967 0.96967C0.676777 1.26256 0.676777 1.73744 0.96967 2.03033L6.95267 8.01333C6.75683 10.3242 5.55794 12.5832 4.36104 14.6245C3.6857 15.8401 4.5647 17.334 5.9553 17.334L11.5086 17.334L11.5003 22.2998C11.5003 22.7315 11.8502 23.0201 12.2819 23.0201C12.7135 23.0201 13.0635 22.7315 13.0635 22.2998L13.0718 17.334L16.2733 17.334L21.9697 23.0303C22.2626 23.3232 22.7374 23.3232 23.0303 23.0303C23.3232 22.7374 23.3232 22.2626 23.0303 21.9697L2.03033 0.96967ZM20.2194 14.6245C20.6656 15.4277 20.4333 16.3523 19.8232 16.8873L5.79288 2.85698C5.8498 1.94167 6.60472 1.14502 7.61523 1.14502L16.9485 1.14502C18.2654 1.14502 19.1482 2.49795 18.6179 3.70329L17.884 5.3711C17.8121 5.62845 17.7604 5.89331 17.7249 6.1614C17.3334 9.11705 18.7682 12.02 20.2194 14.6245Z"
        fill={t.colors.text.primary}
      />
    </Svg>
  );
});

const MarkAsUnreadIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.5 12C2.5 9.48044 3.50089 7.06408 5.28249 5.28249C7.06408 3.50089 9.48044 2.5 12 2.5C14.5196 2.5 16.9359 3.50089 18.7175 5.28249C20.4991 7.06408 21.5 9.48044 21.5 12C21.5 14.5196 20.4991 16.9359 18.7175 18.7175C16.9359 20.4991 14.5196 21.5 12 21.5C9.48044 21.5 7.06408 20.4991 5.28249 18.7175C3.50089 16.9359 2.5 14.5196 2.5 12ZM12 1C5.925 1 1 5.925 1 12C1 18.075 5.925 23 12 23C18.075 23 23 18.075 23 12C23 5.925 18.075 1 12 1ZM12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14Z"
        fill={t.colors.text.primary}
      />
    </Svg>
  );
});

const MarkAsReadIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.4812 8.75545C17.4846 8.94975 17.4125 9.13779 17.28 9.27997L10.78 15.78C10.6394 15.9204 10.4487 15.9993 10.25 15.9993C10.0512 15.9993 9.86062 15.9204 9.72 15.78L6.72 12.78C6.58752 12.6378 6.5154 12.4497 6.51882 12.2554C6.52225 12.0611 6.60096 11.8758 6.73838 11.7383C6.87579 11.6009 7.06118 11.5222 7.25548 11.5188C7.44978 11.5154 7.63782 11.5875 7.78 11.72L10.25 14.19L16.22 8.21997C16.3622 8.08749 16.5502 8.01537 16.7445 8.01879C16.9388 8.02222 17.1242 8.10093 17.2616 8.23835C17.399 8.37576 17.4777 8.56115 17.4812 8.75545Z"
        fill={t.colors.text.primary}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12C1 5.925 5.925 1 12 1C18.075 1 23 5.925 23 12C23 18.075 18.075 23 12 23C5.925 23 1 18.075 1 12ZM5.28249 5.28249C3.50089 7.06408 2.5 9.48044 2.5 12C2.5 14.5196 3.50089 16.9359 5.28249 18.7175C7.06408 20.4991 9.48044 21.5 12 21.5C14.5196 21.5 16.9359 20.4991 18.7175 18.7175C20.4991 16.9359 21.5 14.5196 21.5 12C21.5 9.48044 20.4991 7.06408 18.7175 5.28249C16.9359 3.50089 14.5196 2.5 12 2.5C9.48044 2.5 7.06408 3.50089 5.28249 5.28249Z"
        fill={t.colors.text.primary}
      />
    </Svg>
  );
});

type ManageDirectCastConversationParams = {
  conversation?: ApiDirectCastConversationInfoV3;
  conversationId?: string;
};

export type ManageDirectCastConversationContextValue = {
  manageConversation: (params: ManageDirectCastConversationParams) => void;
  deleteConversation: (
    params: ManageDirectCastConversationParams,
  ) => Promise<{ deleted: boolean }>;
};

const ManageDirectCastConversationContext =
  React.createContext<ManageDirectCastConversationContextValue>({
    manageConversation: () => {
      throw new Error(
        'Must be called in ManageDirectCastConversationContext provider',
      );
    },
    deleteConversation: async () => {
      throw new Error(
        'Must be called in ManageDirectCastConversationContext provider',
      );
    },
  });

type ManageDirectCastConversationProviderProps = {
  children: React.ReactNode;
};

const ManageDirectCastConversationProvider: React.FC<ManageDirectCastConversationProviderProps> =
  React.memo(({ children }) => {
    const isSignedIn = useIsSignedIn();

    if (!isSignedIn) {
      return <>{children}</>;
    }

    return (
      <ManageDirectCastConversationProviderContent>
        {children}
      </ManageDirectCastConversationProviderContent>
    );
  });

function useConversation(params: ManageDirectCastConversationParams | null) {
  const conversationId = params?.conversationId || '';
  const { data: conversation } = useDirectCastConversation({
    conversationId: conversationId,
  });

  return useMemo(() => {
    if (params?.conversation) {
      return params.conversation;
    }
    return conversation;
  }, [params?.conversation, conversation]);
}

function ManageDirectCastConversationProviderContent({
  children,
}: {
  children: ReactNode;
}) {
  const [params, setParams] =
    useState<ManageDirectCastConversationParams | null>(null);

  const { dismissAll } = useBottomSheetModal();
  const modalRef = useBottomSheetModalRef();
  const deleteModalRef = useBottomSheetModalRef();
  const deleteResolveRef =
    useRef<(value: { deleted: boolean }) => void>(undefined);
  const leaveModalRef = useBottomSheetModalRef();

  const conversation = useConversation(params);

  const manageConversation = useCallback(
    async (params: ManageDirectCastConversationParams) => {
      setParams(params);
      modalRef.current?.present();
    },
    [modalRef],
  );

  const deleteConversation = useCallback(
    async (params: ManageDirectCastConversationParams) => {
      setParams(params);
      deleteModalRef.current?.present();
      return new Promise<{ deleted: boolean }>((resolve) => {
        deleteResolveRef.current = resolve;
      });
    },
    [deleteModalRef],
  );

  const handleDismissDelete = () => {
    if (deleteResolveRef.current) {
      deleteResolveRef.current({ deleted: false });
      deleteResolveRef.current = undefined;
    }
  };

  const promptToDelete = useCallback(async () => {
    deleteModalRef.current?.present();
    return new Promise<{ deleted: boolean }>((resolve) => {
      deleteResolveRef.current = resolve;
    });
  }, [deleteModalRef]);

  const promptToLeave = useCallback(async () => {
    leaveModalRef.current?.present();
  }, [leaveModalRef]);

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const { trackEvent } = useAnalytics();
  const alterPlaintextDirectCastConversationCategory =
    useAlterPlaintextDirectCastConversationCategory();

  const archive = useCallback(async () => {
    if (!conversation) {
      return;
    }

    trackEvent(AnalyticsEvent.ArchiveDirectCastsGroup, {
      participant_count: conversation.participants.length,
    });

    try {
      modalRef.current?.dismiss();

      await alterPlaintextDirectCastConversationCategory({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        fromCategory: conversation.viewerContext.category,
        toCategory: 'archived',
      });
    } catch (e) {
      trackError(e);
    }
  }, [
    alterPlaintextDirectCastConversationCategory,
    trackEvent,
    modalRef,
    conversation,
    currentUserFid,
  ]);

  const unarchive = useCallback(async () => {
    if (!conversation) {
      return;
    }

    trackEvent(AnalyticsEvent.UnarchiveDirectCastsGroup, {
      participant_count: conversation.participants.length,
    });

    try {
      modalRef.current?.dismiss();

      await alterPlaintextDirectCastConversationCategory({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        fromCategory: conversation.viewerContext.category,
        toCategory: 'default',
      });
    } catch (e) {
      trackError(e);
    }
  }, [
    alterPlaintextDirectCastConversationCategory,
    trackEvent,
    modalRef,
    conversation,
    currentUserFid,
  ]);

  const changeNotificationsInDirectCastConversation =
    useChangeNotificationsInPlaintextDirectCastConversation();

  const markConversationUnread = useManuallyMarkConversationUnread();

  const markConversationRead = useMarkConversationRead();

  const { incrementInboxCount, decreaseInboxCount } = useUnseen();

  const snooze = useCallback(async () => {
    if (!conversation) {
      return;
    }

    try {
      trackEvent(AnalyticsEvent.MuteDirectCastsGroup, {
        participant_count: conversation.participants.length,
      });

      modalRef.current?.dismiss();

      await changeNotificationsInDirectCastConversation({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        muted: true,
      });
    } catch (e) {
      trackError(e);
    }
  }, [
    changeNotificationsInDirectCastConversation,
    conversation,
    currentUserFid,
    trackEvent,
    modalRef,
  ]);

  const endSnooze = React.useCallback(async () => {
    if (!conversation) {
      return;
    }

    try {
      modalRef.current?.dismiss();

      await changeNotificationsInDirectCastConversation({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
        muted: false,
      });
    } catch (e) {
      trackError(e);
    }
  }, [
    changeNotificationsInDirectCastConversation,
    conversation,
    currentUserFid,
    modalRef,
  ]);

  const pinConversation = usePinDirectCastConversation();
  const unpinConversation = useUnpinDirectCastConversation();

  const pin = useCallback(async () => {
    if (!conversation) {
      return;
    }

    trackEvent(AnalyticsEvent.PinConversation, {
      participant_count: conversation.participants.length,
    });

    try {
      modalRef.current?.dismiss();

      await pinConversation({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
      });
    } catch (e) {
      trackError(e);
    }
  }, [modalRef, conversation, pinConversation, trackEvent, currentUserFid]);

  const unpin = React.useCallback(async () => {
    if (!conversation) {
      return;
    }

    trackEvent(AnalyticsEvent.UnpinConversation, {
      participant_count: conversation.participants.length,
    });

    try {
      modalRef.current?.dismiss();

      await unpinConversation({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
      });
    } catch (e) {
      trackError(e);
    }
  }, [modalRef, conversation, trackEvent, unpinConversation, currentUserFid]);

  const markUnread = useCallback(async () => {
    if (!conversation) {
      return;
    }

    try {
      trackEvent(AnalyticsEvent.MarkConversationAsUnread, {
        participant_count: conversation.participants.length,
      });

      modalRef.current?.dismiss();

      markConversationUnread({
        fid: currentUserFid,
        conversationId: conversation.conversationId,
      });

      incrementInboxCount();
    } catch (e) {
      trackError(e);
    }
  }, [
    incrementInboxCount,
    markConversationUnread,
    modalRef,
    conversation,
    trackEvent,
    currentUserFid,
  ]);

  const markRead = useCallback(async () => {
    if (!conversation) {
      return;
    }

    try {
      modalRef.current?.dismiss();

      markConversationRead({
        conversationId: conversation.conversationId,
        fid: currentUserFid,
      });

      if (!conversation.viewerContext.muted) {
        decreaseInboxCount();
      }
    } catch (e) {
      trackError(e);
    }
  }, [
    currentUserFid,
    decreaseInboxCount,
    markConversationRead,
    modalRef,
    conversation,
  ]);

  const contextValue = useMemo(
    () => ({
      deleteConversation,
      manageConversation,
    }),
    [deleteConversation, manageConversation],
  );

  return (
    <ManageDirectCastConversationContext.Provider value={contextValue}>
      {children}

      <BottomSheetModal
        name="manageDirectCastConversation"
        ref={modalRef}
        handleComponent={null}
        enableDynamicSizing
      >
        {params && conversation && (
          <ManageDirectCastConversationBottomSheet
            key={conversation.conversationId}
            conversation={conversation}
            {...params}
            dismiss={() => {
              setParams(null);
              modalRef.current?.dismiss();
            }}
            promptToDelete={promptToDelete}
            promptToLeave={promptToLeave}
            snooze={snooze}
            endSnooze={endSnooze}
            pin={pin}
            unpin={unpin}
            archive={archive}
            markUnread={markUnread}
            markRead={markRead}
            unarchive={unarchive}
          />
        )}
      </BottomSheetModal>
      <BottomSheetModal
        name="deleteDirectCastConversation"
        ref={deleteModalRef}
        handleComponent={null}
        onDismiss={handleDismissDelete}
        enableDynamicSizing
      >
        {params && conversation && (
          <DeleteConversationBottomSheet
            onCancel={() => {
              deleteModalRef.current?.dismiss();
            }}
            onDelete={() => {
              if (deleteResolveRef.current) {
                deleteResolveRef.current({ deleted: true });
                deleteResolveRef.current = undefined;
              }
              dismissAll();
            }}
            conversation={conversation}
          />
        )}
      </BottomSheetModal>
      <BottomSheetModal
        name="confirmLeaveConversation"
        ref={leaveModalRef}
        handleComponent={null}
        enableDynamicSizing
      >
        {params && conversation && (
          <LeaveConversationBottomSheet
            onCancel={() => {
              leaveModalRef.current?.dismiss();
            }}
            onLeave={dismissAll}
            conversation={conversation}
          />
        )}
      </BottomSheetModal>
    </ManageDirectCastConversationContext.Provider>
  );
}

function DeleteConversationBottomSheet({
  conversation,
  onCancel,
  onDelete,
}: {
  conversation: ApiDirectCastConversationInfoV3;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const user = useCurrentUser_UNSAFE();
  const t = useTheme();
  const toast = useToast();
  const { trackEvent } = useAnalytics();

  const alterPlaintextDirectCastConversationCategory =
    useAlterPlaintextDirectCastConversationCategory();

  const deleteConversation = useCallback(async () => {
    if (!conversation) {
      return;
    }

    try {
      setSubmitting(true);

      await alterPlaintextDirectCastConversationCategory({
        fid: user.fid,
        conversationId: conversation.conversationId,
        fromCategory: conversation.viewerContext.category,
        toCategory: 'deleted',
      });

      trackEvent(AnalyticsEvent.DeleteDirectCastConversation, {
        participant_count: conversation.participants.length,
      });

      onDelete();
    } catch (e) {
      trackError(e);
      toast.show('Unable to delete conversation', { type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }, [
    alterPlaintextDirectCastConversationCategory,
    conversation,
    user.fid,
    onDelete,
    toast,
    trackEvent,
  ]);

  return (
    <BottomSheetView>
      <View style={[t.p4, { minHeight: 200, paddingBottom: bottom }]}>
        <View style={[t.pY2]}>
          <Heading>Delete conversation?</Heading>
        </View>
        <View style={[t.pY2]}>
          <Text2>
            This will be removed from your inbox. The other person will still
            see it in theirs.
          </Text2>
        </View>
        <View
          style={[
            t.pY1,
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.wFull,
            { gap: 12 },
          ]}
        >
          <View style={[t.flex1]}>
            <Button
              onPress={onCancel}
              variant="muted"
              title="Cancel"
              disabled={submitting}
              style={[t.wFull]}
            />
          </View>
          <View style={[t.flex1]}>
            <Button
              onPress={deleteConversation}
              variant="dangerSecondary"
              title="Delete"
              disabled={submitting}
              style={[t.wFull]}
            />
          </View>
        </View>
      </View>
    </BottomSheetView>
  );
}

function LeaveConversationBottomSheet({
  conversation,
  onCancel,
  onLeave,
}: {
  conversation: ApiDirectCastConversationInfoV3;
  onCancel: () => void;
  onLeave: () => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const user = useCurrentUser_UNSAFE();
  const t = useTheme();
  const toast = useToast();
  const { trackEvent } = useAnalytics();

  const changeMembershipInPlaintextDirectCastGroup =
    useChangeMemberInPlaintextDirectCastGroup();

  const leaveConversation = useCallback(async () => {
    if (!conversation) {
      return;
    }

    try {
      setSubmitting(true);

      await changeMembershipInPlaintextDirectCastGroup({
        senderContext: {
          fid: user.fid,
          displayName: user.displayName,
          username: user.username,
        },
        conversationId: conversation.conversationId,
        action: 'remove',
        participants: [user],
      });

      trackEvent(AnalyticsEvent.LeaveDirectCastsGroup, {
        participant_count: conversation.participants.length,
      });

      onLeave();
    } catch (e) {
      trackError(e);
      toast.show('Failed to leave conversation', { type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }, [
    changeMembershipInPlaintextDirectCastGroup,
    conversation,
    user,
    onLeave,
    toast,
    trackEvent,
  ]);

  if (!conversation) {
    return null;
  }

  return (
    <BottomSheetView>
      <View style={[t.p4, { minHeight: 200, paddingBottom: bottom }]}>
        <View style={[t.pY2]}>
          <Heading>Leave conversation?</Heading>
        </View>
        <View style={[t.pY2]}>
          <Text2>
            Are you sure you want to leave the group "
            <Text2 weight="bold">{conversation.name ?? 'this group'}</Text2>"?
          </Text2>
        </View>
        <View
          style={[
            t.pY1,
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.wFull,
            { gap: 12 },
          ]}
        >
          <View style={[t.flex1]}>
            <Button
              onPress={onCancel}
              variant="muted"
              title="Cancel"
              disabled={submitting}
              style={[t.wFull]}
            />
          </View>
          <View style={[t.flex1]}>
            <Button
              onPress={leaveConversation}
              variant="dangerSecondary"
              title="Leave"
              disabled={submitting}
              style={[t.wFull]}
            />
          </View>
        </View>
      </View>
    </BottomSheetView>
  );
}

function ManageDirectCastConversationBottomSheet(params: {
  conversation: ApiDirectCastConversationInfoV3;
  promptToDelete: () => Promise<{ deleted: boolean }>;
  promptToLeave: () => void;
  endSnooze: () => Promise<void>;
  snooze: () => Promise<void>;
  pin: () => Promise<void>;
  unpin: () => Promise<void>;
  archive: () => Promise<void>;
  unarchive: () => Promise<void>;
  markUnread: () => Promise<void>;
  markRead: () => Promise<void>;
  dismiss: () => void;
}) {
  return (
    <MuteUserProvider>
      <BottomSheetContentContainer>
        <View style={[{ gap: 16 }]}>
          {params.conversation.isGroup ? (
            <ManageGroup {...params} />
          ) : (
            <ManageOneOnOne {...params} />
          )}
        </View>
      </BottomSheetContentContainer>
    </MuteUserProvider>
  );
}

function ManageGroup({
  conversation,
  promptToLeave,
  endSnooze,
  snooze,
  unarchive,
  archive,
  markUnread,
  markRead,
  pin,
  unpin,
}: {
  conversation: ApiDirectCastConversationInfoV3;
  dismiss: () => void;
  promptToLeave: () => void;
  endSnooze: () => Promise<void>;
  snooze: () => Promise<void>;
  archive: () => Promise<void>;
  unarchive: () => Promise<void>;
  markUnread: () => Promise<void>;
  markRead: () => Promise<void>;
  pin: () => Promise<void>;
  unpin: () => Promise<void>;
}) {
  const user = useCurrentUser_UNSAFE();
  const t = useTheme();

  const pinButtonOptions = conversation.viewerContext.pinned
    ? {
        label: 'Unpin',
        icon: () => (
          <View style={[t.relative]}>
            <UnpinIcon />
          </View>
        ),
        onPress: unpin,
      }
    : {
        label: 'Pin',
        icon: () => <PinIcon />,
        onPress: pin,
      };

  const snoozeButtonOptions = conversation.viewerContext.muted
    ? {
        label: 'Unmute chat',
        icon: () => <UnmuteIcon />,
        onPress: endSnooze,
      }
    : {
        label: 'Mute chat',
        icon: () => <MuteIcon />,
        onPress: snooze,
      };

  const markAsUnreadButtonOptions = {
    label: 'Mark as unread',
    icon: () => <MarkAsUnreadIcon />,
    onPress: markUnread,
  };
  const markAsReadButtonOptions = {
    label: 'Mark as read',
    icon: () => <MarkAsReadIcon />,
    onPress: markRead,
  };

  const archiveButtonOptions: ButtonGroupOption =
    conversation.viewerContext.category === 'archived'
      ? {
          label: 'Move to inbox',
          icon: ({ size }) => (
            <Octicons name="inbox" size={size} color={t.colors.text.primary} />
          ),
          onPress: unarchive,
        }
      : {
          label: 'Archive',
          icon: ({ size }) => (
            <Octicons
              name="archive"
              size={size}
              color={t.colors.text.primary}
            />
          ),
          onPress: archive,
        };

  const options: ButtonGroupOption[] = [pinButtonOptions, snoozeButtonOptions];

  if (
    !conversation.viewerContext.manuallyMarkedUnread &&
    conversation.viewerContext.unreadCount === 0
  ) {
    options.push(markAsUnreadButtonOptions);
  }

  if (
    conversation.viewerContext.unreadCount !== 0 ||
    conversation.viewerContext.manuallyMarkedUnread
  ) {
    options.push(markAsReadButtonOptions);
  }

  options.push(archiveButtonOptions);

  if (conversation.adminFids.indexOf(user.fid) === -1) {
    options.push({
      label: 'Leave',
      icon: ({ size }) => (
        <Octicons name="sign-out" size={size} color={t.colors.text.danger} />
      ),
      destructive: true,
      onPress: promptToLeave,
    });
  }

  return (
    <>
      <View
        style={[
          t.pY2,
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.justifyCenter,
          { gap: 12 },
        ]}
      >
        <GroupConversationImage
          diameter={80}
          imageURL={conversation.photoUrl}
          roundedSize="full"
        />
        <Heading style={[{ fontSize: 24 }]}>{conversation.name}</Heading>
      </View>
      <ButtonGroup options={options} />
    </>
  );
}

function ManageOneOnOne({
  conversation,
  dismiss,
  promptToDelete,
}: {
  conversation: ApiDirectCastConversationInfoV3;
  dismiss: () => void;
  promptToDelete: () => Promise<{ deleted: boolean }>;
}) {
  const currentUser = useCurrentUser_UNSAFE();
  const counterPartyLocal = conversation.viewerContext.counterParty;

  if (!counterPartyLocal) {
    throw new Error('Unexpected undefined conversation counter party');
  }

  const counterParty = useGloballyCachedUser({
    fallback: counterPartyLocal,
  });

  const pushToUserProfile = usePushToUserProfile();
  const t = useTheme();
  const createFollow = useCreateFollow();
  const toast = useRootToast();
  const { trackEvent } = useAnalytics();
  const { trackEvent: eventingTrackEvent } = useTrackEvent();
  const { muteUser } = useMuteUser();
  const alterPlaintextDirectCastConversationCategory =
    useAlterPlaintextDirectCastConversationCategory();
  const markConversationUnread = useManuallyMarkConversationUnread();
  const markConversationRead = useMarkConversationRead();
  const { incrementInboxCount, decreaseInboxCount } = useUnseen();

  const follow = async () => {
    try {
      eventingTrackEvent(AnalyticsEvent.AccountFollow, {
        target: counterParty.fid,
        on: 'direct-cast-conversation',
      });

      dismiss();
      await createFollow({ followee: counterParty, follower: currentUser });
      toast.show(
        `You are now following ${resolveUsername({ fid: counterParty.fid, username: counterParty.username })}`,
        { type: 'success' },
      );
    } catch (e) {
      trackError(e);
      toast.show('Unable to follow user', { type: 'danger' });
    }
  };

  const viewProfile = () => {
    pushToUserProfile({ fid: counterParty.fid });
  };

  const archive = useCallback(async () => {
    trackEvent(AnalyticsEvent.ArchiveDirectCastsGroup, {
      participant_count: conversation.participants.length,
    });

    try {
      dismiss();

      await alterPlaintextDirectCastConversationCategory({
        fid: currentUser.fid,
        conversationId: conversation.conversationId,
        fromCategory: conversation.viewerContext.category,
        toCategory: 'archived',
      });
    } catch (e) {
      toast.show('Failed to archive conversation', { type: 'danger' });
      trackError(e);
    }
  }, [
    alterPlaintextDirectCastConversationCategory,
    conversation,
    currentUser.fid,
    trackEvent,
    dismiss,
    toast,
  ]);

  const unarchive = useCallback(async () => {
    trackEvent(AnalyticsEvent.UnarchiveDirectCastsGroup, {
      participant_count: conversation.participants.length,
    });

    try {
      dismiss();

      await alterPlaintextDirectCastConversationCategory({
        fid: currentUser.fid,
        conversationId: conversation.conversationId,
        fromCategory: conversation.viewerContext.category,
        toCategory: 'default',
      });
    } catch (e) {
      toast.show('Failed to unarchive conversation', { type: 'danger' });
      trackError(e);
    }
  }, [
    alterPlaintextDirectCastConversationCategory,
    conversation,
    currentUser.fid,
    toast,
    trackEvent,
    dismiss,
  ]);

  const markUnread = useCallback(async () => {
    trackEvent(AnalyticsEvent.MarkConversationAsUnread, {
      participant_count: conversation.participants.length,
    });

    try {
      dismiss();

      markConversationUnread({
        fid: currentUser.fid,
        conversationId: conversation.conversationId,
      });

      incrementInboxCount();
    } catch (e) {
      trackError(e);
    }
  }, [
    conversation.conversationId,
    conversation.participants.length,
    dismiss,
    incrementInboxCount,
    markConversationUnread,
    trackEvent,
    currentUser.fid,
  ]);

  const markRead = useCallback(async () => {
    try {
      dismiss();

      markConversationRead({
        conversationId: conversation.conversationId,
        fid: currentUser.fid,
      });

      if (!conversation.viewerContext.muted) {
        decreaseInboxCount();
      }
    } catch (e) {
      trackError(e);
    }
  }, [
    conversation.conversationId,
    conversation.viewerContext.muted,
    currentUser.fid,
    decreaseInboxCount,
    dismiss,
    markConversationRead,
  ]);

  const changeNotificationsInDirectCastConversation =
    useChangeNotificationsInPlaintextDirectCastConversation();

  const muteConversation = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.MuteDirectCastsGroup, {
      participant_count: conversation.participants.length,
    });

    try {
      dismiss();
      await changeNotificationsInDirectCastConversation({
        fid: currentUser.fid,
        conversationId: conversation.conversationId,
        muted: true,
      });
    } catch (e) {
      toast.show('Failed to snooze conversation', { type: 'danger' });
      trackError(e);
    }
  }, [
    changeNotificationsInDirectCastConversation,
    conversation,
    currentUser.fid,
    toast,
    trackEvent,
    dismiss,
  ]);

  const unmuteConversation = React.useCallback(async () => {
    try {
      dismiss();
      await changeNotificationsInDirectCastConversation({
        fid: currentUser.fid,
        conversationId: conversation.conversationId,
        muted: false,
      });
    } catch (e) {
      toast.show('Failed to end snooze for conversation', { type: 'danger' });
      trackError(e);
    }
  }, [
    changeNotificationsInDirectCastConversation,
    conversation.conversationId,
    currentUser.fid,
    dismiss,
    toast,
  ]);

  const pinConversation = usePinDirectCastConversation();
  const unpinConversation = useUnpinDirectCastConversation();

  const pin = useCallback(async () => {
    trackEvent(AnalyticsEvent.PinConversation, {
      participant_count: 2,
    });

    try {
      dismiss();

      await pinConversation({
        fid: currentUser.fid,
        conversationId: conversation.conversationId,
      });
    } catch (e) {
      trackError(e);
    }
  }, [
    conversation.conversationId,
    dismiss,
    pinConversation,
    trackEvent,
    currentUser.fid,
  ]);

  const unpin = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.UnpinConversation, {
      participant_count: 2,
    });

    try {
      dismiss();

      await unpinConversation({
        fid: currentUser.fid,
        conversationId: conversation.conversationId,
      });
    } catch (e) {
      trackError(e);
    }
  }, [
    conversation.conversationId,
    dismiss,
    trackEvent,
    unpinConversation,
    currentUser.fid,
  ]);

  const bottomOptions: ButtonGroupOption[] = [];

  if (
    conversation.viewerContext.category === 'request' ||
    conversation.viewerContext.category === 'void'
  ) {
    bottomOptions.push({
      label: 'Mute user',
      icon: ({ size }) => (
        <Octicons name="mute" size={size} color={t.colors.text.danger} />
      ),
      destructive: true,
      onPress: async () => {
        const { muted } = await muteUser({
          username: resolveUsername({
            fid: counterParty.fid,
            username: counterParty.username,
          }),
          source: 'direct-cast-request',
          targetFid: counterParty.fid,
        });

        if (muted) {
          dismiss();
        }
      },
    });
  } else {
    bottomOptions.push(
      conversation.viewerContext.pinned
        ? {
            label: 'Unpin',
            icon: () => <UnpinIcon />,
            onPress: unpin,
          }
        : {
            label: 'Pin',
            icon: () => <PinIcon />,
            onPress: pin,
          },
    );
    bottomOptions.push(
      conversation.viewerContext.muted
        ? {
            label: 'Unmute chat',
            icon: () => <UnmuteIcon />,
            onPress: unmuteConversation,
          }
        : {
            label: 'Mute chat',
            icon: () => <MuteIcon />,
            onPress: muteConversation,
          },
    );

    if (!conversation.viewerContext.manuallyMarkedUnread) {
      bottomOptions.push({
        label: 'Mark as unread',
        icon: () => <MarkAsUnreadIcon />,
        onPress: markUnread,
      });
    }

    if (
      conversation.viewerContext.manuallyMarkedUnread ||
      conversation.viewerContext.unreadCount !== 0
    ) {
      bottomOptions.push({
        label: 'Mark as read',
        icon: () => <MarkAsReadIcon />,
        onPress: markRead,
      });
    }

    bottomOptions.push(
      conversation.viewerContext.category === 'archived'
        ? {
            label: 'Move to inbox',
            icon: ({ size }) => (
              <Octicons
                name="inbox"
                size={size}
                color={t.colors.text.primary}
              />
            ),
            onPress: unarchive,
          }
        : {
            label: 'Archive',
            icon: ({ size }) => (
              <Octicons
                name="archive"
                size={size}
                color={t.colors.text.primary}
              />
            ),
            onPress: archive,
          },
    );
  }

  const wrappedDelete = async () => {
    const { deleted } = await promptToDelete();

    if (deleted) {
      eventingTrackEvent({
        name: 'reject direct cast request',
        props: {
          conversationId: conversation.conversationId,
          action: 'delete',
          via: 'inbox view',
        },
      });
    }
  };

  bottomOptions.push({
    label: 'Delete',
    icon: ({ size }) => (
      <Octicons name="trash" size={size} color={t.colors.text.danger} />
    ),
    destructive: true,
    onPress: () => wrappedDelete(),
  });

  return (
    <>
      <View
        style={[
          t.pY2,
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.justifyCenter,
          { gap: 12 },
        ]}
      >
        <CastAvatar avatarDiameter={80} user={counterParty} disabled />
        <Heading style={[{ fontSize: 24 }]}>{counterParty.username}</Heading>
      </View>
      <ButtonGroup
        options={[
          counterParty.viewerContext?.following
            ? {
                label: 'View profile',
                icon: ({ size }) => (
                  <Octicons
                    name="person"
                    size={size}
                    color={t.colors.text.primary}
                  />
                ),
                onPress: viewProfile,
              }
            : {
                label: 'Follow',
                icon: ({ size }) => (
                  <Octicons
                    name="person-add"
                    size={size}
                    color={t.colors.text.primary}
                  />
                ),
                onPress: follow,
              },
        ]}
      />
      <ButtonGroup options={bottomOptions} />
    </>
  );
}

export const useManageDirectCastConversation = () =>
  React.useContext(ManageDirectCastConversationContext);

export { ManageDirectCastConversationProvider };
