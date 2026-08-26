import { Octicons } from '@expo/vector-icons';
import { ApiUserCastAction } from 'farcaster-client-data';
import React, { useCallback } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { ToastProps } from 'react-native-toast-notifications/lib/typescript/toast';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';
import { getWarpcastParsedUrl } from '~/utils/UrlUtils';

interface CastActionToastProps extends ToastProps {
  data?: { castAction: ApiUserCastAction; link?: string };
}

const CastActionToast: React.FC<CastActionToastProps> = ({ message, data }) => {
  const t = useTheme();

  const navigate = usePossiblyNavigateOrOpenUrl();

  const icon = data?.castAction.octicon ?? 'apps';
  const link = data?.link;

  const onPress = useCallback(() => {
    if (link) {
      const warpcastUrl = getWarpcastParsedUrl(link);

      if (typeof warpcastUrl !== 'undefined') {
        navigate({ url: link, openExternalInBrowser: true });
      } else {
        Linking.openURL(link);
      }
    }
  }, [link, navigate]);

  return (
    <Pressable
      style={[
        t.p4,
        t.bgMuted,
        { borderRadius: t.borderRadiuses.$12 },
        t.borderDefault,
        t.border,
        t.flex,
        t.flexCol,
        t.mB1,
        { maxWidth: '80%' },
        t.relative,
      ]}
      onPress={onPress}
    >
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter]}>
        <Octicons
          name={icon as keyof typeof Octicons.glyphMap}
          size={18}
          style={[{ color: t.colors.text.success }, t.mR4]}
        />
        <Text style={[t.texts.primary, t.flexShrink]} numberOfLines={2}>
          {message}
        </Text>
        {link && (
          <Octicons
            name="link-external"
            size={14}
            style={[{ color: t.colors.text.tertiary }, t.mL4]}
          />
        )}
      </View>
    </Pressable>
  );
};

export { CastActionToast };
