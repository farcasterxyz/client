import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiUserQuality } from 'farcaster-client-data';
import { resolveUsername, useSetUserQuality } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type UserScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'UserQuality'
>;

const UserQualityScreen = buildScreen<UserScreenProps>(
  {
    name: 'UserQuality',
    avoidKeyboard: true,
  },
  ({
    route: {
      params: { user, quality, badness: initialBadness },
    },
  }) => {
    const t = useTheme();
    const toast = useToast();
    const pop = usePop();
    const setUserQuality = useSetUserQuality();

    const [reason, setReason] = useState('');

    const [selectedQuality, setSelectedQualityState] = useState<
      ApiUserQuality | undefined
    >(quality);

    const [badness, setBadness] = useState<number | undefined>(
      initialBadness ?? 0,
    );

    const setSelectedQuality = useCallback(
      (newQuality: ApiUserQuality | undefined) => {
        if (newQuality !== 'low') {
          setBadness(undefined);
        } else {
          setBadness(initialBadness ?? 0);
        }

        setSelectedQualityState(newQuality);
      },
      [initialBadness],
    );

    const badnessEnabled = useMemo(
      () => selectedQuality === 'low',
      [selectedQuality],
    );

    const canSubmit = useMemo(() => {
      if (!selectedQuality) {
        return false;
      }
      if (selectedQuality === 'unranked') {
        return false;
      }
      if (selectedQuality === 'harmful' && reason.trim().length === 0) {
        return false;
      }
      return true;
    }, [reason, selectedQuality]);

    const updateUserQuality = useCallback(async () => {
      if (selectedQuality) {
        if (selectedQuality === 'unranked') {
          return;
        }

        try {
          await setUserQuality({
            fid: user.fid,
            quality: selectedQuality,
            badness: badnessEnabled ? badness : undefined,
            reason,
          });

          pop();
        } catch (error) {
          trackError(error);
          toast.show('Error updating quality', { type: 'danger' });
        }
      }
    }, [
      badness,
      badnessEnabled,
      pop,
      reason,
      selectedQuality,
      setUserQuality,
      toast,
      user.fid,
    ]);

    return (
      <ScrollView style={[t.hFull]}>
        <View style={[t.p4]}>
          <UserQualityOption
            icon="star"
            label="High quality"
            selected={selectedQuality === 'high'}
            onPress={() => setSelectedQuality('high')}
          />
          <UserQualityOption
            icon="dash"
            label="Neutral quality"
            selected={selectedQuality === 'neutral'}
            onPress={() => setSelectedQuality('neutral')}
          />
          <UserQualityOption
            icon="thumbsdown"
            label="Low quality"
            selected={selectedQuality === 'low'}
            onPress={() => setSelectedQuality('low')}
          />
          <UserQualityOption
            icon="trash"
            label="Spam"
            selected={selectedQuality === 'spam'}
            onPress={() => setSelectedQuality('spam')}
          />
          <UserQualityOption
            icon="stop"
            label="Harmful"
            selected={selectedQuality === 'harmful'}
            onPress={() => setSelectedQuality('harmful')}
          />
          <UserQualityOption
            icon="circle"
            label="Unranked"
            selected={selectedQuality === 'unranked'}
            onPress={() => setSelectedQuality('unranked')}
          />
          <UserQualityOption
            icon="dependabot"
            label="Automated"
            selected={selectedQuality === 'automated'}
            onPress={() => setSelectedQuality('automated')}
          />
          <Text
            style={[
              badnessEnabled ? t.texts.primary : t.texts.secondary,
              t.mB1,
              t.mT2,
            ]}
          >
            Low quality badness
          </Text>
          <Text
            style={[
              badnessEnabled ? t.texts.primary : t.texts.secondary,
              t.mB1,
              t.textXs,
            ]}
          >
            0 to 100, 0 = visible to non-followers, 100 = invisible to
            non-followers
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
            clearButtonMode="never"
            editable={badnessEnabled}
            keyboardType="default"
            selectTextOnFocus={false}
            spellCheck={true}
            multiline={false}
            numberOfLines={1}
            maxLength={3}
            inputStyle={[
              t.border,
              t.textSm,
              t.p2,
              t.borderDefault,
              t.borderHairline,
              t.borderBHairline,
            ]}
            onChangeText={(text) => {
              setBadness((v) => {
                if (text === '') {
                  return 0;
                } else {
                  const val = parseInt(text);
                  if (!Number.isNaN(val) && val >= 0 && val <= 100) {
                    return val;
                  }
                  return v;
                }
              });
            }}
            value={badness ? badness.toString() : ''}
          />
          <Text style={[t.texts.primary, t.mB1, t.mT2]}>
            Reason (required for Harmful):
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={true}
            autoFocus={false}
            clearButtonMode="never"
            editable={true}
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
            onChangeText={(text) => {
              setReason(text);
            }}
            value={reason}
          />
          <AtomsButton
            size="l"
            hierarchy="primary"
            style={[t.mT6]}
            disabled={!canSubmit}
            onPress={async () => {
              if (selectedQuality === 'harmful') {
                Alert.alert(
                  `Sure you want to mark ${resolveUsername({
                    username: user.username,
                    fid: user.fid,
                  })} as harmful?`,
                  'This will clear out their profile',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Mark harmful',
                      style: 'destructive',
                      onPress: updateUserQuality,
                    },
                  ],
                );
              } else {
                updateUserQuality();
              }
            }}
          >
            Update
          </AtomsButton>
        </View>
      </ScrollView>
    );
  },
);

UserQualityScreen.displayName = 'UserQualityScreen';

interface UserQualityOptionProps {
  icon: (typeof Octicons)['name'];
  label: string;
  selected: boolean;
  onPress: () => void;
}

const UserQualityOption: FC<UserQualityOptionProps> = ({
  icon,
  label,
  selected,
  onPress,
}) => {
  const t = useTheme();

  const iconComp = useMemo(() => {
    // @ts-ignore-next-line
    return <Octicons name={icon} size={16} color={t.colors.text.primary} />;
  }, [icon, t.colors.text.primary]);

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
        {iconComp}
        <Text style={[t.texts.primary, t.mL2]}>{label}</Text>
      </View>
    </Pressable>
  );
};

UserQualityOption.displayName = 'UserQualityOption';

export { UserQualityScreen };
