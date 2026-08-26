import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import {
  CastClickType,
  getFeedSourceOn,
  useTrackCastClick,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Avatar } from '~/components/Avatar';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

type ShowMoreProps = {
  castHash: string;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  onPress?: () => void;
  otherParticipants: ApiUser[];
};

const avatarDiameter = 24;

const ShowMore = memo(
  ({
    castHash,
    castOpenIncludeReason,
    onPress,
    otherParticipants,
  }: ShowMoreProps) => {
    const t = useTheme();
    const push = usePush();
    const trackCastClick = useTrackCastClick();
    const {
      defaultEventProps: { on },
    } = useTrackEvent();
    const [showSpinner, setShowSpinnner] = useState(false);

    const threadViewShowMore = React.useMemo(() => {
      return typeof onPress !== 'undefined';
    }, [onPress]);

    useEffect(() => {
      // Stop spinner if this component is re-rendered for a new cast, which
      // can happen if we have a Show more on a 2nd level reply for more 2nd level
      // replies (to the parent cast) which when clicked turns into a Show more for
      // 3rd level replies the 2nd level cast.
      setShowSpinnner(false);
    }, [castHash]);

    const text = useMemo(() => {
      if (otherParticipants.length === 0) {
        return threadViewShowMore ? 'Show replies' : 'Show more';
      } else if (otherParticipants.length === 1) {
        return 'Show more from 1 other';
      } else {
        return `Show more from ${otherParticipants.length} others`;
      }
    }, [otherParticipants.length, threadViewShowMore]);

    const handleOnPress = useCallback(() => {
      trackCastClick({ type: CastClickType.Cast });

      if (onPress) {
        setShowSpinnner(true);
        onPress();
      } else {
        const sourceOn = getFeedSourceOn(on);

        push('Cast', {
          castHash,
          ...(castOpenIncludeReason
            ? { castOpenIncludeReason: castOpenIncludeReason }
            : {}),
          ...(sourceOn ? { sourceOn } : {}),
        });
      }
    }, [castHash, castOpenIncludeReason, on, onPress, push, trackCastClick]);

    const content = useMemo(
      () => (
        <>
          <Text
            style={[
              threadViewShowMore
                ? [t.texts.brand, t.mR2]
                : [t.texts.brand, t.textSm],
            ]}
          >
            {text}
          </Text>
          {(otherParticipants || []).length !== 0 && (
            <View style={[t.relative, t.mL2, { height: avatarDiameter }]}>
              {(otherParticipants || [])
                .slice(0, 6)
                .map(({ pfp, username }, index) => (
                  <View
                    key={`${username}|${pfp?.url}`}
                    style={[t.absolute, { left: index * avatarDiameter * 0.7 }]}
                  >
                    <Avatar pfpUrl={pfp?.url} diameter={avatarDiameter} />
                  </View>
                ))}
            </View>
          )}
        </>
      ),
      [
        otherParticipants,
        t.absolute,
        t.mL2,
        t.mR2,
        t.relative,
        t.texts.brand,
        t.textSm,
        text,
        threadViewShowMore,
      ],
    );

    return useMemo(
      () => (
        <TouchableOpacity activeOpacity={0.75} onPress={handleOnPress}>
          <View style={[t.flexRow, t.itemsCenter, t.pY2]}>
            <View
              style={[
                t.itemsCenter,
                {
                  marginLeft: 34,
                  marginRight: 32,
                },
              ]}
            >
              <Svg width="4" height="18">
                <Circle cx="2" cy="2" r="1.5" fill={t.colors.feed.threadLine} />
                <Circle cx="2" cy="8" r="1.5" fill={t.colors.feed.threadLine} />
                <Circle
                  cx="2"
                  cy="14"
                  r="1.5"
                  fill={t.colors.feed.threadLine}
                />
              </Svg>
            </View>
            {content}
            {showSpinner && <LoadingIndicator />}
          </View>
        </TouchableOpacity>
      ),
      [
        content,
        handleOnPress,
        showSpinner,
        t.colors.feed.threadLine,
        t.flexRow,
        t.itemsCenter,
        t.pY2,
      ],
    );
  },
);
ShowMore.displayName = 'ShowMore';

export { ShowMore };
