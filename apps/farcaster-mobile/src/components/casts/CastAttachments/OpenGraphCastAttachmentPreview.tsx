import { Octicons } from '@expo/vector-icons';
import {
  ApiCast,
  ApiCastUrlEmbed,
  ApiFrameEmbedNextExtended,
  isDomainOrSubdomain,
  isExactDomain,
} from 'farcaster-client-data';
import {
  DEFAULT_CAST_FID,
  DEFAULT_CAST_HASH,
  isSnapEmbed,
  useCastAttachmentPreviewCache,
  useFetchCastAttachment,
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
} from 'farcaster-client-hooks';
import isEqual from 'lodash/isEqual';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { FrameEmbedAttachment } from '~/components/casts/CastAttachments/FrameAttachment';
import { OpenGraphCastAttachment } from '~/components/casts/CastAttachments/OpenGraphCastAttachment';
import { SnapEmbedAttachment } from '~/components/Snap/SnapEmbedAttachment';
import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/spaces/SpaceEmbedAttachment';
import { hitSlopLg } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { getOpenGraphType } from '~/utils/UrlUtils';

import { ArticleAttachment } from './ArticleAttachment';
import { ChannelAttachment } from './ChannelAttachment';
import { DeprecatedFrameBanner } from './DeprecatedFrameBanner';
import { QuoteTweet } from './QuoteTweet';
import { TokenEmbed } from './Token';

interface OpenGraphCastAttachmentPreviewProps {
  urls: string[] | undefined;
  removePreviewPressCallback: ({ url }: { url: string }) => void;
  refreshable: boolean;
  onRefreshPress: (url: string) => void;
}

const OpenGraphCastAttachmentPreview: FC<
  OpenGraphCastAttachmentPreviewProps
