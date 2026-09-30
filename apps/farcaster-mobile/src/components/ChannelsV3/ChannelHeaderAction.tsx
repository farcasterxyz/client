import { Octicons } from '@expo/vector-icons';
import { ApiChannel } from 'farcaster-client-data';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { ExpandFrameIcon } from '~/components/images/ExpandFrameIcon';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

type ChannelHeaderActionProps = {
  headerAction: NonNullable<ApiChannel['headerAction']>;
  headerActionMetadata: ApiChannel['headerActionMetadata'] | undefined;
};

const ChannelHeaderAction: React.FC<ChannelHeaderActionProps> = React.memo(
  ({ headerAction, headerActionMetadata }) => {
    const t = useTheme();

    const navigate = usePossiblyNavigateOrOpenUrl();
    const launchFrame = useLaunchFrame();
    const onPress = React.useCallback(() => {
      if (typeof headerActionMetadata !== 'undefined') {
        if (
          headerActionMetadata.frameEmbedNext &&
          headerActionMetadata.frameEmbedNext.frameEmbed?.button &&
          (headerActionMetadata.frameEmbedNext.frameEmbed?.button?.action
            .type === 'launch_frame' ||
            headerActionMetadata.frameEmbedNext.frameEmbed?.button?.action
              .type === 'launch_miniapp')
        ) {
          launchFrame({
            config:
              headerActionMetadata.frameEmbedNext.frameEmbed?.button?.action,
            author: headerActionMetadata.frameEmbedNext.author,
            context: {
              type: 'dev_preview',
            },
          });
          return;
        }
      }

      navigate({ url: headerAction.target });
    }, [headerAction.target, headerActionMetadata, launchFrame, navigate]);

    return (
      <TouchableOpacity
        style={[
          t.flexRow,
          t.justifyCenter,
          t.itemsCenter,
          {
            paddingVertical: 3,
            paddingLeft: 6,
            paddingRight: 8,
            borderRadius: 40,
            backgroundColor: t.dark ? '#2E2835' : '#F0EDFF',
            gap: 4,
          },
        ]}
        activeOpacity={0.75}
        onPress={onPress}
      >
        {typeof headerActionMetadata !== 'undefined' &&
        typeof headerActionMetadata.frame !== 'undefined' &&
        typeof headerActionMetadata.frame.frameUrl ? (
          <ExpandFrameIcon
            width={12}
            height={12}
            color={t.dark ? '#FFFFFF' : '#8A63D2'}
          />
        ) : (
          <Octicons
            name={'link'}
            size={12}
            style={{ color: t.dark ? '#FFFFFF' : '#8A63D2' }}
          />
        )}
        <Text style={[{ color: t.dark ? '#FFFFFF' : '#8A63D2' }]}>
          {headerAction.title}
        </Text>
      </TouchableOpacity>
    );
  },
);

ChannelHeaderAction.displayName = 'ChannelHeaderAction';

export { ChannelHeaderAction };
