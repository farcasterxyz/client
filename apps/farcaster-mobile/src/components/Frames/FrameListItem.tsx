import { ListRenderItem } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useGloballyCachedFrame,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';
import { TouchableHighlight, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { FrameIconImage } from '~/components/FrameIconImage';
import { Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useFavoriteFrame } from '~/contexts/FavoriteFrameProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';

export const frameListItemEstimatedSize = 88;

interface FrameListItemProps {
  frame: ApiFrame;
}

const FrameListItem: FC<FrameListItemProps> = memo(({ frame: fallback }) => {
  const frame = useGloballyCachedFrame(fallback);

  const t = useTheme();
  const { trackEvent } = useTrackEvent();
  const launchFrame = useLaunchFrame();
  const { confirmAddFavoriteFrame } = useFavoriteFrame();

  const launch = useCallback(() => {
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
    });
  }, [frame, launchFrame]);

  const pushToUserProfile = usePushToUserProfile();

  const viewAuthor = useCallback(() => {
    if (!frame.author) return;

    trackEvent(AnalyticsEvent.ClickFrameAuthor);

    pushToUserProfile({ fid: frame.author.fid });
  }, [frame.author, pushToUserProfile, trackEvent]);

  return (
    <TouchableHighlight
      underlayColor={t.colors.bgHover}
      style={[
        t.flexRow,
        t.itemsCenter,
        t.pY2,
        t.pX3,
        t.borderDefault,
        t.borderBHairline,
        { gap: sizes.s3 },
      ]}
      onPress={launch}
    >
      <>
        <FrameIconImage imageUrl={frame.iconUrl} size={56} />
        <View style={[t.flex1]}>
          <Text2 weight="semibold" numberOfLines={1}>
            {frame.name}
          </Text2>
          {frame.author && (
            <Text2 size="sm" color="secondary" numberOfLines={1}>
              by{' '}
              <TextWithPress onPress={viewAuthor} style={[t.texts.brand]}>
                {resolveUsernameShort(frame.author)}
              </TextWithPress>
            </Text2>
          )}
        </View>
        {frame.viewerContext?.favorited === true ? (
          <ButtonV2
            title="View"
            variant="secondary"
            onPress={launch}
            height="sm"
            width={60}
          />
        ) : (
          <ButtonV2
            title="Add"
            onPress={() => {
              confirmAddFavoriteFrame({ frame, emit: undefined }).catch(() => {
                // no-op
              });
            }}
            height="sm"
            width={60}
          />
        )}
      </>
    </TouchableHighlight>
  );
});
FrameListItem.displayName = 'FrameListItem';

export const renderFrameListItem: ListRenderItem<ApiFrame> = ({ item }) => {
  return <FrameListItem frame={item} />;
};
