import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { type ApiCastSnapEmbed } from 'farcaster-client-data';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { SnapEmbedAttachment } from '~/components/Snap/SnapEmbedAttachment';
import { SnapRenderer } from '~/components/Snap/SnapRenderer';
import {
  invalidateSnapCache,
  useFetchSnap,
} from '~/components/Snap/useFetchSnap';
import { Text2 } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { getStorage } from '~/utils/FastStorageUtils';
import { getSnapDiscoveryWarning } from '~/utils/getSnapDiscoveryWarning';

const STORAGE_KEY = 'devtools_snap_emulator.url';
const EMULATOR_PRIMARY_CAST_HASH = '0x0000000000000000000000000000000000011685';
const EMULATOR_FOLLOWING_CAST_HASH =
  '0x0000000000000000000000000000000000021685';

type PreviewMode = 'feed-lift' | 'renderer';

type DevToolsSnapEmulatorScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DevToolsSnapEmulator'
>;

/**
 * Fetches the snap for the active URL via `useFetchSnap` (same shared
 * module-level cache the feed uses). Each Load clears server-side embed/image
 * scrape caches (`scrapeEmbed`, `devToolsInspectImageUrl`), evicts the module
 * snap cache for this URL, then refetches. Reset additionally clears the URL
 * field and storage.
 */
function buildEmulatorSnapEmbed(url: string): ApiCastSnapEmbed {
  let domain: string | undefined;
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = undefined;
  }

  return {
    type: 'snap',
    url,
    sourceUrl: url,
    domain,
  };
}

const EmulatorSnapRendererView = React.memo(({ url }: { url: string }) => {
  const t = useTheme();
  const { snap, loading } = useFetchSnap({ url, enabled: true });

  if (loading && !snap) {
    return (
      <Text2 color="secondary" size="sm" style={[t.mT4]}>
        Loading snap…
      </Text2>
    );
  }

  if (!snap) {
    return (
      <Text2 color="secondary" size="sm" style={[t.mT4]}>
        Could not load snap from {url}. Check the URL, your snap server's
        response, and CORS headers.
      </Text2>
    );
  }

  return (
    <SnapRenderer
      key={url}
      snapUrl={url}
      initialSnap={snap}
      showOverflowWarning
    />
  );
});

EmulatorSnapRendererView.displayName = 'EmulatorSnapRendererView';

const EmulatorFeedLiftView = React.memo(({ url }: { url: string }) => {
  const t = useTheme();
  const snap = useMemo(() => buildEmulatorSnapEmbed(url), [url]);

  return (
    <View style={styles.feedHarness}>
      <View
        style={[styles.castHarness, { borderColor: t.colors.border.primary }]}
      >
        <Text2 weight="bold" size="sm">
          DevTools primary snap
        </Text2>
        <SnapEmbedAttachment
          snap={snap}
          castHash={EMULATOR_PRIMARY_CAST_HASH}
          castAuthorFid={1}
          enableLiftOnInteraction
        />
      </View>

      <View
        style={[styles.castHarness, { borderColor: t.colors.border.primary }]}
      >
        <Text2 weight="bold" size="sm">
          Following cast
        </Text2>
        <SnapEmbedAttachment
          snap={snap}
          castHash={EMULATOR_FOLLOWING_CAST_HASH}
          castAuthorFid={2}
          enableLiftOnInteraction
        />
      </View>
    </View>
  );
});

EmulatorFeedLiftView.displayName = 'EmulatorFeedLiftView';

