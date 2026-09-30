import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  normalizeAudioSpaceError,
  useAudioRoomReaction,
} from 'farcaster-client-hooks';
import { Check, Hand, Mic, MicOff } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { useSpace } from '~/contexts/SpaceContext';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';

const REACTION_EMOJIS = ['❤️', '😂', '🙌', '🔥', '💯', '😢', '👎'] as const;
type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

type Props = {
  muted: boolean;
  handRaised: boolean;
  role: 'listener' | 'speaker' | 'cohost' | 'host';
  onMute: () => void;
  onHand: () => void;
  onLeave: () => void;
  onEnd?: () => void;
  isEnding?: boolean;
  roomId: string;
};

/**
 * Bottom control bar for a live Space room.
 * Left: Leave / End button
 * Center: Emoji reactions (broadcast to all participants)
 * Right: Mute (host/speaker/cohost) or Hand-raise (listener)
 */
const LiveControls: React.FC<Props> = React.memo(
  ({
    muted,
    handRaised,
    role,
    onMute,
    onHand,
    onLeave,
    onEnd,
    isEnding,
    roomId,
  }) => {
    const { joined } = useSpace();
    const canSpeak = role === 'host' || role === 'cohost' || role === 'speaker';
    const sendReaction = useAudioRoomReaction();
    const [floatingReactions, setFloatingReactions] = useState<
      { id: number; emoji: string; offset: number }[]
    >([]);
    const [endConfirmationOpen, setEndConfirmationOpen] = useState(false);

    // Track pending floating-reaction cleanup timers so we can cancel them
    // on unmount and avoid setting state after this component is gone.
    const reactionTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(
      new Set(),
    );
    const telemetryDedupeRef = useRef<Map<string, number>>(new Map());
    const fallbackSpaceSessionIdRef = useRef(
      createAudioSpaceTelemetryId('space_reaction'),
    );
    useEffect(
      () => () => {
        for (const t of reactionTimersRef.current) {
          clearTimeout(t);
        }
        reactionTimersRef.current.clear();
      },
      [],
    );

    const handleReact = useCallback(
      (emoji: ReactionEmoji) => {
        // Local animation
        const id = Date.now() + Math.random();
        setFloatingReactions((prev) => [
          ...prev,
          { id, emoji, offset: Math.random() * 60 - 30 },
        ]);
        const timer = setTimeout(() => {
          reactionTimersRef.current.delete(timer);
          setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
        }, 2800);
        reactionTimersRef.current.add(timer);

        // Broadcast to other participants
        const spaceSessionId =
          joined?.spaceSessionId ?? fallbackSpaceSessionIdRef.current;
        const entrySource = joined?.entrySource ?? 'unknown';
        sendReaction({ roomId, emoji })
          .then(() => {
            trackWebAudioSpaceEvent({
              eventName: AUDIO_SPACE_EVENTS.reactionSent,
              context: {
                spaceSessionId,
                roomId,
                role,
                isHost: role === 'host',
                platform: 'web',
                entrySource,
              },
              properties: { emoji },
              dedupeMap: telemetryDedupeRef.current,
              dedupeKey: `web-reaction-sent-${roomId}-${emoji}`,
              dedupeWindowMs: 500,
            });
          })
          .catch((err) => {
            trackWebAudioSpaceEvent({
              eventName: AUDIO_SPACE_EVENTS.reactionSendFailed,
              context: {
                spaceSessionId,
                roomId,
                role,
                isHost: role === 'host',
                platform: 'web',
                entrySource,
              },
              properties: {
                emoji,
                ...normalizeAudioSpaceError(err),
              },
              dedupeMap: telemetryDedupeRef.current,
              dedupeKey: `web-reaction-failed-${roomId}-${emoji}`,
              dedupeWindowMs: 1500,
            });
          });
      },
      [joined?.entrySource, joined?.spaceSessionId, roomId, role, sendReaction],
    );

    const handleCancelEnd = useCallback(() => {
      setEndConfirmationOpen(false);
    }, []);

    const handleConfirmEnd = useCallback(() => {
      setEndConfirmationOpen(false);
      onEnd?.();
    }, [onEnd]);

    return (
      <>
        {/* Floating reactions */}
        <div className="pointer-events-none fixed bottom-[72px] left-1/2 z-30 h-[300px] w-0">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-0 text-[28px]"
              style={{
                left: `${r.offset}px`,
                animation: 'floatUp 2.6s ease-out forwards',
              }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        <div className="relative mx-auto flex w-full max-w-[680px] items-center justify-between px-3 py-3 sm:px-8">
          {/* Leave / End */}
          <div className="flex items-center gap-2">
            {onEnd ? (
              <button
                type="button"
                onClick={() => setEndConfirmationOpen(true)}
                disabled={isEnding}
                className="rounded-full px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
                style={{
                  background: 'rgba(220,52,18,0.1)',
                  color: 'var(--color-red, #dc3412)',
                }}
              >
                {isEnding ? 'Ending...' : 'End'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onLeave}
                className="rounded-full px-4 py-2 text-[13px] font-semibold"
                style={{
                  background: 'rgba(220,52,18,0.1)',
                  color: 'var(--color-red, #dc3412)',
                }}
              >
                Leave
              </button>
            )}
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[16px] bg-overlay-faint hover:bg-overlay-light sm:h-10 sm:w-10 sm:text-[18px]"
                aria-label={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Mic or Hand */}
          <div className="flex items-center gap-2">
            {canSpeak ? (
              <button
                type="button"
                onClick={onMute}
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  muted
                    ? 'bg-overlay-faint text-default'
                    : 'text-white bg-action-primary'
                }`}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={onHand}
                className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-150 active:scale-95 ${
                  handRaised
                    ? 'text-white shadow-[0_0_0_2px_rgba(255,255,255,0.35)] bg-action-primary'
                    : 'bg-overlay-faint text-default hover:bg-overlay-light active:bg-overlay-medium'
                }`}
                aria-label={handRaised ? 'Lower hand' : 'Raise hand'}
                aria-pressed={handRaised}
                title={handRaised ? 'Lower hand' : 'Raise hand'}
              >
                <Hand size={18} />
                {handRaised ? (
                  <span
                    className="text-action-primary absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white"
                    aria-hidden
                  >
                    <Check size={10} aria-hidden />
                  </span>
                ) : null}
              </button>
            )}
          </div>
        </div>

        {endConfirmationOpen && (
          <ConfirmationModal
            title="End Space?"
            body="This will end the Space for everyone."
            cancelText="Keep Space"
            confirmText="End Space"
            destructive
            hideAreYouSure
            onCancel={handleCancelEnd}
            onConfirm={handleConfirmEnd}
            onBackdropClose={handleCancelEnd}
          />
        )}
      </>
    );
  },
);

LiveControls.displayName = 'LiveControls';

export { LiveControls };
