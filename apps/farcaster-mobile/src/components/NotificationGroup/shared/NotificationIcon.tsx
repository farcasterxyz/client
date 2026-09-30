import React, { FC, memo, ReactNode, useMemo } from 'react';
import { View } from 'react-native';

import { NFT_IMAGE_UNAVAILABLE_SOURCE } from '~/components/CollectionImage';
import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { RemoteImage } from '~/components/RemoteImage';
import { useTheme } from '~/contexts/ThemeProvider';

export const iconLength = 30;

type NotificationIconProps = {
  children: (iconColor: string, backgroundColor: string) => ReactNode;
  variant:
    | 'blue'
    | 'brown'
    | 'red'
    | 'green'
    | 'brightGreen'
    | 'purple'
    | 'yellow'
    | 'gray';
  channelImageUrl?: string;
};

const NotificationIcon: FC<NotificationIconProps> = memo(
  ({ variant, channelImageUrl, children }) => {
    const t = useTheme();

    const iconColor = useMemo(() => {
      switch (variant) {
        case 'blue':
          return t.colors.text.informative;
        case 'red':
          return t.colors.text.danger;
        case 'purple':
          return t.colors.text.brand;
        case 'green':
        case 'brightGreen':
          return t.colors.text.success;
        case 'yellow':
          return t.colors.text.warning;
        case 'gray':
          return t.colors.text.secondary;
        default:
          return t.colors.text.primary;
      }
    }, [variant, t.colors]);

    const backgroundColor = useMemo(() => {
      switch (variant) {
        case 'blue':
          return t.colors.background.informative;
        default:
          return '';
      }
    }, [variant, t.colors.background.informative]);

    return useMemo(() => {
      if (channelImageUrl) {
        return (
          <NotificationGraphic>
            <View style={[t.relative, { width: 44, height: 40 }]}>
              <View>
                <RemoteImage
                  contentFit="cover"
                  uri={channelImageUrl}
                  width={28}
                  height={28}
                  style={[t.roundedFull]}
                  fallbackSource={NFT_IMAGE_UNAVAILABLE_SOURCE}
                  shouldFadeIn={true}
                />
              </View>
              <View style={[t.absolute, { top: 12, right: 0 }]}>
                <View
                  style={[
                    t.roundedFull,
                    t.flexRow,
                    t.justifyCenter,
                    t.itemsCenter,
                    {
                      width: 28,
                      height: 28,
                    },
                  ]}
                >
                  <View
                    style={{
                      transform: [
                        {
                          // Normal icons are meant for 30x30, but here we use 28x28, so scale them down
                          // without requiring the caller to adjust
                          scale: 28 / 30,
                        },
                      ],
                    }}
                  >
                    {children(iconColor || '', backgroundColor || '')}
                  </View>
                </View>
              </View>
            </View>
          </NotificationGraphic>
        );
      } else {
        return (
          <NotificationGraphic>
            <View
              style={[
                t.roundedFull,
                t.flexRow,
                t.justifyEnd,
                t.itemsCenter,
                {
                  width: iconLength,
                  height: iconLength,
                  marginTop: 1.225,
                },
              ]}
            >
              {children(iconColor, backgroundColor)}
            </View>
          </NotificationGraphic>
        );
      }
    }, [
      channelImageUrl,
      t.relative,
      t.roundedFull,
      t.absolute,
      t.flexRow,
      t.justifyCenter,
      t.itemsCenter,
      t.justifyEnd,
      backgroundColor,
      children,
      iconColor,
    ]);
  },
);

NotificationIcon.displayName = 'NotificationIcon';

export { NotificationIcon };
