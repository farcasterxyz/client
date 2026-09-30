import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';

import { ShareIcon } from '~/components/icons/ShareIcon';
import { Text2 } from '~/components/Text';
import { inAppBrowserHeaderHeight } from '~/constants/MiniApp';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  buildGoogleFaviconUrl,
  getDomain,
  isFaviconCached,
  markFaviconLoaded,
} from '~/utils/FaviconUtils';

type BrowserChromeProps = {
  origin?: string;
  onBack: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onOpenMenu?: () => void;
  onShare?: () => void;
  onClose: () => void;
};

export function BrowserChrome({
  origin,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
  onOpenMenu,
  onShare,
  onClose,
}: BrowserChromeProps) {
  const t = useTheme();
  const [faviconFailed, setFaviconFailed] = useState(false);

  const cleanOrigin = origin
    ? origin.replace(/^(https?:\/\/)?(www\.)?/, '')
    : '';

  const domain = useMemo(() => (origin ? getDomain(origin) : null), [origin]);

  const faviconUrl = useMemo(() => {
    if (!domain) {
      return '';
    }
    return buildGoogleFaviconUrl(domain);
  }, [domain]);

  useEffect(() => {
    if (domain && isFaviconCached(domain)) {
      setFaviconFailed(false);
      return;
    }
    setFaviconFailed(false);
  }, [faviconUrl, domain]);

  return (
    <View
      style={[
        {
          height: inAppBrowserHeaderHeight,
          backgroundColor: t.colors.bgNewLightGray,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 12,
        },
      ]}
    >
      {/* Drag handle */}
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: t.colors.border.tertiary,
          alignSelf: 'center',
          marginTop: 6,
          marginBottom: 8,
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Actions Group */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            disabled={!canGoBack}
            onPress={onBack}
            hitSlop={hitSlop}
            activeOpacity={0.6}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.bgDefault,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather
              name="arrow-left"
              size={18}
              color={canGoBack ? t.colors.text.primary : t.colors.text.tertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canGoForward}
            onPress={onForward}
            hitSlop={hitSlop}
            activeOpacity={0.6}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.bgDefault,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather
              name="arrow-right"
              size={18}
              color={
                canGoForward ? t.colors.text.primary : t.colors.text.tertiary
              }
            />
          </TouchableOpacity>
        </View>

        {/* Center URL capsule */}
        <View
          style={{
            flex: 1,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.colors.bgDefault,
            marginHorizontal: 8,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
          }}
        >
          {/* Favicon / Globe icon */}
          {!faviconFailed && faviconUrl ? (
            <Image
              source={{ uri: faviconUrl }}
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                marginRight: 6,
              }}
              onLoad={() => domain && markFaviconLoaded(domain)}
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <Feather
              name="globe"
              size={16}
              color={t.colors.text.secondary}
              style={{ marginRight: 6 }}
            />
          )}

          {/* Domain name */}
          <Text2
            numberOfLines={1}
            style={{
              flex: 1,
              textAlign: 'center',
              color: t.colors.text.primary,
              fontSize: 14,
            }}
          >
            {cleanOrigin || 'Unknown origin'}
          </Text2>

          {/* Three dots inside URL bar */}
          {onOpenMenu ? (
            <TouchableOpacity
              onPress={onOpenMenu}
              hitSlop={hitSlop}
              activeOpacity={0.6}
              style={{ marginLeft: 6 }}
            >
              <Feather
                name="more-horizontal"
                size={16}
                color={t.colors.text.secondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Right Actions Group */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Share/Menu button */}
          {onShare || onOpenMenu ? (
            <TouchableOpacity
              onPress={onShare ?? onOpenMenu}
              hitSlop={hitSlop}
              activeOpacity={0.6}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.colors.bgDefault,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShareIcon size={18} color={t.colors.text.primary} />
            </TouchableOpacity>
          ) : null}

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={hitSlop}
            activeOpacity={0.6}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.bgDefault,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="x" size={18} color={t.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
