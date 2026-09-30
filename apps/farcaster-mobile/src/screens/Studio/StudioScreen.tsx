import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import { ScreenTitle } from 'farcaster-expo';
import { X } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

import { MiniApp } from '~/components/MiniApp/MiniApp';
import { MiniAppWrapper } from '~/components/MiniApp/MiniAppWrapper';
import { buildScreen } from '~/components/Screen';
import { topBarHeight, useTopBar } from '~/components/TopBar';
import { MinimizedMiniAppProvider } from '~/contexts/MinimizedMiniAppProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { AppsHomeStackParamList } from '~/types';

const NEYNAR_STUDIO_URL = 'https://ai.neynar.com/studio-mini';

type StudioScreenProps = NativeStackScreenProps<
  AppsHomeStackParamList,
  'Studio'
>;

const StudioScreen = buildScreen<StudioScreenProps>(
  { name: 'Studio', insetTop: true },
  () => <StudioScreenContent />,
);

StudioScreen.displayName = 'StudioScreen';

const context = {
  type: 'launcher' as const,
};

const StudioScreenContent: React.FC = React.memo(() => {
  const t = useTheme();
  const navigation = useNavigation();
  const { apiClient } = useFarcasterApiClient();
  const [emailResult, setEmailResult] = React.useState<{
    resolved: boolean;
    email?: string;
  }>({ resolved: false });

  React.useEffect(() => {
    let cancelled = false;
    apiClient
      .getAuthenticatedUserEmail()
      .then((response) => {
        if (!cancelled) {
          setEmailResult({
            resolved: true,
            email: response.data.result.email,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEmailResult({ resolved: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const launchConfig = React.useMemo(
    () => ({
      type: 'standalone' as const,
      url: NEYNAR_STUDIO_URL,
      name: 'Studio',
      timestamp: 0,
      queryParams: {
        ...(emailResult.email ? { email: emailResult.email } : undefined),
        hideNav: 'true',
        ref: 'create_button',
      },
    }),
    [emailResult.email],
  );

  const rightIcon = React.useMemo(
    () => (
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <X size={24} color={t.colors.text.secondary} />
      </Pressable>
    ),
    [navigation, t.colors.text.secondary],
  );

  const title = React.useMemo(() => <ScreenTitle title="Studio" />, []);
  const { topBar } = useTopBar({ title, rightIcon });

  return (
    <MinimizedMiniAppProvider MiniAppComponent={MiniApp}>
      <View style={[t.hFull, { backgroundColor: t.colors.background.default }]}>
        {topBar}
        <View style={[t.flex1, { marginTop: topBarHeight }]}>
          {emailResult.resolved ? (
            <MiniAppWrapper>
              <MiniApp
                launchConfig={launchConfig}
                context={context}
                hideHeader
              />
            </MiniAppWrapper>
          ) : null}
        </View>
      </View>
    </MinimizedMiniAppProvider>
  );
});

StudioScreenContent.displayName = 'StudioScreenContent';

export { StudioScreen };
