import { getSpecificallySizedImageUrl } from 'farcaster-client-hooks';
import React from 'react';
import { PixelRatio, Platform, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { useTheme } from '~/contexts/ThemeProvider';

type GroupConversationImageProps = {
  imageURL: string | undefined;
  width?: number;
  height?: number;
  diameter: number;
  roundedSize?: 'full' | 'lg' | 'md' | 'sm';
};

const PeopleIcon = React.memo(({ size }: { size: number }) => {
  const t = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M1.16699 23.3333V20.0667C1.16699 19.4055 1.33733 18.7981 1.67799 18.2443C2.01866 17.6905 2.47055 17.2674 3.03366 16.975C4.23921 16.3722 5.46421 15.9203 6.70866 15.6193C7.9531 15.3183 9.21699 15.1674 10.5003 15.1667C11.7837 15.1659 13.0475 15.3168 14.292 15.6193C15.5364 15.9219 16.7614 16.3738 17.967 16.975C18.5309 17.2667 18.9832 17.6898 19.3238 18.2443C19.6645 18.7989 19.8344 19.4063 19.8337 20.0667V23.3333H1.16699ZM22.167 23.3333V19.8333C22.167 18.9778 21.929 18.156 21.453 17.3682C20.977 16.5803 20.3011 15.9048 19.4253 15.3417C20.417 15.4583 21.3503 15.6578 22.2253 15.9402C23.1003 16.2225 23.917 16.5674 24.6753 16.975C25.3753 17.3639 25.91 17.7963 26.2795 18.2723C26.6489 18.7483 26.8337 19.2687 26.8337 19.8333V23.3333H22.167ZM10.5003 14C9.21699 14 8.11838 13.543 7.20449 12.6292C6.2906 11.7153 5.83366 10.6167 5.83366 9.33332C5.83366 8.04999 6.2906 6.95138 7.20449 6.03749C8.11838 5.1236 9.21699 4.66666 10.5003 4.66666C11.7837 4.66666 12.8823 5.1236 13.7962 6.03749C14.71 6.95138 15.167 8.04999 15.167 9.33332C15.167 10.6167 14.71 11.7153 13.7962 12.6292C12.8823 13.543 11.7837 14 10.5003 14ZM22.167 9.33332C22.167 10.6167 21.71 11.7153 20.7962 12.6292C19.8823 13.543 18.7837 14 17.5003 14C17.2864 14 17.0142 13.9759 16.6837 13.9277C16.3531 13.8794 16.0809 13.8258 15.867 13.7667C16.392 13.1444 16.7957 12.4542 17.078 11.6958C17.3603 10.9375 17.5011 10.15 17.5003 9.33332C17.4995 8.51666 17.3588 7.72916 17.078 6.97082C16.7972 6.21249 16.3935 5.52221 15.867 4.89999C16.1392 4.80277 16.4114 4.73938 16.6837 4.70982C16.9559 4.68027 17.2281 4.66588 17.5003 4.66666C18.7837 4.66666 19.8823 5.1236 20.7962 6.03749C21.71 6.95138 22.167 8.04999 22.167 9.33332Z"
        fill={t.colors.text.tertiary}
      />
    </Svg>
  );
});

const GroupConversationImage: React.FC<GroupConversationImageProps> =
  React.memo(({ imageURL, diameter, roundedSize = 'full', width, height }) => {
    const t = useTheme();

    const roundedStyle = (() => {
      switch (roundedSize) {
        case 'full':
          return t.roundedFull;
        case 'lg':
          return t.roundedLg;
        case 'md':
          return t.rounded;
        case 'sm':
          return t.roundedSm;
        default:
          return t.roundedFull;
      }
    })();

    const optimizedImageUrl = React.useMemo(() => {
      if (typeof imageURL === 'undefined') {
        return imageURL;
      }

      const dpr = Math.min(PixelRatio.get(), Platform.OS === 'ios' ? 3 : 2);
      const px = PixelRatio.getPixelSizeForLayoutSize(diameter);
      const size = PixelRatio.roundToNearestPixel(
        px * (dpr / PixelRatio.get()),
      );

      return getSpecificallySizedImageUrl({
        staticRaster: imageURL,
        h: size,
        w: size,
      });
    }, [diameter, imageURL]);

    if (optimizedImageUrl) {
      return (
        <SimplerRemoteImage
          uri={optimizedImageUrl}
          height={height || diameter}
          width={width || diameter}
          style={[t.borderDefault, t.borderHairline, roundedStyle]}
          recyclingKey={optimizedImageUrl}
        />
      );
    }

    return (
      <View
        style={[
          t.flexRow,
          t.justifyCenter,
          t.borderDefault,
          t.borderHairline,
          t.itemsCenter,
          { height: height || diameter },
          { width: width || diameter },
          t.backgrounds.secondary,
          roundedStyle,
        ]}
      >
        <PeopleIcon
          size={(height || diameter) === 56 ? 28 : (height || diameter) / 1.75}
        />
      </View>
    );
  });

GroupConversationImage.displayName = 'GroupConversationImage';

export { GroupConversationImage };