const DevToolsSnapEmulatorScreen = buildScreen<DevToolsSnapEmulatorScreenProps>(
  { name: 'DevToolsSnapEmulator', avoidKeyboard: true },
  ({ route: { params } }) => {
    const t = useTheme();
    const { apiClient } = useFarcasterApiClient();

    const [urlInput, setUrlInput] = useState(
      () => params.url ?? getStorage().getString(STORAGE_KEY) ?? '',
    );
    const [activeUrl, setActiveUrl] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('feed-lift');
    const [discoveryWarning, setDiscoveryWarning] = useState<string | null>(
      null,
    );
    /** Bumps on each committed Load so `EmulatorSnapView` remounts; `useFetchSnap` only re-runs its effect when `url` changes, not when the module cache alone is cleared. */
    const [snapMountGeneration, setSnapMountGeneration] = useState(0);
    const [loadInFlight, setLoadInFlight] = useState(false);
    const discoveryProbeIdRef = useRef(0);
    const loadRequestIdRef = useRef(0);

    const handleLoad = useCallback(async () => {
      const trimmed = urlInput.trim();
      if (!trimmed) return;

      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          return;
        }
      } catch {
        return;
      }

      const requestId = ++loadRequestIdRef.current;
      setLoadInFlight(true);
      try {
        invalidateSnapCache(trimmed);
        await Promise.allSettled([
          apiClient.scrapeEmbed({ embed: trimmed }),
          apiClient.devToolsInspectImageUrl({ url: trimmed }),
        ]);

        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        getStorage().set(STORAGE_KEY, trimmed);
        setSnapMountGeneration((n) => n + 1);
        setActiveUrl(trimmed);
        setDiscoveryWarning(null);
        const probeId = ++discoveryProbeIdRef.current;
        void getSnapDiscoveryWarning(trimmed, apiClient).then((warning) => {
          if (probeId === discoveryProbeIdRef.current) {
            setDiscoveryWarning(warning);
          }
        });
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setLoadInFlight(false);
        }
      }
    }, [apiClient, urlInput]);

    const handleReset = useCallback(() => {
      // Evict the cached snap for the current URL so the next Load refetches
      // fresh from the server — devs iterating on their snap need to see
      // their latest changes, not a stale payload.
      if (activeUrl) {
        invalidateSnapCache(activeUrl);
      }
      setUrlInput('');
      setActiveUrl(null);
      loadRequestIdRef.current += 1;
      setLoadInFlight(false);
      discoveryProbeIdRef.current += 1;
      setDiscoveryWarning(null);
      getStorage().delete(STORAGE_KEY);
    }, [activeUrl]);

    return (
      <ScrollView
        contentContainerStyle={[t.p3, { gap: 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text2 weight="semibold" size="xs" color="secondary" style={[t.mB1]}>
          Snap URL
        </Text2>
        <TextInput
          onChangeText={(val) => setUrlInput(val.trim())}
          value={urlInput}
          numberOfLines={2}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          inputStyle={[t.textSm]}
          placeholder="https://example.com/snap"
        />
        <View style={[t.flexRow, { gap: 4 }]}>
          <ButtonV2
            title="Reset"
            onPress={handleReset}
            variant="secondary"
            width="flex1"
          />
          <ButtonV2
            title="Load"
            onPress={handleLoad}
            width="flex1"
            disabled={!urlInput.trim() || loadInFlight}
          />
        </View>
        <View style={[t.flexRow, { gap: 4 }]}>
          <ButtonV2
            title="Feed lift"
            onPress={() => setPreviewMode('feed-lift')}
            variant={previewMode === 'feed-lift' ? 'primary' : 'secondary'}
            width="flex1"
          />
          <ButtonV2
            title="Renderer"
            onPress={() => setPreviewMode('renderer')}
            variant={previewMode === 'renderer' ? 'primary' : 'secondary'}
            width="flex1"
          />
        </View>

        {discoveryWarning ? (
          <Text2 color="warning" size="sm" style={[t.mT1]}>
            {discoveryWarning}
          </Text2>
        ) : null}

        {activeUrl ? (
          <View style={[t.mT2]}>
            {previewMode === 'feed-lift' ? (
              <EmulatorFeedLiftView
                key={`${activeUrl}:${snapMountGeneration}:feed`}
                url={activeUrl}
              />
            ) : (
              <EmulatorSnapRendererView
                key={`${activeUrl}:${snapMountGeneration}:renderer`}
                url={activeUrl}
              />
            )}
          </View>
        ) : (
          <Text2 color="secondary" size="sm" style={[t.mT4]}>
            Enter a snap URL and tap Load to preview.
          </Text2>
        )}
      </ScrollView>
    );
  },
);

DevToolsSnapEmulatorScreen.displayName = 'DevToolsSnapEmulatorScreen';

export { DevToolsSnapEmulatorScreen };

const styles = StyleSheet.create({
  feedHarness: {
    gap: 12,
  },
  castHarness: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingBottom: 12,
  },
});
