import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Linking,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type ShareLinkMenuProps = {
  url: string;
  onClickEmail: () => void;
  onClickQR: () => void;
  showTwitter: boolean;
  showEmail: boolean;
};

const ShareLinkMenu: React.FC<ShareLinkMenuProps> = ({
  onClickQR,
  onClickEmail,
  url,
  showTwitter,
  showEmail,
}) => {
  const t = useTheme();
  const [linkCopied, setLinkCopied] = React.useState(false);
  const buttons = React.useMemo(() => {
    const icons = [
      {
        title: 'Messages',
        icon: require('~/assets/images/MessagesIcon.png'),
        onClick: async () => {
          await Linking.openURL(`sms://?&body=${encodeURIComponent(url)}`);
        },
      },
      {
        title: 'Telegram',
        icon: require('~/assets/images/TelegramIcon.png'),
        onClick: async () => {
          await Linking.openURL(
            `https://t.me/share/url?url=${encodeURIComponent(url)}`,
          );
        },
      },
      {
        title: 'X (Twitter)',
        icon: require('~/assets/images/TwitterIcon.png'),
        onClick: async () => {
          await Linking.openURL(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(url)}`,
          );
        },
      },
      {
        title: 'Email',
        icon: require('~/assets/images/EmailIcon.png'),
        onClick: async () => {
          onClickEmail();
        },
      },
      {
        title: linkCopied ? 'Copied!' : 'Copy link',
        icon: require('~/assets/images/CopyLinkIcon.png'),
        onClick: async () => {
          await Clipboard.setStringAsync(url);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 3000);
        },
      },
      {
        title: 'Show QR',
        icon: require('~/assets/images/ShowQRIcon.png'),
        onClick: async () => {
          onClickQR();
        },
      },
    ];
    return icons.flatMap((x) => {
      if (!showTwitter && x.title === 'X (Twitter)') {
        return [];
      } else if (!showEmail && x.title === 'Email') {
        return [];
      } else {
        return x;
      }
    });
  }, [linkCopied, onClickEmail, onClickQR, showEmail, showTwitter, url]);

  return (
    <View style={[t.flex, t.flexCol]}>
      <View style={[t.flex, t.flexRow]}>
        {buttons.slice(0, 3).map(({ title, onClick, icon }, index) => (
          <ShareLinkGridIcon
            key={title}
            title={title}
            onClick={onClick}
            icon={icon}
            index={index}
          />
        ))}
      </View>

      <View style={[t.flex, t.flexRow]}>
        {buttons.slice(3, 6).map(({ title, onClick, icon }, index) => (
          <ShareLinkGridIcon
            key={title}
            title={title}
            onClick={onClick}
            icon={icon}
            index={index + 3}
          />
        ))}
      </View>
    </View>
  );
};

type ShareLinkGridIconProps = {
  title: string;
  onClick: () => Promise<void>;
  icon: unknown;
  index: number;
};

const ShareLinkGridIcon: React.FC<ShareLinkGridIconProps> = ({
  title,
  icon,
  onClick,
  index,
}) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  return (
    <View
      style={[
        index < 3 && t.borderBHairline,
        (index === 1 || index === 4) && t.borderRHairline,
        (index === 1 || index === 4) && t.borderLHairline,
        t.borderMuted,
      ]}
    >
      <TouchableOpacity
        style={[
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.pL6,
          t.pR6,
          t.w30,
          index < 3 ? t.pB6 : t.pT6,
        ]}
        onPress={async () => {
          await onClick();
          trackEvent(AnalyticsEvent.ClickShareGiftInvite, {
            shareVia: title,
          });
        }}
      >
        <Image
          source={icon as ImageSourcePropType}
          style={{ height: 60, width: 60 }}
          resizeMode="contain"
        />
        {title === 'X (Twitter)' ? (
          <View style={[t.flex, t.flexRow, t.itemsCenter, t.pT2]}>
            <Text style={[t.textSm, t.texts.primary, t.pR1]}>X</Text>
            <Text style={[t.textSm, t.texts.secondary]}>(Twitter)</Text>
          </View>
        ) : (
          <Text
            style={[
              t.textSm,
              title === 'Copied!' ? t.texts.secondary : t.texts.primary,
              t.pT2,
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export { ShareLinkMenu };
