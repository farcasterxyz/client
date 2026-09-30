import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import { openInbox } from 'react-native-email-link';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useNavigateToUserProfile } from '~/hooks/navigation/useNavigateToUserProfile';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';
import { resolveUniversalLink } from '~/utils/DeepLinkUtils';

type DebugNavigateToScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugNavigateTo'
>;

const DebugNavigateToScreen = buildScreen<DebugNavigateToScreenProps>(
  { name: 'DebugNavigateTo' },
  () => {
    const t = useTheme();

    const isAdmin = useIsAdmin();

    const [username, setUsername] = React.useState<string>('');
    const [warpcastPath, setWarpcastPath] = React.useState<string>('');

    const push = usePush();
    const navigate = useNavigate();
    const navigateToUserProfile = useNavigateToUserProfile();
    const { showGlobalPrompt } = useGlobalPrompts();
    const { setOpenMiniApp } = useMinimizedMiniApp();

    return (
      <View style={[t.hFull, t.pX4]}>
        <View style={[t.mB2]}>
          <TextInput
            onChangeText={setUsername}
            value={username}
            placeholder={'Fid to navigate to'}
          />
          <AtomsButton
            size="l"
            onPress={() => {
              navigateToUserProfile({ fid: Number(username) });
            }}
          >
            Navigate
          </AtomsButton>
        </View>
        <View>
          <TextInput
            onChangeText={setWarpcastPath}
            value={warpcastPath}
            placeholder={
              'Farcaster path i.e. farcaster.xyz/~/channel/:channelKey'
            }
          />
          <AtomsButton
            size="l"
            onPress={() => {
              const parsedUrl = new URL(warpcastPath);
              const universalLinkResult = resolveUniversalLink({
                url: parsedUrl.href,
                pathname: parsedUrl.pathname,
                searchParams: parsedUrl.searchParams,
              });
              if (universalLinkResult) {
                if (universalLinkResult.type === 'prompt') {
                  showGlobalPrompt({
                    key: universalLinkResult.key,
                    globalPromptData: universalLinkResult.globalPromptData,
                  });
                } else if (universalLinkResult.type === 'mini_app') {
                  setOpenMiniApp(universalLinkResult.props);
                } else {
                  const pushOrNavigate =
                    universalLinkResult.type === 'push' ? push : navigate;
                  return pushOrNavigate(
                    universalLinkResult.name,
                    universalLinkResult.params,
                  );
                }
              }
            }}
          >
            Navigate
          </AtomsButton>
          <AtomsButton
            size="l"
            style={[t.mT2]}
            onPress={() => {
              openInbox({ removeText: true });
            }}
          >
            Open email app
          </AtomsButton>
        </View>
        {isAdmin && (
          <View style={[t.flex1, t.mT2]}>
            <Text
              style={[t.texts.primary, t.textXl, t.fontSemibold, t.mT4, t.mB2]}
            >
              Onboarding
            </Text>
          </View>
        )}
      </View>
    );
  },
);

DebugNavigateToScreen.displayName = 'DebugNavigateToScreen';

export { DebugNavigateToScreen };
