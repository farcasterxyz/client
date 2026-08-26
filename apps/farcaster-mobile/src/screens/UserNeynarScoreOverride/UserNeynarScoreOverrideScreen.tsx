import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { canOverrideNeynarScore } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useSetNeynarScoreOverride } from '~/hooks/data/useSetNeynarScoreOverride';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { formatNeynarScore } from '~/utils/NeynarScoreUtils';

const scoreOptions = [
  {
    score: 0.9,
    guidance: 'clear value-add with original, substantive content',
  },
  {
    score: 0.7,
    guidance: 'authentic activity but mid quality or mini-app focus',
  },
  {
    score: 0.5,
    guidance: 'dormant or mixed signals',
  },
  {
    score: 0.3,
    guidance: 'primarily engagement farming, rings, or airdrop hunting',
  },
  {
    score: 0.1,
    guidance: 'inauthentic, purely extractive activity',
  },
] as const;

const getAllowedSelectedScore = (score?: number) => {
  return scoreOptions.find((option) => option.score === score)?.score;
};

type UserScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'UserNeynarScoreOverride'
>;

const UserNeynarScoreOverrideScreen = buildScreen<UserScreenProps>(
  {
    name: 'UserNeynarScoreOverride',
    avoidKeyboard: true,
  },
  ({
    route: {
      params: { user, neynarScoreInfo },
    },
  }) => {
    const t = useTheme();
    const toast = useToast();
    const pop = usePop();
    const setNeynarScoreOverride = useSetNeynarScoreOverride();
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const [reason, setReason] = useState('');
    const [selectedScore, setSelectedScore] = useState<number | undefined>(
      getAllowedSelectedScore(neynarScoreInfo?.overrideScore),
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
      return (
        canOverrideNeynarScore(currentUserFid) &&
        typeof getAllowedSelectedScore(selectedScore) === 'number' &&
        reason.trim().length > 0 &&
        !isSubmitting
      );
    }, [currentUserFid, isSubmitting, reason, selectedScore]);

    const updateOverride = useCallback(async () => {
      const allowedSelectedScore = getAllowedSelectedScore(selectedScore);

      if (typeof allowedSelectedScore !== 'number' || isSubmitting) {
        return;
      }

      try {
        setIsSubmitting(true);
        await setNeynarScoreOverride({
          fid: user.fid,
          username: user.username,
          score: allowedSelectedScore,
          reason: reason.trim(),
        });

        pop();
      } catch (error) {
        trackError(error);
        toast.show('Error updating Neynar score', { type: 'danger' });
      } finally {
        setIsSubmitting(false);
      }
    }, [
      isSubmitting,
      pop,
      reason,
      selectedScore,
      setNeynarScoreOverride,
      toast,
      user.fid,
      user.username,
    ]);

    if (!canOverrideNeynarScore(currentUserFid)) {
      return (
        <View style={[t.flex1, t.p4]}>
          <Text style={[t.texts.primary]}>
            Neynar score override is not available for this account.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={[t.hFull]}>
        <View style={[t.p4]}>
          <View
            style={[
              t.borderHairline,
              t.borderDefault,
              t.roundedLg,
              t.p4,
              t.mB4,
            ]}
          >
            <Text style={[t.texts.secondary, t.textXs, t.mB2]}>
              {resolveUsername({
                username: user.username,
                fid: user.fid,
              })}
            </Text>
            <NeynarScoreInfoRow
              label="Imported score"
              value={formatNeynarScore(neynarScoreInfo?.originalScore)}
            />
            {typeof neynarScoreInfo?.overrideScore === 'number' && (
              <>
                <NeynarScoreInfoRow
                  label="Overridden score"
                  value={formatNeynarScore(neynarScoreInfo.overrideScore)}
                />
                <NeynarScoreInfoRow
                  label="Overridden by"
                  value={
                    typeof neynarScoreInfo.overriddenByFid === 'number'
                      ? `${neynarScoreInfo.overriddenByFid}`
                      : 'n/a'
                  }
                />
                <NeynarScoreInfoRow
                  label="Reason"
                  value={neynarScoreInfo.overrideReason || 'n/a'}
                  multiline={true}
                />
              </>
            )}
          </View>

          <Text style={[t.texts.primary, t.mB1]}>Override score</Text>
          {scoreOptions.map((option) => (
            <NeynarScoreOption
              key={option.score}
              score={option.score}
              guidance={option.guidance}
              selected={selectedScore === option.score}
              onPress={() => setSelectedScore(option.score)}
            />
          ))}

          <Text style={[t.texts.primary, t.mB1, t.mT4]}>Reason</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={true}
            autoFocus={false}
            clearButtonMode="never"
            editable={!isSubmitting}
            keyboardType="default"
            selectTextOnFocus={false}
            spellCheck={true}
            multiline={true}
            numberOfLines={3}
            maxLength={256}
            inputStyle={[
              t.border,
              t.textSm,
              t.p2,
              t.borderDefault,
              t.borderHairline,
              t.borderBHairline,
              t.h15,
            ]}
            onChangeText={setReason}
            value={reason}
          />
          <AtomsButton
            size="l"
            hierarchy="primary"
            style={[t.mT6]}
            disabled={!canSubmit}
            onPress={updateOverride}
          >
            Update
          </AtomsButton>
        </View>
      </ScrollView>
    );
  },
);

UserNeynarScoreOverrideScreen.displayName = 'UserNeynarScoreOverrideScreen';

interface NeynarScoreInfoRowProps {
  label: string;
  value: string;
  multiline?: boolean;
}

const NeynarScoreInfoRow: FC<NeynarScoreInfoRowProps> = ({
  label,
  value,
  multiline = false,
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        t.flexRow,
        t.justifyBetween,
        multiline ? t.itemsStart : t.itemsCenter,
        t.mB2,
      ]}
    >
      <Text style={[t.texts.secondary, t.textSm]}>{label}</Text>
      <Text
        style={[
          t.texts.primary,
          t.textSm,
          multiline ? [t.mL3, t.flex1] : undefined,
          { textAlign: 'right' },
        ]}
        numberOfLines={multiline ? undefined : 1}
      >
        {value}
      </Text>
    </View>
  );
};

NeynarScoreInfoRow.displayName = 'NeynarScoreInfoRow';

interface NeynarScoreOptionProps {
  score: number;
  guidance: string;
  selected: boolean;
  onPress: () => void;
}

const NeynarScoreOption: FC<NeynarScoreOptionProps> = ({
  score,
  guidance,
  selected,
  onPress,
}) => {
  const t = useTheme();

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.p3,
          t.mB2,
          t.borderHairline,
          t.borderDefault,
          t.rounded,
          selected ? t.bgFaintOld : undefined,
        ]}
      >
        <Text style={[t.texts.primary, { width: 28 }]}>{score.toFixed(1)}</Text>
        <Text style={[t.texts.primary, t.mL3, t.flex1]} numberOfLines={1}>
          {guidance}
        </Text>
      </View>
    </Pressable>
  );
};

NeynarScoreOption.displayName = 'NeynarScoreOption';

export { UserNeynarScoreOverrideScreen };
