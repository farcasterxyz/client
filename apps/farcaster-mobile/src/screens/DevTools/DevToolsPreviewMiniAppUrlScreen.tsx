import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiFrame,
  ApiValidateFrameEmbedV2200Response,
} from 'farcaster-client-data';
import {
  isValidUrl,
  useDevToolsManagedApps,
  useValidateFrameEmbedV2,
} from 'farcaster-client-hooks';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { FrameIconImage } from '~/components/FrameIconImage';
import { FrameEmbedNext } from '~/components/Frames/FrameEmbedNext';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { CommonStackParamList } from '~/types';
import { getStorage } from '~/utils/FastStorageUtils';
import { sanitizeUrl } from '~/utils/UrlUtils';

type DevToolsPreviewMiniAppUrlScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DevToolsPreviewMiniAppUrl'
>;

const DevToolsPreviewMiniAppUrlScreen =
  buildScreen<DevToolsPreviewMiniAppUrlScreenProps>(
    { name: 'DevToolsPreviewMiniAppUrl', avoidKeyboard: true },
    ({ route: { params } }) => {
      const t = useTheme();

      const validateFrameEmbed = useValidateFrameEmbedV2();

      const [input, setInput] = useState(
        () =>
          params.url ?? getStorage().getString('debug_frame_embed.url') ?? '',
      );

      const [result, setResult] =
        useState<ApiValidateFrameEmbedV2200Response['result']>();

      const reset = () => {
        setInput('');
        setResult(undefined);
        getStorage().delete('debug_frame_embed.url');
      };

      const preview = async () => {
        setResult(undefined);
        if (input) {
          const sanitized = sanitizeUrl(input);
          setInput(sanitized);
          getStorage().set('debug_frame_embed.url', sanitized);

          try {
            const res = await validateFrameEmbed({ url: sanitized });
            setResult(res.result);
          } catch (e) {
            setResult({});
            alert('Failed to fetch frame');
          }
        }
      };

      const launchFrame = useLaunchFrame();
      const launch = () => {
        if (input) {
          launchFrame({
            context: {
              type: 'dev_preview',
            },
            config: {
              name: 'Playground',
              url: input,
            },
            debug: true,
          });

          getStorage().set('debug_app_frame.url', input);
        }
      };

      const isValid = useMemo(() => isValidUrl(sanitizeUrl(input)), [input]);

      const { flatData: ownedApps } = useDevToolsManagedApps();

      const renderOwnedApp = ({ item }: { item: ApiFrame }) => (
        <Pressable
          onPress={() => setInput(item.homeUrl)}
          style={[t.itemsCenter, t.pX2, { gap: 4 }]}
        >
          <FrameIconImage imageUrl={item.iconUrl} size={56} />
          <Text2
            size="xs"
            color="secondary"
            numberOfLines={1}
            style={[{ textAlign: 'center', width: 56 }]}
          >
            {item.name}
          </Text2>
        </Pressable>
      );

      return (
        <ScrollView contentContainerStyle={[t.p3, { gap: 12 }]}>
          {ownedApps && ownedApps.length > 0 && (
            <View style={[{ gap: 16 }]}>
              <Text2 weight="semibold" size="xs" color="secondary">
                Your apps
              </Text2>
              <FlatList
                horizontal
                data={ownedApps}
                keyExtractor={(item) => item.domain}
                renderItem={renderOwnedApp}
                showsHorizontalScrollIndicator={false}
                scrollEnabled
              />
            </View>
          )}
          <Text2 weight="semibold" size="xs" color="secondary" style={[t.mB1]}>
            URL
          </Text2>
          <TextInput
            onChangeText={(val) => setInput(val.trim())}
            value={input}
            numberOfLines={2}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            inputStyle={[t.textSm]}
          />
          <View style={[t.flexRow, { gap: 4 }]}>
            <ButtonV2
              title="Reset"
              onPress={reset}
              variant="secondary"
              width="flex1"
            />
            <ButtonV2
              title="Preview"
              onPress={preview}
              width="flex1"
              disabled={!isValid}
            />
          </View>
          {result && (
            <View style={[t.pY2, { gap: 8 }]}>
              {result.frameEmbedNext ? (
                <>
                  <Text2
                    weight="semibold"
                    size="xs"
                    color="secondary"
                    style={[t.mB1]}
                  >
                    Embed
                  </Text2>
                  <FrameEmbedNext
                    frameEmbed={result.frameEmbedNext}
                    context={{
                      type: 'dev_preview',
                    }}
                    debug
                  />
                  {result.frameEmbedNext.frameUrl !== input && (
                    <View style={[t.mT2]}>
                      <ButtonV2
                        title="Open URL"
                        onPress={launch}
                        width="flex1"
                        variant="secondary"
                      />
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text2 color="secondary">No embed found</Text2>
                  <ButtonV2
                    title="Open URL"
                    onPress={launch}
                    width="flex1"
                    variant="secondary"
                  />
                </>
              )}
            </View>
          )}
        </ScrollView>
      );
    },
  );

DevToolsPreviewMiniAppUrlScreen.displayName = 'DevToolsPreviewMiniAppUrlScreen';

export { DevToolsPreviewMiniAppUrlScreen };
