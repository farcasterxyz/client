import { Octicons } from '@expo/vector-icons';
import { ApiOpenGraphMetadata } from 'farcaster-client-data';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

type WarpcastSettingsAttachmentProps = {
  og: ApiOpenGraphMetadata;
  disabled: boolean;
  inversedTextColors?: boolean;
};

const WarpcastSettingsAttachment: React.FC<WarpcastSettingsAttachmentProps> = ({
  og,
  disabled,
  inversedTextColors,
}) => {
  const t = useTheme();
  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  return (
    <Pressable
      style={[
        t.flex,
        { borderRadius: 12 },
        t.borderDesignSystemDefault,
        t.border,
        t.flexRow,
        t.wFull,
        { height: 64 },
      ]}
      onPress={() => {
        if (disabled) {
          return;
        }

        possiblyNavigateOrOpenUrl({ url: og.url });
      }}
    >
      <View
        style={[
          t.bgHover,
          t.w16,
          t.h16,
          t.flex,
          t.roundedL,
          t.borderRHairline,
          t.borderDefault,
          t.itemsCenter,
          t.justifyCenter,
          t.flex,
        ]}
      >
        <Octicons name="gear" size={32} />
      </View>
      <View
        style={[t.flex, t.flex1, t.flexGrow, t.flexCol, t.p2, t.justifyCenter]}
      >
        <Text
          style={[
            t.fontMedium,
            inversedTextColors ? { color: '#ffffff' } : t.texts.primary,
          ]}
          numberOfLines={1}
        >
          {og.description}
        </Text>
        {og.description !== 'Manage your account preferences' && (
          <Text style={[t.texts.tertiary]} numberOfLines={2}>
            Update your settings
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export { WarpcastSettingsAttachment };
