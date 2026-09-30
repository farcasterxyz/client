import { Ionicons } from '@expo/vector-icons';
import {
  // eslint-disable-next-line no-restricted-imports
  BottomSheetModal as BottomSheetModalLib,
  BottomSheetView,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import type {
  ApiReportUserReason,
  ApiUser,
  ApiUserMinimal,
} from 'farcaster-client-data';
import {
  ReportUserError,
  resolveUsername,
  useMarkInvisible,
  useReportUser,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useEffect } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';
import { getUserMarkInvisibleDisclaimer } from '~/utils/UserVisibilityUtils';

type ReportUserProps = {
  targetUser: ApiUser | ApiUserMinimal;
  onDismiss: () => void;
  onSubmit?: () => void;
};

const ReportUser = React.forwardRef<BottomSheetModalLib, ReportUserProps>(
  ({ targetUser, onDismiss, onSubmit }, reportUserBottomSheetRef) => {
    const { dismissAll } = useBottomSheetModal();
    const toast = useRootToast();
    const userReportedBottomSheetRef = useBottomSheetModalRef();

    useEffect(() => {
      toast.hideAll();
      dismissAll();

      const userReportedSheet = userReportedBottomSheetRef.current;

      return () => {
        userReportedSheet?.dismiss();
      };
    }, [
      toast,
      dismissAll,
      reportUserBottomSheetRef,
      userReportedBottomSheetRef,
    ]);

    const onCastReportedBottomSheetDismiss = useCallback(() => {
      dismissAll();

      onDismiss();
    }, [dismissAll, onDismiss]);

    const onReportUserSuccess = useCallback(() => {
      dismissAll();

      onSubmit?.();

      userReportedBottomSheetRef.current?.present();
    }, [dismissAll, onSubmit, userReportedBottomSheetRef]);

    const onMuteUserSuccess = useCallback(() => {
      userReportedBottomSheetRef.current?.dismiss();
    }, [userReportedBottomSheetRef]);

    return (
      <>
        <BottomSheetModal
          name="reportUser"
          ref={reportUserBottomSheetRef}
          enableDynamicSizing
          onDismiss={onDismiss}
        >
          <ReportUserBottomSheet
            targetUser={targetUser}
            onSuccess={onReportUserSuccess}
          />
        </BottomSheetModal>
        <BottomSheetModal
          name="userReported"
          ref={userReportedBottomSheetRef}
          enableDynamicSizing
          onDismiss={onCastReportedBottomSheetDismiss}
        >
          <UserReportedBottomSheet
            targetUser={targetUser}
            onMute={onMuteUserSuccess}
          />
        </BottomSheetModal>
      </>
    );
  },
);

type ReportUserBottomSheetProps = {
  targetUser: ApiUser | ApiUserMinimal;
  onSuccess: () => void;
};

const ReportUserBottomSheet: React.FC<ReportUserBottomSheetProps> = ({
  targetUser,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const toast = useRootToast();
  const { reportUser, reportUserOptions } = useReportUser();

  const selectReason = useCallback(
    async (reason: ApiReportUserReason) => {
      try {
        await reportUser({ reportedFid: targetUser.fid, reason });

        onSuccess();
      } catch (error) {
        trackError(new ReportUserError({ error, reportedFid: targetUser.fid }));
        toast.show('Failed to report user', {
          placement: 'top',
          type: 'danger',
        });
      }
    },
    [onSuccess, reportUser, targetUser.fid, toast],
  );

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p0,
          { paddingBottom: insets.bottom, minHeight: 0 },
        ]}
      >
        <View style={[t.wFull, t.pX4, t.mY4, t.flex, t.flexRow]}>
          <Text
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.texts.primary,
              t.textXl,
              t.fontSemibold,
            ]}
          >
            Why are you reporting this user?
          </Text>
        </View>
        <View style={[t.wFull, t.itemsCenter, t.flex, t.justifyBetween]}>
          {reportUserOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.wFull,
                t.pY4,
                t.borderDefault,
                index === reportUserOptions.length - 1
                  ? undefined
                  : t.borderBHairline,
              ]}
              activeOpacity={0.75}
              onPress={() => selectReason(option.id)}
            >
              <View style={[t.flex, t.flexCol, t.wFull, t.pX4]}>
                <Text style={[t.textLg, t.texts.primary, t.pB1]}>
                  {option.label}
                </Text>
                <Text style={[t.textSm, t.texts.secondary]}>
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheetView>
  );
};

type UserReportedBottomSheetProps = {
  targetUser: ApiUser | ApiUserMinimal;
  onMute: () => void;
};

const UserReportedBottomSheet: React.FC<UserReportedBottomSheetProps> = ({
  targetUser,
  onMute,
}) => {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const markInvisible = useMarkInvisible();
  const toast = useRootToast();
  const { trackEvent } = useAnalytics();

  const muteUser = useCallback(async () => {
    try {
      await markInvisible({
        targetFid: targetUser.fid,
        block: false,
      });
      trackEvent(AnalyticsEvent.ClickMute, undefined);

      Alert.alert(
        getUserMarkInvisibleDisclaimer({
          user: targetUser as ApiUser,
          blocked: false,
        }),
        'Changes may take a few minutes to be reflected.',
        [
          {
            text: 'OK',
          },
        ],
      );

      onMute();
    } catch (error) {
      trackError(error);
      toast.show('Failed, please try again', {
        placement: 'top',
        type: 'danger',
      });
    }
  }, [markInvisible, targetUser, trackEvent, onMute, toast]);

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p0,
          { paddingBottom: insets.bottom, minHeight: 0 },
        ]}
      >
        <View style={[t.wFull, t.pX4, t.pY4, t.flex, t.flexCol]}>
          <Text style={[t.texts.primary, t.textXl, t.fontSemibold, t.mB2]}>
            User reported
          </Text>
          <Text style={[t.textBase, t.texts.secondary, t.pB1]}>
            We'll review your report and let you know if we take action on it.
          </Text>
        </View>
        <View style={[t.flex, t.flexCol, t.wFull, t.pX4]}>
          <View style={[t.flex, t.flexCol, t.wFull, t.pY4]}>
            <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
              Other steps you can take
            </Text>
          </View>
          <View style={[t.flex, t.flexCol, t.wFull, t.pB4]}>
            <TouchableOpacity
              style={[t.flex, t.flexRow, t.h11, t.w11, t.wFull, t.itemsCenter]}
              onPress={muteUser}
            >
              <Ionicons
                name="volume-mute"
                size={16}
                // Do not remove this thinking its not needed.
                // Android will stop registering press events without suppresing them on the
                // icon here.
                pointerEvents="none"
                style={[t.texts.danger]}
              />
              <Text
                style={[t.pL2, t.textBase, t.texts.primary, t.texts.danger]}
              >
                {`Mute ${resolveUsername({
                  username: targetUser.username,
                  fid: targetUser.fid,
                })}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheetView>
  );
};

export { ReportUser };
