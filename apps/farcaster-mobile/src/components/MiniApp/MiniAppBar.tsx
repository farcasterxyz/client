import {
  resolveUsernameShort,
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
} from 'farcaster-client-hooks';
import { AnimatedPressable, TypographyBody } from 'farcaster-expo';
import { X } from 'lucide-react-native';
import * as React from 'react';
import { Platform, View } from 'react-native';

import { FrameIconImage } from '~/components/FrameIconImage';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export type MiniAppBarProps = {
  domain: string;
  name: string | undefined;
};

function MiniAppBar(props: MiniAppBarProps) {
  const { domain } = props;
  const t = useTheme();
  const { data } = useNonSuspenseFrameDetails({ domain });
  const frame = useGloballyCachedFrame(data);
  const { closeMiniApp, maximizeMiniApp } = useMinimizedMiniApp();

  const name = props.name ?? frame?.name;
  const iconUrl = frame?.iconUrl;

  if (!name) {
    return null;
  }

  return (
    <AnimatedPressable
      onPress={maximizeMiniApp}
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
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.gap2]}>
          {iconUrl && (
            <View
              style={[
                t.overflowHidden,
                t.roundedFull,
                t.border,
                t.borders.primary,
              ]}
            >
              <FrameIconImage
                imageUrl={iconUrl}
                size={32}
                skipAutoRounding={true}
              />
            </View>
          )}
          <View style={[t.flex, t.flexCol]}>
            <TypographyBody label="Medium/Strong" color="primary">
              {name}
            </TypographyBody>
            {typeof frame !== 'undefined' && frame.author && (
              <TypographyBody label="Small" color="tertiary">
                by{' '}
                {resolveUsernameShort({
                  fid: frame.author.fid,
                  username: frame.author.username,
                })}
              </TypographyBody>
            )}
          </View>
        </View>
        <AnimatedPressable
          onPress={closeMiniApp}
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

export { MiniAppBar };
