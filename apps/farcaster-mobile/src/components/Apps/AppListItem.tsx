import { ApiFrame } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useGloballyCachedFrame,
} from 'farcaster-client-hooks';
import { AnimatedPressable, TextPlaceholder } from 'farcaster-expo';
import React, { FC, JSX, memo, useCallback, useMemo } from 'react';
import { Keyboard, Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { ButtonV2 } from '~/components/ButtonV2';
import { FragmentProxy } from '~/components/FragmentProxy';
import {
  FrameIconImage,
  FrameIconImageSize,
} from '~/components/FrameIconImage';
import { SkeletonPlaceholder } from '~/components/SkeletonPlaceholder';
import { Text2 } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { LaunchContext, useLaunchFrame } from '~/hooks/useLaunchFrame';

/** Default row height hint for virtualized lists (icon + title + 2-line description + meta). */
export const AppListItemEstimatedSize = 120;

type AppListItemVariant = 'default' | 'slim' | 'no-open-button';

interface AppListItemProps {
  variant?: AppListItemVariant;
  frame: ApiFrame;
  rank?: number;
  style?: StyleProp<ViewStyle>;
  description?: string | JSX.Element;
  nameColor?: string;
  descriptionColor?: string;
  disableTapHighlight?: boolean;
  frameIconSize?: FrameIconImageSize;
  onBeforeLaunch?: () => void;
  onBeforeAuthorPress?: () => void;
  context?: LaunchContext;
  disableAnimation?: boolean;
}

const AppListItemSkeleton: FC<{ height?: number; borderRadius?: number }> =
  memo(({ height = 72, borderRadius = Math.floor(48 / 5) }) => {
    const t = useTheme();
    return (
      <View
        style={[
          t.flex,
          t.itemsCenter,
          t.flexRow,
          { gap: sizes.s3 },
          t.overflowHidden,
          t.wFull,
          t.flex1,
          t.pY3,
          t.pX4,
          { height },
        ]}
      >
        <SkeletonPlaceholder style={[t.w12, t.h12, { borderRadius }]} />
        <View
          style={[
            t.flex1,
            t.flexCol,
            t.itemsStart,
            t.justifyAround,
            { gap: sizes.s2 },
          ]}
        >
          <TextPlaceholder width={70} />
          <TextPlaceholder width={70} />
        </View>
      </View>
    );
  });

const AppListItem: FC<AppListItemProps> = memo(
  ({
    frame: fallback,
    style,
    rank,
    description,
    nameColor,
    descriptionColor,
    disableTapHighlight = false,
    frameIconSize = 56,
    onBeforeLaunch,
    onBeforeAuthorPress,
    context = { type: 'launcher' } as LaunchContext,
    variant = 'default',
    disableAnimation = false,
  }) => {
    let frame = useGloballyCachedFrame(fallback);

    if (context.type === 'dev_preview') {
      frame = fallback;
    }

    const t = useTheme();
    const launchFrame = useLaunchFrame();

    const launch = useCallback(() => {
      Keyboard.dismiss();
      if (onBeforeLaunch) {
        onBeforeLaunch();
      }
      launchFrame({
        context,
        config: {
          name: frame.name,
          url: frame.homeUrl,
          splashImageUrl: frame.splashImageUrl,
          splashBackgroundColor: frame.splashBackgroundColor,
        },
        author: frame.author,
      });
    }, [
      onBeforeLaunch,
      launchFrame,
      context,
      frame.name,
      frame.homeUrl,
      frame.splashImageUrl,
      frame.splashBackgroundColor,
      frame.author,
    ]);

    const pushToUserProfile = usePushToUserProfile();
    const viewAuthor = useCallback(() => {
      if (!frame.author) return;

      if (onBeforeAuthorPress) {
        onBeforeAuthorPress();
      }

      pushToUserProfile({ fid: frame.author.fid });
    }, [frame.author, onBeforeAuthorPress, pushToUserProfile]);

    const frameBlurb =
      frame.description?.trim() ||
      frame.subtitle?.trim() ||
      frame.tagline?.trim() ||
      '';

    const descriptionContent = useMemo(() => {
      if (typeof description === 'string') {
        return (
          <Text2
            color="secondary"
            size="sm"
            numberOfLines={2}
            style={descriptionColor ? { color: descriptionColor } : undefined}
          >
            {description}
          </Text2>
        );
      }
      if (description !== undefined) {
        return description;
      }

      const authorRow = frame.author ? (
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Text2 color="secondary" size="sm">
            {'by '}
          </Text2>
          {frame.author.pfp?.url ? (
            <Avatar
              pfpUrl={frame.author.pfp.url}
              diameter={14}
              border={false}
            />
          ) : null}
          <View
            onStartShouldSetResponder={
              variant !== 'slim' ? () => true : undefined
            }
          >
            <Pressable onPress={viewAuthor} disabled={variant === 'slim'}>
              <Text2 color="brand" size="sm" numberOfLines={1}>
                {resolveUsernameShort(frame.author)}
              </Text2>
            </Pressable>
          </View>
        </View>
      ) : null;

      if (!frameBlurb) {
        return authorRow;
      }

      return (
        <View style={[t.flexCol, { gap: 4 }]}>
          <Text2 color="secondary" size="sm">
            {frameBlurb}
          </Text2>
          {authorRow}
        </View>
      );
    }, [
      description,
      descriptionColor,
      viewAuthor,
      variant,
      frame.author,
      frameBlurb,
      t.flexRow,
      t.itemsCenter,
      t.flexCol,
    ]);

    const content = useMemo(() => {
      return (
        <FragmentProxy>
          {/* Keep icon width stable so long titles/descriptions cannot compress it. */}
          <View style={{ flexShrink: 0 }}>
            <FrameIconImage imageUrl={frame.iconUrl} size={frameIconSize} />
          </View>
          <View
            style={[
              t.flex1,
              { minWidth: 0 },
              t.justifyCenter,
              variant === 'default' && [t.flexCol, { gap: 4 }],
              variant === 'slim' && [t.flexRow, t.itemsCenter, { gap: 4 }],
            ]}
          >
            <Text2
              weight="semibold"
              numberOfLines={1}
              style={nameColor ? { color: nameColor } : undefined}
            >
              {rank ? `${rank}. ` : ''}
              {frame.name}
            </Text2>
            {descriptionContent}
          </View>
          {variant === 'default' && (
            <ButtonV2
              title="Open"
              variant="secondary"
              onPress={launch}
              height="sm"
              width={60}
            />
          )}
        </FragmentProxy>
      );
    }, [
      rank,
      t.flex1,
      t.flexCol,
      t.flexRow,
      t.itemsCenter,
      t.justifyCenter,
      frame.iconUrl,
      frame.name,
      frameIconSize,
      variant,
      nameColor,
      launch,
      descriptionContent,
    ]);

    if (disableTapHighlight) {
      return (
        <AnimatedPressable
          disableAnimation={disableAnimation}
          style={[style, t.flexRow, t.itemsStart, { gap: sizes.s3 }]}
          onPress={launch}
        >
          {content}
        </AnimatedPressable>
      );
    }

    return (
      <AnimatedPressable
        disableAnimation={disableAnimation}
        style={[style, t.flexRow, t.itemsStart, { gap: sizes.s3 }]}
        onPress={launch}
      >
        {content}
      </AnimatedPressable>
    );
  },
);

AppListItem.displayName = 'AppListItem';

export { AppListItem, AppListItemSkeleton };
