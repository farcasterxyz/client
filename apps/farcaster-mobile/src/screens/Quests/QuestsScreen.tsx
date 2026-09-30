import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useAssignQuest,
  useDeleteQuests,
  useRemovePhoneVerification,
} from 'farcaster-client-hooks';
import React from 'react';
import { TextInput, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type QuestsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'Rewards'
>;

const QuestsScreen = buildScreen<QuestsScreenProps>({ name: 'Rewards' }, () => {
  const t = useTheme();

  const [debugUserFid, setDebugUserFid] = React.useState('');
  const assignQuest = useAssignQuest();
  const deleteQuests = useDeleteQuests();
  const removePhoneVerification = useRemovePhoneVerification();

  return (
    <View style={[t.hFull, t.wFull]}>
      <View style={[t.justifyBetween, t.hFull, t.wFull]}>
        <View style={[t.flex, t.flexCol, t.itemsStart, t.pX3, t.pT3]}>
          <View style={[t.mT4, t.p4, t.roundedLg, t.bgElevated, t.wFull]}>
            <Text2 style={[t.fontMedium, t.textBase, t.mB2]}>
              Debug quest admin
            </Text2>
            <View style={[t.flexRow, t.mB2]}>
              <TextInput
                style={[
                  t.flex1,
                  t.p2,
                  t.rounded,
                  t.bgElevated,
                  { color: t.colors.text.primary },
                ]}
                value={debugUserFid}
                onChangeText={setDebugUserFid}
                placeholder="Fid"
                placeholderTextColor={t.colors.text.secondary}
              />
            </View>
            <View style={[t.flexRow, t.mB2]}>
              <ButtonV2
                variant="primary"
                height="sm"
                title="Add quest"
                onPress={() => {
                  assignQuest(Number(debugUserFid), 'follow-5');
                }}
              />
              <View style={[t.mX2]}></View>
              <ButtonV2
                variant="destructive"
                height="sm"
                title="Remove all quests"
                onPress={() => {
                  deleteQuests(Number(debugUserFid));
                }}
              />
            </View>
            <View style={[t.flexRow]}>
              <ButtonV2
                variant="destructive"
                height="sm"
                title="Remove phone verification"
                onPress={() => {
                  removePhoneVerification(Number(debugUserFid));
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

QuestsScreen.displayName = 'QuestsScreen';

export { QuestsScreen };
