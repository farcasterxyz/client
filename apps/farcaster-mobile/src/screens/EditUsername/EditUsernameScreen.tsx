import { Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  formatDuration,
  getNotionLinkTarget,
  useUser,
  useUserUsernames,
} from 'farcaster-client-hooks';
import React from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';

import { Button } from '~/components/Button';
import { SetUsernameConfirmationPrompt } from '~/components/prompts/SetUsernameConfirmationPrompt';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { setUsernameConfirmationPromptKey } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { HomeStackParamList } from '~/types';

type EditUsernameScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'EditUsername'
>;

const EditUsernameScreen = buildScreen<EditUsernameScreenProps>(
  { name: 'EditUsername' },
  () => {
    const t = useTheme();
    const push = usePush();
    const { setOptions } = useNavigation();

    const { showGlobalPrompt } = useGlobalPrompts();

    const currentUser = useCurrentUser_UNSAFE();
    // Using the user hook here as we cache the current user and don't want to
    // invalidate that as its through the onboarding state.
    const { data: userData } = useUser({
      fid: currentUser.fid,
      isCurrentUser: true,
    });

    const user = React.useMemo(() => {
      return userData?.result.user;
    }, [userData?.result.user]);

    const [usernamePressed, setUsernamePressed] = React.useState<string>();

    const currentUserUsername = React.useMemo(() => {
      return user?.username || '';
    }, [user?.username]);

    const { data } = useUserUsernames();

    const fnames = React.useMemo(() => {
      return (data!.usernames || []).filter(({ type }) => type === 'fname');
    }, [data]);

    const ensNames = React.useMemo(() => {
      return (data!.usernames || []).filter(({ type }) => type === 'ens_l1');
    }, [data]);

    const canSetUsername = React.useMemo(() => {
      return typeof data!.nextPossibleUpdateAt === 'undefined';
    }, [data]);

    const canSetUsernameAgainAfter = React.useMemo(() => {
      return formatDuration(data!.usernameUpdateLimitMillis);
    }, [data]);

    const onAddENSNamePress = React.useCallback(() => {
      push('AddENSUsername', {});
    }, [push]);

    const onUsernamePress = React.useCallback(
      async ({ username: usernameToSelect }: { username: string }) => {
        if (usernameToSelect !== currentUserUsername) {
          showGlobalPrompt({ key: setUsernameConfirmationPromptKey });
          setUsernamePressed(usernameToSelect);
        }
      },
      [showGlobalPrompt, currentUserUsername],
    );

    const onInfoPress = React.useCallback(() => {
      Linking.openURL(getNotionLinkTarget({ to: 'usernames' }));
    }, []);

    React.useEffect(() => {
      setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={onInfoPress}
            hitSlop={hitSlop}
            activeOpacity={0.3}
            style={[t.itemsCenter, t.justifyCenter, t.flex, t.mT1]}
          >
            <Octicons name="info" size={14} style={[t.texts.primary]} />
          </TouchableOpacity>
        ),
      });
    }, [
      onInfoPress,
      setOptions,
      t.flex,
      t.itemsCenter,
      t.justifyCenter,
      t.mT1,
      t.texts.primary,
    ]);

    return (
      <View style={[t.hFull, t.p4]}>
        {fnames.length !== 0 && (
          <View style={[t.mB0]}>
            <Text style={[t.texts.secondary, t.textBase, t.fontSemibold]}>
              Farcaster name
            </Text>

            {fnames.map(({ name: fname }) => {
              return (
                <Username
                  key={fname}
                  username={fname}
                  selected={fname === currentUserUsername}
                  onUsernamePress={onUsernamePress}
                />
              );
            })}
          </View>
        )}
        <View style={[t.mY4]}>
          <Text style={[t.texts.secondary, t.textBase, t.fontSemibold]}>
            ENS
          </Text>
          {ensNames.length !== 0 && (
            <>
              {ensNames.map(({ name: ensName }) => {
                return (
                  <Username
                    key={ensName}
                    username={ensName}
                    selected={ensName === currentUserUsername}
                    onUsernamePress={onUsernamePress}
                  />
                );
              })}
            </>
          )}
          <Button
            onPress={onAddENSNamePress}
            title={'Add ENS name'}
            variant="mutedSecondary"
            size="sm"
            fontWeight="normal"
            style={[t.wFull, t.itemsStart, t.mY4, t.pX0]}
          />
        </View>
        {usernamePressed && (
          <SetUsernameConfirmationPrompt
            username={usernamePressed}
            canSetUsername={canSetUsername}
            canSetUsernameAgainAfter={canSetUsernameAgainAfter}
          />
        )}
      </View>
    );
  },
);

type UsernameProps = {
  username: string;
  selected: boolean;
  onUsernamePress: ({ username }: { username: string }) => void;
};

const Username: React.FC<UsernameProps> = ({
  username,
  selected,
  onUsernamePress,
}) => {
  const t = useTheme();

  return (
    <TouchableOpacity
      style={[
        t.flex,
        t.flexRow,
        t.justifyBetween,
        t.itemsCenter,
        t.borderBHairline,
        t.borderDefault,
      ]}
      activeOpacity={0.75}
      onPress={() => {
        onUsernamePress({ username });
      }}
    >
      <Text
        style={[
          t.flex1,
          t.pY4,
          t.texts.primary,
          t.textBase,
          { maxWidth: '90%' },
        ]}
      >
        @{username}
      </Text>
      {selected && (
        <Octicons name="check" style={[t.texts.success, t.textXl]} />
      )}
    </TouchableOpacity>
  );
};

EditUsernameScreen.displayName = 'EditUsernameScreen';

export { EditUsernameScreen };
