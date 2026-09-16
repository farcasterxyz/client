import { Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ApiCastEmbeds } from 'farcaster-client-data';
import { buildQuoteCastUrlSet, isQuoteCastUrl } from 'farcaster-client-hooks';
import React, { memo } from 'react';
import { Dimensions, Pressable, View } from 'react-native';

import { imageRequestHeaders } from '~/constants/Images';
import { hitSlopLg } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';

import { OpenGraphCastAttachmentPreview } from './OpenGraphCastAttachmentPreview';
import { QuoteCast } from './QuoteCast';

type ComposerImageEmbedProps = {
  imageUrl: string;
  sourceUrl: string;
  screenWidth: number;
  removeImageEmbed: ({ url }: { url: string }) => void;
};

const ComposerImageEmbed: React.FC<ComposerImageEmbedProps> = ({
  imageUrl,
  sourceUrl,
  screenWidth,
  removeImageEmbed,
}) => {
  const t = useTheme();
  const [aspectRatio, setAspectRatio] = React.useState<number>(1);

  return (
    <View
      style={[
        t.relative,
        { maxHeight: 318, width: screenWidth - 32 },
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.overflowHidden,
        t.bgElevated,
      ]}
    >
      <Image
        source={{ uri: imageUrl, headers: imageRequestHeaders }}
        style={{ width: '100%', height: undefined, aspectRatio }}
        cachePolicy="memory-disk"
        contentFit="contain"
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width > 0 && height > 0) {
            setAspectRatio(width / height);
          }
        }}
      />
      <Pressable
        accessibilityLabel="Remove image attachment"
        style={[
          t.directCasts.bgImagePreview,
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          t.absolute,
          t.right0,
          t.top0,
          t.mT1,
          t.mR1,
          { width: 24, height: 24 },
        ]}
        hitSlop={hitSlopLg}
        onPress={() => removeImageEmbed({ url: sourceUrl })}
      >
        <Octicons name="x" size={14} color={t.colors.text.light} />
      </Pressable>
    </View>
  );
};

type CastComposerEmbedsPreviewsProps = {
  processedEmbeds: ApiCastEmbeds | undefined;
  removeUrlEmbed: ({ url }: { url: string }) => void;
  removeImageEmbed: ({ url }: { url: string }) => void;
  refreshable: boolean;
  onRefreshPress: (url: string) => void;
};

const CastComposerEmbedsPreviews: React.FC<CastComposerEmbedsPreviewsProps> =
  memo(
    ({
      processedEmbeds: embeds,
      removeUrlEmbed,
      removeImageEmbed,
      refreshable,
      onRefreshPress,
    }) => {
      const t = useTheme();
      const { width: screenWidth } = Dimensions.get('window');

      const quotes = React.useMemo(
        () =>
          typeof embeds !== 'undefined' && typeof embeds.casts !== 'undefined'
            ? embeds.casts
            : [],
        [embeds],
      );

      const quoteCastUrls = React.useMemo(
        () => buildQuoteCastUrlSet({ quotes }),
        [quotes],
      );

      const urls = React.useMemo(() => {
        if (typeof embeds === 'undefined') {
          return [];
        }
        return (embeds.urls ?? []).filter(
          (urlEmbed) =>
            !isQuoteCastUrl({
              url: urlEmbed.openGraph.url,
              sourceUrl: urlEmbed.openGraph.sourceUrl,
              quoteCastUrls,
            }),
        );
      }, [embeds, quoteCastUrls]);

      const images = embeds?.images ?? [];

      return (
        <View style={[t.mX4, t.mT2, t.flex, t.flexCol, { gap: 8 }]}>
          {images.map((image) => (
            <ComposerImageEmbed
              key={image.sourceUrl}
              imageUrl={image.url}
              sourceUrl={image.sourceUrl}
              screenWidth={screenWidth}
              removeImageEmbed={removeImageEmbed}
            />
          ))}
          {urls.length !== 0 && (
            <OpenGraphCastAttachmentPreview
              refreshable={refreshable}
              onRefreshPress={onRefreshPress}
              urls={urls.map(({ openGraph }) => openGraph.url)}
              removePreviewPressCallback={removeUrlEmbed}
            />
          )}
          {quotes.map((cast, index) => (
            <View
              key={index}
              style={[
                { borderRadius: 12 },
                t.borderDesignSystemDefault,
                t.border,
                t.wFull,
              ]}
            >
              <QuoteCast cast={cast} />
            </View>
          ))}
        </View>
      );
    },
  );

export { CastComposerEmbedsPreviews };