> = ({ urls, removePreviewPressCallback, refreshable, onRefreshPress }) => {
  const t = useTheme();

  // Create a default cast object for preview context
  const defaultCast = useMemo<ApiCast>(
    () => ({
      author: {
        fid: DEFAULT_CAST_FID,
        username: '',
        displayName: '',
        profile: { bio: { text: '', mentions: [] } },
        followerCount: 0,
        followingCount: 0,
      },
      hash: DEFAULT_CAST_HASH,
      threadHash: DEFAULT_CAST_HASH,
      timestamp: Date.now(),
      text: '',
      replies: { count: 0 },
      reactions: { count: 0 },
      recasts: { count: 0 },
      watches: { count: 0 },
    }),
    [],
  );

  const fetchCastEmbed = useFetchCastAttachment();
  const checkCastAttachmentPreviewCache = useCastAttachmentPreviewCache();

  const [embeds, setEmbeds] = useState<ApiCastUrlEmbed[]>();

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const preview = async () => {
      if (typeof urls === 'undefined' || urls.length === 0) {
        setEmbeds(undefined);
        return;
      }

      const alreadyCachedUrlEmbeds = [];
      for (const url of urls) {
        const previewCacheResult = checkCastAttachmentPreviewCache({
          previewUrl: url,
        });
        if (typeof previewCacheResult !== 'undefined') {
          alreadyCachedUrlEmbeds.push(previewCacheResult);
        }
      }

      if (alreadyCachedUrlEmbeds.length === urls.length) {
        setEmbeds(alreadyCachedUrlEmbeds);
        return;
      }

      const data = await fetchCastEmbed({
        embeds: urls,
      });
      if (data === null) {
        // eslint-disable-next-line no-console
        console.warn(
          `data was null: OpenGraphCastAttachmentPreview:fetchCastEmbeds({ embeds: ${urls} })`,
        );
      }
      const {
        responseData: { result },
        embeds: resolvedEmbeds,
      } = data;
      if (isEqual(resolvedEmbeds, urls)) {
        const openGraphEmbeds = result.embeds?.urls;

        if (openGraphEmbeds?.length !== 0) {
          setEmbeds(openGraphEmbeds);
        }
      }
    };

    if (urls?.length !== 0) {
      preview();
    } else {
      setEmbeds(undefined);
    }
  }, [checkCastAttachmentPreviewCache, fetchCastEmbed, urls]);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: embeds ? 1 : 0,
      useNativeDriver: true,
      duration: 300,
    }).start();
  }, [opacity, embeds]);

  const renderContent = React.useCallback(
    ({ embed }: { embed: ApiCastUrlEmbed }) => {
      const openGraphAttachment = embed.openGraph;

      const ogType = getOpenGraphType({
        domain: openGraphAttachment.domain,
        url: openGraphAttachment.url,
      });

      if (
        openGraphAttachment &&
        openGraphAttachment.frameEmbedNext &&
        openGraphAttachment.frameEmbedNext.frameEmbed
      ) {
        return (
          <ComposerFrameEmbed
            cast={defaultCast}
            frameEmbed={openGraphAttachment.frameEmbedNext}
            refreshable={refreshable}
            onRefreshPress={() => onRefreshPress(openGraphAttachment.url)}
            removeUrlEmbed={removePreviewPressCallback}
            url={openGraphAttachment.url}
          />
        );
      }

      if (
        openGraphAttachment &&
        openGraphAttachment.image &&
        openGraphAttachment.domain &&
        openGraphAttachment.frame
      ) {
        return <DeprecatedFrameBanner />;
      }

      if (openGraphAttachment && openGraphAttachment.channel) {
        return <ChannelAttachment og={openGraphAttachment} disabled={true} />;
      }

      if (
        openGraphAttachment.domain &&
        (isDomainOrSubdomain(openGraphAttachment.domain, 'twitter.com') ||
          isExactDomain(openGraphAttachment.domain, 'x.com')) &&
        openGraphAttachment.title &&
        openGraphAttachment.description
      ) {
        return (
          <View style={[t.relative]}>
            <QuoteTweet
              title={openGraphAttachment.title!}
              url={openGraphAttachment.url}
              tweet={openGraphAttachment.description!}
              variant={'default'}
              tweetPayload={embed.tweet}
              disabled={true}
            />
            <Pressable
              style={[
                t.bgDefaultDark,
                t.itemsCenter,
                t.roundedFull,
                t.absolute,
                t.right0,
                t.top0,
                t.mT2,
                t.mR2,
                t.p1,
                { width: 26 },
              ]}
              hitSlop={hitSlopLg}
              onPress={() => {
                removePreviewPressCallback({ url: openGraphAttachment.url });
              }}
            >
              <Octicons name="x" size={18} color={t.colors.text.light} />
            </Pressable>
          </View>
        );
      }

      if (
        openGraphAttachment &&
        embed &&
        typeof embed.tokenV2 !== 'undefined' &&
        ogType === 'token'
      ) {
        return (
          <View style={[t.relative]}>
            <TokenEmbed token={embed.tokenV2} disabled={true} />
            <Pressable
              style={[
                t.bgDefaultDark,
                t.itemsCenter,
                t.roundedFull,
                t.absolute,
                t.right0,
                t.top0,
                t.mT2,
                t.mR2,
                t.p1,
                { width: 26 },
              ]}
              hitSlop={hitSlopLg}
              onPress={() => {
                removePreviewPressCallback({ url: openGraphAttachment.url });
              }}
            >
              <Octicons name="x" size={18} color={t.colors.text.light} />
            </Pressable>
          </View>
        );
      }

      if (openGraphAttachment && embed && ogType === 'news') {
        return (
          <View style={[t.relative]}>
            <ArticleAttachment og={openGraphAttachment} disabled={true} />
            <Pressable
              style={[
                t.bgDefaultDark,
                t.itemsCenter,
                t.roundedFull,
                t.absolute,
                t.right0,
                t.top0,
                t.mT2,
                t.mR2,
                t.p1,
                { width: 26 },
              ]}
              hitSlop={hitSlopLg}
              onPress={() => {
                removePreviewPressCallback({ url: openGraphAttachment.url });
              }}
            >
              <Octicons name="x" size={18} color={t.colors.text.light} />
            </Pressable>
          </View>
        );
      }

      if (matchSpaceUrl(openGraphAttachment.url)) {
        return (
          <View style={[t.relative]}>
            <SpaceEmbedAttachment url={openGraphAttachment.url} />
            <Pressable
              style={[
                t.bgDefaultDark,
                t.itemsCenter,
                t.roundedFull,
                t.absolute,
                t.right0,
                t.top0,
                t.mT2,
                t.mR2,
                t.p1,
                { width: 26 },
              ]}
              hitSlop={hitSlopLg}
              onPress={() => {
                removePreviewPressCallback({ url: openGraphAttachment.url });
              }}
            >
              <Octicons name="x" size={18} color={t.colors.text.light} />
            </Pressable>
          </View>
        );
      }

      return (
        <View style={[t.relative]}>
          {/*
           * Key on `embed.openGraph.url` so React remounts on URL change
           * rather than reusing the instance. `useFetchSnap`'s local state
           * would otherwise briefly render the previous URL's snap payload
           * while the effect catches up — visible when the user removes /
           * reorders URLs in the composer preview list (which is keyed
           * by index upstream).
           */}
          {isSnapEmbed(embed) ? (
            <SnapEmbedAttachment key={embed.openGraph.url} embed={embed} />
          ) : (
            <OpenGraphCastAttachment
              key={embed.openGraph.url}
              urlEmbed={embed}
              disabled={true}
            />
          )}
          <Pressable
            style={[
              t.bgDefaultDark,
              t.itemsCenter,
              t.roundedFull,
              t.absolute,
              t.left0,
              t.top0,
              t.mT3,
              t.mL2,
              t.p1,
              { width: 26 },
            ]}
            hitSlop={hitSlopLg}
            onPress={() => {
              removePreviewPressCallback({ url: openGraphAttachment.url });
            }}
          >
            <Octicons name="x" size={18} color={t.colors.text.light} />
          </Pressable>
        </View>
      );
    },
    [
      defaultCast,
      onRefreshPress,
      refreshable,
      removePreviewPressCallback,
      t.absolute,
      t.bgDefaultDark,
      t.colors.text.light,
      t.itemsCenter,
      t.left0,
      t.mL2,
      t.mR2,
      t.mT2,
      t.mT3,
      t.p1,
      t.relative,
      t.right0,
      t.roundedFull,
      t.top0,
    ],
  );

  if (!embeds) {
    return null;
  }

  return (
    <Animated.View style={[t.wFull, t.flexCol, { opacity, gap: 8 }]}>
      {embeds.map((embed, index) => (
        <View key={index}>{renderContent({ embed })}</View>
      ))}
    </Animated.View>
  );
};

