import { Languages } from 'lucide-react-native';
import React, { FC, memo } from 'react';
import { Pressable } from 'react-native';

import { FeedItemTopHatContainer } from '~/components/casts/FeedItemTopHat';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type CastTranslationTopHatProps = {
  avatarDiameter?: number;
  isPending?: boolean;
  sourceLanguageName: string;
  showOriginal: boolean;
  toggleLabel: string;
  onToggle: () => void;
  reserveMenuActionSpace?: boolean;
};

const CastTranslationTopHat: FC<CastTranslationTopHatProps> = memo((props) => {
  const t = useTheme();
  const { avatarDiameter, reserveMenuActionSpace = false } = props;

  if (props.isPending) {
    return (
      <FeedItemTopHatContainer
        avatarDiameter={avatarDiameter}
        reserveMenuActionSpace={reserveMenuActionSpace}
        icon={<Languages size={12} color={t.colors.text.tertiary} />}
      >
        <Text
          style={[
            t.texts.tertiary,
            t.fontNormal,
            {
              fontSize: 14,
              lineHeight: 18,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          translation pending...
        </Text>
      </FeedItemTopHatContainer>
    );
  }

  const { sourceLanguageName, showOriginal, toggleLabel, onToggle } = props;

  return (
    <FeedItemTopHatContainer
      avatarDiameter={avatarDiameter}
      reserveMenuActionSpace={reserveMenuActionSpace}
      icon={<Languages size={12} color={t.colors.text.tertiary} />}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: showOriginal }}
          accessibilityLabel={
            showOriginal ? 'Show translated text' : 'Show original text'
          }
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          <Text
            style={[
              t.texts.brand,
              t.fontMedium,
              {
                fontSize: 14,
                lineHeight: 18,
              },
            ]}
          >
            {toggleLabel}
          </Text>
        </Pressable>
      }
    >
      <Text
        style={[
          t.texts.tertiary,
          t.fontNormal,
          {
            fontSize: 14,
            lineHeight: 18,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        translated from {sourceLanguageName}
      </Text>
    </FeedItemTopHatContainer>
  );
});

CastTranslationTopHat.displayName = 'CastTranslationTopHat';

export { CastTranslationTopHat };
