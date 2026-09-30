import { Ionicons, Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiReportCastReason, ApiUser } from 'farcaster-client-data';
import {
  CastReactionType,
  ReportCastError,
  resolveUsername,
  useMarkInvisibleFromCast,
  useReportCast,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';
import { getUserMarkInvisibleDisclaimer } from '~/utils/UserVisibilityUtils';

type ReportCastProps = {
  currentUserFid: number;
  castHash: string;
  targetUser: ApiUser;
  onDismiss: () => void;
};

const ReportCast: React.FC<ReportCastProps> = ({
  castHash,
  targetUser,
  onDismiss,
}) => {
  const toast = useRootToast();
  const [showCastReportedSheet, setShowCastReportedSheet] = useState(false);
  const reportCastSheetRef = useRef<{ dismiss: () => void }>(null);
  const showingReportedSheetRef = useRef(false);

  useEffect(() => {
    toast.hideAll();
  }, [toast]);

  const onReportCastSuccess = useCallback(() => {
    showingReportedSheetRef.current = true;
    setShowCastReportedSheet(true);
  }, []);

  const onReportCastDismiss = useCallback(() => {
    if (!showingReportedSheetRef.current) {
      onDismiss();
    }
  }, [onDismiss]);

  const onCastReportedDismiss = useCallback(() => {
    showingReportedSheetRef.current = false;
    setShowCastReportedSheet(false);
    onDismiss();
  }, [onDismiss]);

  return (
    <>
      <AutoDisplayingBottomSheetModal
        ref={reportCastSheetRef}
        name="reportCast"
        onDismiss={onReportCastDismiss}
      >
        <ReportCastBottomSheet
          castHash={castHash}
          author={targetUser}
          onSuccess={onReportCastSuccess}
        />
      </AutoDisplayingBottomSheetModal>
      {showCastReportedSheet && (
        <AutoDisplayingBottomSheetModal
          name="castReported"
          onDismiss={onCastReportedDismiss}
        >
          <CastReportedBottomSheet
            castHash={castHash}
            targetUser={targetUser}
            onMute={onCastReportedDismiss}
          />
        </AutoDisplayingBottomSheetModal>
      )}
    </>
  );
};

type ReportCastBottomSheetProps = {
  castHash: string;
  author: ApiUser;
  onSuccess: () => void;
};

const ReportCastBottomSheet: React.FC<ReportCastBottomSheetProps> = ({
  castHash,
  author,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const toast = useRootToast();
  const { reportCast, reportCastOptions } = useReportCast();
  const trackCastReaction = useTrackCastReaction();

  const selectReason = useCallback(
    async (reason: ApiReportCastReason) => {
      try {
        trackCastReaction({
          castHash: castHash,
          type: CastReactionType.Report,
          undo: false,
          castFid: author.fid,
        });

        await reportCast({ castHash, reason });

        onSuccess();
      } catch (error) {
        trackError(new ReportCastError({ error, hash: castHash }));
        toast.show('Failed to report cast', {
          placement: 'top',
          type: 'danger',
        });
      }
    },
    [reportCast, castHash, toast, trackCastReaction, author, onSuccess],
  );

  return (
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
          Why are you reporting this cast?
        </Text>
      </View>
      <View style={[t.wFull, t.itemsCenter, t.flex, t.justifyBetween]}>
        {reportCastOptions.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.wFull,
              t.pY4,
              t.borderDefault,
              index === reportCastOptions.length - 1
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
  );
};

type CastReportedBottomSheetProps = {
  castHash: string;
  targetUser: ApiUser;
  onMute: () => void;
};

const CastReportedBottomSheet: React.FC<CastReportedBottomSheetProps> = ({
  castHash,
  targetUser,
  onMute,
}) => {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const markInvisible = useMarkInvisibleFromCast();
  const toast = useRootToast();
  const { trackEvent } = useAnalytics();
  const { learnMoreUrl } = useReportCast();

  const muteUser = useCallback(async () => {
    try {
      await markInvisible({
        targetFid: targetUser.fid,
        castHash: castHash,
        block: false,
      });
      trackEvent(AnalyticsEvent.ClickMute, undefined);

      Alert.alert(
        getUserMarkInvisibleDisclaimer({
          user: targetUser,
          blocked: false,
        }),
        'Changes may take a few minutes to be reflected.',
        [
          {
            text: 'OK',
            onPress: () => onMute(),
          },
        ],
      );
    } catch (error) {
      trackError(error);
      toast.show('Failed, please try again', {
        placement: 'top',
        type: 'danger',
      });
    }
  }, [markInvisible, targetUser, castHash, trackEvent, onMute, toast]);

  return (
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
      <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
        <View style={[t.wFull, t.pX4, t.pY4, t.flex, t.flexCol]}>
          <Text style={[t.texts.primary, t.textXl, t.fontSemibold, t.mB2]}>
            Cast reported
          </Text>
          <Text style={[t.textBase, t.texts.secondary, t.pB1]}>
            We'll review your report and let you know if we take action on it.
          </Text>
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter]}
            onPress={() => {
              Linking.openURL(learnMoreUrl);
            }}
          >
            <Text style={[t.textBase, t.texts.brand]}>Learn more</Text>
            <Octicons
              name="arrow-right"
              size={14}
              style={[
                t.mL1,
                t.texts.brand,
                { paddingTop: Platform.OS === 'android' ? 4.5 : 1.5 },
              ]}
            />
          </TouchableOpacity>
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
                // Android stops registering press events on the parent without this.
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
    </View>
  );
};

export { ReportCast };
