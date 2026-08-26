import { useUserPreference } from 'farcaster-client-hooks';
import { ButtonV2, Text2 } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';

function DebugCollectibleCastsScreenContent() {
  const t = useTheme();
  const [setting, setSetting] = useUserPreference({
    preference: 'collectibleCastsSetting',
  });
  const [bidIntro, setBidIntro] = useUserPreference({
    preference: 'showCollectibleCastBidIntro',
    defaultValue: false,
  });
  const [intro, setIntro] = useUserPreference({
    preference: 'showCollectibleCastIntro',
    defaultValue: false,
  });
  const [showServerSideArtifacts = false, setShowServerSideArtifacts] =
    useMMKVBoolean('debug-collectible-casts-show-server-side-artifacts');

  const showIntro = setting === 'no_selection';
  const showBidIntro = bidIntro;
  const showRedDot = intro;

  const resetCollectibleCastsIntro = useCallback(() => {
    setSetting('no_selection');
  }, [setSetting]);

  const resetCollectibleCastsBidIntro = useCallback(() => {
    setBidIntro(true);
  }, [setBidIntro]);

  const resetRedDot = useCallback(() => {
    setIntro(true);
  }, [setIntro]);

  const toggleServerSideArtifacts = useCallback(() => {
    setShowServerSideArtifacts(!showServerSideArtifacts);
  }, [setShowServerSideArtifacts, showServerSideArtifacts]);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 16,
      }}
    >
      <View style={{ gap: 24 }}>
        <View
          style={[
            {
              backgroundColor: t.colors.bgNewLightGray,
              borderRadius: 16,
              padding: 16,
              gap: 16,
            },
          ]}
        >
          <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
            <Text2>Intro Screen</Text2>
            <Text2 color={showIntro ? 'success' : 'secondary'} weight="medium">
              {showIntro ? 'Will Show' : 'Hidden'}
            </Text2>
          </View>

          <ButtonV2
            title="Reset Intro"
            onPress={resetCollectibleCastsIntro}
            variant="secondary"
            width="full"
            disabled={showIntro}
          />
        </View>
        <View
          style={[
            {
              backgroundColor: t.colors.bgNewLightGray,
              borderRadius: 16,
              padding: 16,
              gap: 16,
            },
          ]}
        >
          <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
            <Text2>Bid Intro Screen</Text2>
            <Text2
              color={showBidIntro ? 'success' : 'secondary'}
              weight="medium"
            >
              {showBidIntro ? 'Will Show' : 'Hidden'}
            </Text2>
          </View>

          <ButtonV2
            title="Reset Bid Intro"
            onPress={resetCollectibleCastsBidIntro}
            variant="secondary"
            width="full"
            disabled={bidIntro}
          />
        </View>

        <View
          style={[
            {
              backgroundColor: t.colors.bgNewLightGray,
              borderRadius: 16,
              padding: 16,
              gap: 16,
            },
          ]}
        >
          <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
            <Text2>Red Dot</Text2>
            <Text2 color={showRedDot ? 'success' : 'secondary'} weight="medium">
              {showRedDot ? 'Will Show' : 'Hidden'}
            </Text2>
          </View>

          <ButtonV2
            title="Reset Red Dot"
            onPress={resetRedDot}
            variant="secondary"
            width="full"
            disabled={showRedDot}
          />
        </View>

        <View
          style={[
            {
              backgroundColor: t.colors.bgNewLightGray,
              borderRadius: 16,
              padding: 16,
              gap: 16,
            },
          ]}
        >
          <View style={[t.flexRow, t.justifyBetween, t.itemsCenter]}>
            <Text2>Server-Side Artifacts</Text2>
            <Text2
              color={showServerSideArtifacts ? 'success' : 'secondary'}
              weight="medium"
            >
              {showServerSideArtifacts ? 'Enabled' : 'Disabled'}
            </Text2>
          </View>

          <ButtonV2
            title={showServerSideArtifacts ? 'Disable' : 'Enable'}
            onPress={toggleServerSideArtifacts}
            variant="secondary"
            width="full"
          />
        </View>
      </View>
    </ScrollView>
  );
}

export const DebugCollectibleCastsScreen = buildScreen(
  { name: 'DebugCollectibleCasts', insetBottom: true },
  DebugCollectibleCastsScreenContent,
);
