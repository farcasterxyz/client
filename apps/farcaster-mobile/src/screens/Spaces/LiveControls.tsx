import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import type { ApiAudioRoomReactionEmoji } from 'farcaster-client-data';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import { Text } from '~/components/Text';
import { captureMobileAudioSpacePerfMetric } from '~/utils/AudioSpaceInstrumentation';

const ACTION_PRIMARY = '#7c65c1';
const RED = '#dc3412';

const REACTION_EMOJIS: ApiAudioRoomReactionEmoji[] = [
  '❤️',
  '😂',
  '🙌',
  '🔥',
  '💯',
  '😢',
  '👎',
];

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bgSecondary: isDark ? '#1f1f1f' : '#f2f2f2',
    fg: isDark ? '#ffffff' : '#121212',
    actionPrimary: ACTION_PRIMARY,
    danger: RED,
  };
}

function LiveControls({
  muted,
  handRaised,
  role,
  onMute,
  onHand,
  onLeave,
  onEnd,
  onSendReaction,
}: {
  muted: boolean;
  handRaised: boolean;
  role: 'host' | 'cohost' | 'speaker' | 'listener';
  onMute: () => Promise<void> | void;
  onHand: () => void;
  onLeave: () => Promise<void> | void;
  onEnd?: () => Promise<void> | void;
  onSendReaction: (emoji: ApiAudioRoomReactionEmoji) => void;
}) {
  const c = useColors();
  const canPublish = role === 'host' || role === 'cohost' || role === 'speaker';
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const runWithLatencyTelemetry = useCallback(
    async (
      control: 'end' | 'leave' | 'mute' | 'hand' | 'reaction-picker',
      cb: () => Promise<void> | void,
    ) => {
      const startedAt = Date.now();
      try {
        await cb();
      } finally {
        captureMobileAudioSpacePerfMetric({
          metricName: 'audio_space_control_tap_latency',
          properties: {
            control,
            role,
            latencyMs: Date.now() - startedAt,
          },
        });
      }
    },
    [role],
  );

  return (
    <View>
      {reactionsOpen && (
        <View style={[styles.reactionsRow, { backgroundColor: c.bgSecondary }]}>
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => {
                onSendReaction(emoji);
                captureMobileAudioSpacePerfMetric({
                  metricName: 'audio_space_control_tap_latency',
                  properties: {
                    control: 'reaction-picker',
                    role,
                    latencyMs: 0,
                  },
                });
              }}
              style={styles.reactionButton}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.controlsRow}>
        {onEnd ? (
          <Pressable
            onPress={() => {
              Alert.alert(
                'End Space?',
                'This will end the Space for everyone.',
                [
                  { text: 'Keep Space', style: 'cancel' },
                  {
                    text: 'End Space',
                    style: 'destructive',
                    onPress: () => {
                      void runWithLatencyTelemetry('end', onEnd);
                    },
                  },
                ],
              );
            }}
            style={[styles.controlButton, { backgroundColor: c.danger }]}
          >
            <Octicons name="x-circle" size={18} color="white" />
            <Text style={[styles.controlLabel, { color: 'white' }]}>End</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              void runWithLatencyTelemetry('leave', onLeave);
            }}
            style={[styles.controlButton, { backgroundColor: c.bgSecondary }]}
          >
            <Octicons name="sign-out" size={18} color={c.fg} />
            <Text style={[styles.controlLabel, { color: c.fg }]}>Leave</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => {
            void runWithLatencyTelemetry('reaction-picker', () => {
              setReactionsOpen((v) => !v);
            });
          }}
          style={[
            styles.controlIconButton,
            {
              backgroundColor: reactionsOpen ? c.actionPrimary : c.bgSecondary,
            },
          ]}
          accessibilityLabel="Reactions"
        >
          <Text style={styles.handEmoji}>😊</Text>
        </Pressable>

        {canPublish ? (
          <Pressable
            onPress={() => {
              void runWithLatencyTelemetry('mute', onMute);
            }}
            style={[
              styles.controlButton,
              { backgroundColor: muted ? c.bgSecondary : c.actionPrimary },
            ]}
          >
            <MaterialCommunityIcons
              name={muted ? 'microphone-off' : 'microphone'}
              size={20}
              color={muted ? c.fg : 'white'}
            />
            <Text
              style={[styles.controlLabel, { color: muted ? c.fg : 'white' }]}
            >
              {muted ? 'Muted' : 'Mic on'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              void runWithLatencyTelemetry('hand', onHand);
            }}
            style={[
              styles.controlButton,
              {
                backgroundColor: handRaised ? c.actionPrimary : c.bgSecondary,
              },
            ]}
          >
            <Text style={styles.handEmoji}>✋</Text>
            <Text
              style={[
                styles.controlLabel,
                { color: handRaised ? 'white' : c.fg },
              ]}
            >
              {handRaised ? 'Raised' : 'Hand'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 999,
  },
  controlLabel: { fontSize: 14, fontWeight: '600' },
  handEmoji: { fontSize: 16 },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 8,
  },
  reactionButton: { padding: 6 },
  reactionEmoji: { fontSize: 26 },
  controlIconButton: {
    width: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 999,
  },
});

export { LiveControls };
