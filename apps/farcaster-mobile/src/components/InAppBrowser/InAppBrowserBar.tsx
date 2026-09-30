import { AnimatedPressable, TypographyBody } from 'farcaster-expo';
import { Globe, X } from 'lucide-react-native';
import * as React from 'react';
import { Image, Platform, View } from 'react-native';

import { useMinimizedInAppBrowser } from '~/contexts/MinimizedInAppBrowserProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  buildGoogleFaviconUrl,
  getDomain,
  isFaviconCached,
  markFaviconLoaded,
} from '~/utils/FaviconUtils';

export type InAppBrowserBarProps = {
  origin: string;
  url: string;
  title?: string;
};

function InAppBrowserBar(props: InAppBrowserBarProps) {
  const { origin, title } = props;
  const t = useTheme();
  const [faviconFailed, setFaviconFailed] = React.useState(false);
  const { closeInAppBrowser, maximizeInAppBrowser } =
    useMinimizedInAppBrowser();

  const displayName = title && title.length > 0 ? title : origin;
  const domain = React.useMemo(() => getDomain(origin), [origin]);

  const faviconUrl = React.useMemo(() => {
    if (!domain) {
      return undefined;
    }
    return buildGoogleFaviconUrl(domain);
  }, [domain]);

  React.useEffect(() => {
    if (domain && isFaviconCached(domain)) {
      setFaviconFailed(false);
      return;
    }
    setFaviconFailed(false);
  }, [faviconUrl, domain]);

  return (
    <AnimatedPressable
      onPress={maximizeInAppBrowser}
      style={[
        {
          height: 56,
        },
        t.flex,
        t.itemsCenter,
        t.flexRow,
        t.border,
        t.borders.secondary,
        t.mX2,
        t.mT3,
        { borderRadius: 12 },
        Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
        { backgroundColor: t.colors.background.secondary },
      ]}
      disableAnimation={Platform.OS === 'android'}
    >
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.wFull,
          t.pX3,
        ]}
      >
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.gap2,
            { minWidth: 0, flexShrink: 1 },
          ]}
        >
          <View
            style={[
              t.overflowHidden,
              t.roundedFull,
              t.border,
              t.borders.primary,
              t.itemsCenter,
              t.justifyCenter,
              { width: 32, height: 32, backgroundColor: t.colors.bgDefault },
            ]}
          >
            {!faviconFailed && faviconUrl ? (
              <Image
                source={{ uri: faviconUrl }}
                style={{ width: 32, height: 32 }}
                onLoad={() => domain && markFaviconLoaded(domain)}
                onError={() => setFaviconFailed(true)}
              />
            ) : (
              <Globe color={t.colors.text.primary} size={18} />
            )}
          </View>
          <View
            style={[t.flex, t.flexCol, { minWidth: 0, flexShrink: 1, gap: 2 }]}
          >
            <TypographyBody
              label="Medium/Strong"
              color="primary"
              numberOfLines={1}
            >
              {displayName}
            </TypographyBody>
            <TypographyBody label="Small" color="tertiary" numberOfLines={1}>
              {origin}
            </TypographyBody>
          </View>
        </View>
        <AnimatedPressable
          onPress={closeInAppBrowser}
          disableAnimation={Platform.OS === 'android'}
          hitSlop={12}
          style={[
            t.roundedFull,
            t.itemsCenter,
            t.justifyCenter,
            {
              flexShrink: 0,
              marginLeft: 8,
              width: 36,
              height: 36,
            },
          ]}
        >
          <X color={t.colors.text.secondary} size={24} />
        </AnimatedPressable>
      </View>
    </AnimatedPressable>
  );
}

export { InAppBrowserBar };
