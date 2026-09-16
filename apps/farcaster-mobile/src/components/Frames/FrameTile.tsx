import { Octicons } from '@expo/vector-icons';
import { ListRenderItem } from '@shopify/flash-list';
import { ApiFrame } from 'farcaster-client-data';
import { useGloballyCachedFrame } from 'farcaster-client-hooks';
import { AnimatedPressable, useRootToast } from 'farcaster-expo';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useBottomSheetModalRef } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { FragmentProxy } from '~/components/FragmentProxy';
import {
  FrameIconImage,
  FrameIconImageSize,
} from '~/components/FrameIconImage';
import { Text2 } from '~/components/Text';
import { useFavoriteFrame } from '~/contexts/FavoriteFrameProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { waitForInteractions } from '~/utils/InteractionUtils';

export const frameTileEstimatedSize = 88;

interface FrameTileProps {
  frame: ApiFrame;
  frameIconSize?: FrameIconImageSize;
  onBeforeLaunch?: () => void;
  showTitle?: boolean;
  onRemoved?: (frame: ApiFrame) => void;
}

const FrameTile: FC<FrameTileProps> = memo(
  ({
    frame: fallback,
    frameIconSize = 64,
    onBeforeLaunch,
    showTitle = false,
    onRemoved,
  }) => {
    const frame = useGloballyCachedFrame(fallback);
    const t = useTheme();
    const launchFrame = useLaunchFrame();
    const { triggerImpactAsync } = useHaptics();
    const [showMenu, setShowMenu] = useState(false);

    const handleLaunch = useCallback(() => {
      if (onBeforeLaunch) {
        onBeforeLaunch();
      }
      launchFrame({
        context: {
          type: 'launcher',
        },
        config: {
          name: frame.name,
          url: frame.homeUrl,
          splashImageUrl: frame.splashImageUrl,
          splashBackgroundColor: frame.splashBackgroundColor,
        },
        author: frame.author,
        harmful: frame.harmful,
      });
    }, [frame, launchFrame, onBeforeLaunch]);

    const title = useMemo(() => {
      if (showTitle) {
        return (
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.mT2,
              { maxWidth: 60 },
            ]}
          >
            <Text2 size="xs" style={[t.textCenter]} numberOfLines={1}>
              {frame.name}
            </Text2>
          </View>
        );
      }
      return null;
    }, [
      frame.name,
      showTitle,
      t.flexRow,
      t.itemsCenter,
      t.justifyCenter,
      t.mT2,
      t.textCenter,
    ]);

    return (
      <>
        <FrameTileContent
          image={
            <FrameIconImage imageUrl={frame.iconUrl} size={frameIconSize} />
          }
          title={title}
          onPress={handleLaunch}
          onLongPress={() => {
            triggerImpactAsync();
            setShowMenu(true);
          }}
        />
        {showMenu && (
          <Menu
            frame={frame}
            onDismiss={() => setShowMenu(false)}
            onRemoved={onRemoved}
          />
        )}
      </>
    );
  },
);
FrameTile.displayName = 'FrameTile';

interface FrameTileDisplayProps {
  image: React.ReactNode;
  title?: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
}

const FrameTileContent: FC<FrameTileDisplayProps> = ({
  image,
  title,
  onPress,
  onLongPress,
}) => {
  const t = useTheme();

  return (
    <View style={[t.wFull, t.flexCol, t.itemsCenter]}>
      <AnimatedPressable
        style={[t.flexCol, t.itemsCenter, t.roundedLg]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <FragmentProxy>
          {image}
          {title}
        </FragmentProxy>
      </AnimatedPressable>
    </View>
  );
};
FrameTileContent.displayName = 'FrameTileDisplay';

export const renderFrameTile: ListRenderItem<ApiFrame> = ({ item }) => {
  return <FrameTile frame={item} />;
};

interface MenuProps {
  frame: ApiFrame;
  onDismiss: () => void;
  onRemoved?: (frame: ApiFrame) => void;
}

const Menu: FC<MenuProps> = ({ frame, onDismiss, onRemoved }) => {
  const t = useTheme();
  const toast = useRootToast();
  const bottomSheetRef = useBottomSheetModalRef();
  const favoriteFrame = useFavoriteFrame();
  const push = usePush();

  const remove = useCallback(async () => {
    bottomSheetRef.current?.dismiss();
    await waitForInteractions();
    try {
      const removed = await favoriteFrame.confirmRemoveFavoriteFrame({
        frame,
        emit: undefined,
      });
      if (removed) {
        onRemoved?.(frame);
      }
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        e.message.includes('Must be called in FavoriteFrameContext provider')
      ) {
        // If FrameTile is ever rendered outside the provider, avoid a silent no-op.
        toast.show('Unable to remove Mini App', { type: 'danger' });
        return;
      }

      // Failure toast is shown inside FavoriteFrameProvider for normal removal errors.
    }
  }, [bottomSheetRef, favoriteFrame, frame, onRemoved, toast]);

  const options: ButtonGroupOption[] = useMemo(() => {
    return [
      {
        label: 'Manage',
        onPress: () => {
          push('AppSettings', { domain: frame.domain });
        },
        icon: ({ size, color }) => (
          <Octicons name="tools" size={size} color={color} />
        ),
      },
      {
        label: 'Remove from Farcaster',
        onPress: remove,
        icon: ({ size, color }) => (
          <Octicons name="x-circle" size={size} color={color} />
        ),
        destructive: true,
      },
    ] satisfies ButtonGroupOption[];
  }, [frame.domain, push, remove]);

  return (
    <AutoDisplayingBottomSheetModal
      name="frameActions"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      <View style={[t.pT4, { gap: 16 }]}>
        <ButtonGroup options={options} />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

export { FrameTile, FrameTileContent };
