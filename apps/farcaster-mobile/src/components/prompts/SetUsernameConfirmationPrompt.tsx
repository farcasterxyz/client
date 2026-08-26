import { useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useSetUserUsername } from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { setUsernameConfirmationPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

import { Prompt } from './Prompt';

type SetUsernameConfirmationPromptProps = {
  username: string;
  canSetUsername: boolean;
  canSetUsernameAgainAfter: string;
};

const SetUsernameConfirmationPrompt: React.FC<SetUsernameConfirmationPromptProps> =
  React.memo(({ username, canSetUsername, canSetUsernameAgainAfter }) => {
    const { trackEvent } = useAnalytics();

    const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();

    const shouldPresent = React.useCallback(() => {
      return activePromptKey === setUsernameConfirmationPromptKey;
    }, [activePromptKey]);

    React.useEffect(() => {
      if (activePromptKey === setUsernameConfirmationPromptKey) {
        trackEvent(AnalyticsEvent.ShowSetUsernamePrompt, undefined);
      }
    }, [activePromptKey, trackEvent]);

    return (
      <Prompt
        shouldPresent={shouldPresent}
        height={350}
        storageKey={setUsernameConfirmationPromptKey}
        enableTouchThrough={false}
        onBackdropPress={hideGlobalPrompt}
      >
        <SetUsernameConfirmationPromptContent
          username={username}
          canSetUsername={canSetUsername}
          canSetUsernameAgainAfter={canSetUsernameAgainAfter}
        />
      </Prompt>
    );
  });

SetUsernameConfirmationPrompt.displayName = 'SetUsernameConfirmationPrompt';

const SetUsernameConfirmationPromptContent: React.FC<
  SetUsernameConfirmationPromptProps
> = ({ username, canSetUsername, canSetUsernameAgainAfter }) => {
  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const { trackEvent } = useAnalytics();
  const toast = useToast();

  const { fid } = useCurrentUser_UNSAFE();

  const [settingUsername, setSettingUsername] = React.useState<boolean>(false);

  const setUserUsername = useSetUserUsername();

  const onConfirmPress = React.useCallback(async () => {
    setSettingUsername(true);
    try {
      await setUserUsername({ fid, username });
    } catch {
      toast.show('Failed to update username', {
        type: 'danger',
      });
    } finally {
      hideGlobalPrompt();
      forceClose();
      setSettingUsername(false);
    }
  }, [fid, forceClose, hideGlobalPrompt, setUserUsername, toast, username]);

  if (!canSetUsername) {
    return (
      <View style={[t.hFull, t.justifyBetween, t.p4, t.pB8]}>
        <View>
          <Text
            style={[
              t.textBase,
              t.texts.primary,
              t.textXl,
              t.fontExtrabold,
              t.textCenter,
            ]}
          >
            Change username
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.pY6, t.textCenter]}>
            You recently changed your username. You can switch again in{' '}
            <Text style={[t.fontBold]}>{canSetUsernameAgainAfter}</Text>.
          </Text>
        </View>
        <View>
          <Pressable
            style={[t.itemsCenter]}
            onPress={() => {
              trackEvent(
                AnalyticsEvent.ClickCancelSetUsernamePrompt,
                undefined,
              );

              hideGlobalPrompt();
              forceClose();
            }}
          >
            <Text style={[t.textBase, t.texts.primary]}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[t.hFull, t.justifyBetween, t.p4, t.pB8]}>
      <View>
        <Text
          style={[
            t.textBase,
            t.texts.primary,
            t.textXl,
            t.fontExtrabold,
            t.textCenter,
          ]}
        >
          Change username
        </Text>
        <Text style={[t.texts.primary, t.textBase, t.pY6, t.textCenter]}>
          You can't change this again for{' '}
          <Text style={[t.fontBold]}>{canSetUsernameAgainAfter}</Text>.
        </Text>
        <Text
          style={[t.texts.primary, t.textXl, t.fontBold, t.pY3, t.textCenter]}
        >
          @{username}
        </Text>
      </View>
      <View>
        <Button
          title="Confirm"
          style={[t.mB6]}
          loading={settingUsername}
          onPress={async () => {
            trackEvent(AnalyticsEvent.ClickConfirmSetUsernamePrompt, undefined);

            await onConfirmPress();
          }}
        />
        <Pressable
          style={[t.itemsCenter]}
          onPress={() => {
            trackEvent(AnalyticsEvent.ClickCancelSetUsernamePrompt, undefined);

            hideGlobalPrompt();
            forceClose();
          }}
        >
          <Text style={[t.textBase, t.texts.primary]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
};

export { SetUsernameConfirmationPrompt };
