import { Octicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { PlaybackTime } from '~/components/Video/PlaybackTime';
import { VideoSlider } from '~/components/Video/VideoSlider';
import { useTheme } from '~/contexts/ThemeProvider';

export const VideoControlsBar = React.memo(
  ({
    currentPosition,
    currentDuration,
    muted,
    onMute,
    onSeekStart,
    onSeek,
    onSeekEnd,
    seekerValue,
    style,
  }: {
    currentPosition: number;
    currentDuration: number;
    muted: boolean;
    onMute: () => void;
    onSeekStart: (p: number) => void;
    onSeek: (p: number) => void;
    onSeekEnd: (p: number) => void;
    seekerValue: number;
    style?: StyleProp<ViewStyle>;
  }) => {
    const t = useTheme();

    // Create a dummy gesture for the slider (we don't need blocking in this component)
    const dummyGesture = useMemo(() => Gesture.Tap(), []);

    return (
      <View style={[t.flex, t.flexCol, t.itemsCenter, t.wFull, style]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.wFull]}>
          <View
            style={[
              t.flex1,
              t.relative,
              t.flex,
              t.flexRow,
              t.justifyBetween,
              t.itemsCenter,
            ]}
          >
            <VideoSlider
              onSeekStart={onSeekStart}
              onSeek={onSeek}
              onSeekEnd={onSeekEnd}
              value={seekerValue}
              blockGestureRef={dummyGesture}
              height={10}
            />
          </View>
        </View>
        <View
          style={[
            t.relative,
            t.wFull,
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.mL2,
          ]}
        >
          <PlaybackTime
            currentPosition={currentPosition}
            currentDuration={currentDuration}
          />
          <MuteButton onMute={onMute} muted={muted} />
        </View>
      </View>
    );
  },
);

const MuteButton = ({
  onMute,
  muted,
}: {
  onMute: () => void;
  muted: boolean;
}) => {
  const t = useTheme();
  const muteTap = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        'worklet';
        runOnJS(onMute)();
      }),
    [onMute],
  );
  return (
    <GestureDetector gesture={muteTap}>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.directCasts.bgImagePreview,
          t.p2,
          t.roundedFull,
          t.mR3,
        ]}
      >
        <Octicons
          name={muted ? 'mute' : 'unmute'}
          size={20}
          style={[t.texts.light]}
        />
      </View>
    </GestureDetector>
  );
};
