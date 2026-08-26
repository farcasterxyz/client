import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { RemoteImage } from '../RemoteImage';

export type MiniAppIconSize =
  | 16
  | 24
  | 32
  | 36
  | 40
  | 44
  | 48
  | 56
  | 64
  | 72
  | 80;

interface MiniAppIconProps {
  imageUrl: string;
  size: MiniAppIconSize;
  skipAutoRounding?: boolean;
}

const BORDER_WIDTH = 0.5;

const MiniAppIcon: React.FC<MiniAppIconProps> = ({
  imageUrl,
  size,
  skipAutoRounding = false,
}) => {
  const t = useTheme();
  const borderRadius = useMemo(() => {
    if (skipAutoRounding) {
      return undefined;
    }

    return size / 5;
  }, [size, skipAutoRounding]);

  const containerStyle: ViewStyle = useMemo(
    () => ({
      borderRadius,
      borderWidth: skipAutoRounding ? undefined : BORDER_WIDTH,
      overflow: 'hidden',
      borderColor: skipAutoRounding ? undefined : t.colors.borderDefault,
    }),
    [borderRadius, skipAutoRounding, t.colors.borderDefault],
  );

  const placeholder = useMemo(
    () => (
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          borderWidth: skipAutoRounding ? undefined : BORDER_WIDTH,
          borderColor: skipAutoRounding ? undefined : t.colors.borderDefault,
          backgroundColor: t.colors.elevated,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Ionicons
          name="image-outline"
          size={size * 0.45}
          color={t.colors.text.secondary}
        />
      </View>
    ),
    [
      borderRadius,
      skipAutoRounding,
      size,
      t.colors.borderDefault,
      t.colors.elevated,
      t.colors.text.secondary,
    ],
  );

  if (!imageUrl) {
    return placeholder;
  }

  return (
    <View style={containerStyle}>
      <RemoteImage
        recyclingKey={imageUrl}
        uri={imageUrl}
        width={size}
        height={size}
        fallback={placeholder}
        // Mini-app icon URLs come from third-party developer manifests, so
        // they're regularly rejected by Cloudflare's image proxy (.ico
        // favicons, SPA hosts that return HTML for missing assets, etc.).
        // Fall back to the raw URL so expo-image still gets a shot at
        // decoding before we show the placeholder. Safe here because the
        // icon is rendered at a small bounded `size`.
        shouldAttemptToUncloudifyOnError
        containerStyle={[{ borderRadius, width: size, height: size }]}
      />
    </View>
  );
};
MiniAppIcon.displayName = 'MiniAppIcon';

export { MiniAppIcon };