function ComposerFrameEmbed({
  cast,
  frameEmbed,
  refreshable,
  onRefreshPress,
  removeUrlEmbed,
  url,
}: {
  cast: ApiCast;
  frameEmbed: ApiFrameEmbedNextExtended;
  refreshable: boolean;
  onRefreshPress: () => void;
  removeUrlEmbed: ({ url }: { url: string }) => void;
  url: string;
}) {
  const t = useTheme();

  const domain = useMemo(() => {
    try {
      return new URL(frameEmbed.frameUrl).hostname;
    } catch {
      return '';
    }
  }, [frameEmbed.frameUrl]);

  const { data } = useNonSuspenseFrameDetails({ domain, enabled: !!domain });
  const frame = useGloballyCachedFrame(data);

  useEffect(() => {
    if (frame?.harmful) {
      removeUrlEmbed({ url });
    }
  }, [frame?.harmful, removeUrlEmbed, url]);

  if (frame?.harmful) {
    return null;
  }

  return (
    <View style={[t.relative]}>
      <FrameEmbedAttachment
        cast={cast}
        frameEmbed={frameEmbed}
        disabled
        refreshable={refreshable}
        onRefreshPress={onRefreshPress}
      />
      <Pressable
        style={[
          t.bgDefaultDark,
          t.itemsCenter,
          t.roundedFull,
          t.absolute,
          t.left0,
          t.top0,
          t.mT2,
          t.mL2,
          t.p1,
          { width: 26 },
        ]}
        hitSlop={hitSlopLg}
        onPress={() => {
          removeUrlEmbed({ url });
        }}
      >
        <Octicons name="x" size={18} color={t.colors.text.light} />
      </Pressable>
    </View>
  );
}

export { OpenGraphCastAttachmentPreview };
