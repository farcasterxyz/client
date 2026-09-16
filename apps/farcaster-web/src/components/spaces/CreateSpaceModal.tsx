import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  normalizeAudioSpaceError,
  useStartAudioRoom,
} from 'farcaster-client-hooks';
import { Calendar, Clock, Mic, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Toggle } from '~/components/forms/Toggle';
import { useSpace } from '~/contexts/SpaceContext';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';
import { toast } from '~/utils/toast';

type Props = {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
};

type Mode = 'now' | 'schedule';

/**
 * Modal for starting or scheduling a Space.
 * "Start now" creates a live room immediately.
 * "Schedule" creates a scheduled room for a future date/time.
 */
const CreateSpaceModal: React.FC<Props> = React.memo(
  ({ open, onClose, initialMode = 'now' }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mode, setMode] = useState<Mode>('now');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [recordingEnabled, setRecordingEnabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const telemetrySessionId = React.useMemo(
      () => createAudioSpaceTelemetryId('space_create_modal'),
      [],
    );
    const startAudioRoom = useStartAudioRoom();
    const { join, prepareForNewLiveSpace } = useSpace();
    const navigate = useNavigate();

    useEffect(() => {
      if (open) {
        setTitle('');
        setDescription('');
        setMode(initialMode);
        setScheduledDate('');
        setScheduledTime('');
        setRecordingEnabled(true);
        setIsSubmitting(false);
      }
    }, [open, initialMode]);

    useEffect(() => {
      if (!open) {
        return;
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const handleSubmit = useCallback(async () => {
      const trimmed = title.trim();
      if (!trimmed || isSubmitting) {
        return;
      }

      if (mode === 'schedule') {
        if (!scheduledDate || !scheduledTime) {
          toast({ message: 'Pick a date and time', type: 'error' });
          return;
        }
        const scheduledAt = new Date(
          `${scheduledDate}T${scheduledTime}`,
        ).toISOString();
        if (new Date(scheduledAt).getTime() <= Date.now()) {
          toast({
            message: 'Scheduled time must be in the future',
            type: 'error',
          });
          return;
        }

        setIsSubmitting(true);
        try {
          await startAudioRoom({
            title: trimmed,
            description: description.trim() || undefined,
            scheduledAt,
            recordingEnabled,
          });
          trackWebAudioSpaceEvent({
            eventName: AUDIO_SPACE_EVENTS.openSource,
            context: {
              spaceSessionId: telemetrySessionId,
              platform: 'web',
              entrySource: 'spaces_list',
            },
            properties: { source: 'schedule_created' },
          });
          onClose();
          toast({ message: 'Space scheduled', type: 'success' });
        } catch (err) {
          trackWebAudioSpaceEvent({
            eventName: AUDIO_SPACE_EVENTS.scheduleApiFailed,
            context: {
              spaceSessionId: telemetrySessionId,
              platform: 'web',
              entrySource: 'spaces_list',
            },
            properties: {
              source: 'schedule_create',
              ...normalizeAudioSpaceError(err),
            },
          });
          toast({
            message:
              err instanceof Error ? err.message : 'Failed to schedule Space',
            type: 'error',
          });
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Start now
      const canCreate = await prepareForNewLiveSpace();
      if (!canCreate) {
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await startAudioRoom({
          title: trimmed,
          description: description.trim() || undefined,
          recordingEnabled,
        });
        onClose();
        const didJoin = await join(result.room.id, 'spaces_list', {
          skipSwitchConfirmation: true,
        });
        if (!didJoin) {
          return;
        }
        navigate({ to: 'spaces', params: { roomId: result.room.id } });
      } catch (err) {
        trackWebAudioSpaceEvent({
          eventName: AUDIO_SPACE_EVENTS.createApiFailed,
          context: {
            spaceSessionId: telemetrySessionId,
            platform: 'web',
            entrySource: 'spaces_list',
          },
          properties: {
            source: 'start_now',
            ...normalizeAudioSpaceError(err),
          },
        });
        toast({
          message: err instanceof Error ? err.message : 'Failed to start Space',
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    }, [
      title,
      description,
      mode,
      scheduledDate,
      scheduledTime,
      recordingEnabled,
      isSubmitting,
      startAudioRoom,
      prepareForNewLiveSpace,
      onClose,
      join,
      navigate,
      telemetrySessionId,
    ]);

    if (!open) {
      return null;
    }

    // Minimum date for the date picker (today)
    const today = new Date().toISOString().split('T')[0];

    return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-[560px] rounded-2xl border shadow-2xl bg-app border-faint"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 border-faint">
            <div className="text-[16px] font-semibold text-default">
              {mode === 'now' ? 'Start a Space' : 'Schedule a Space'}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-overlay-light"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex border-b border-faint">
            <button
              type="button"
              onClick={() => setMode('now')}
              className={`relative flex-1 px-4 py-2.5 text-center text-[13px] font-medium transition-colors ${
                mode === 'now' ? 'text-default' : 'text-faint'
              }`}
            >
              Start now
              {mode === 'now' && (
                <span className="absolute inset-x-0 bottom-0 mx-auto h-[2px] w-12 rounded-full bg-action-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMode('schedule')}
              className={`relative flex-1 px-4 py-2.5 text-center text-[13px] font-medium transition-colors ${
                mode === 'schedule' ? 'text-default' : 'text-faint'
              }`}
            >
              Schedule
              {mode === 'schedule' && (
                <span className="absolute inset-x-0 bottom-0 mx-auto h-[2px] w-12 rounded-full bg-action-primary" />
              )}
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 px-4 py-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-faint">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && mode === 'now') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="What are you talking about?"
                autoFocus
                maxLength={120}
                className="focus:border-action-primary w-full rounded-lg border bg-transparent px-3 py-2.5 text-[15px] outline-none border-faint"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-[13px] font-medium text-faint">
                Description{' '}
                <span className="text-faint/60 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will you discuss?"
                rows={2}
                maxLength={500}
                className="focus:border-action-primary w-full resize-none rounded-lg border bg-transparent px-3 py-2.5 text-[14px] outline-none border-faint"
              />
            </div>

            {/* Schedule fields */}
            {mode === 'schedule' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-faint">
                    <Calendar size={13} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    min={today}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="focus:border-action-primary w-full rounded-lg border bg-transparent px-3 py-2.5 text-[14px] outline-none border-faint"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-faint">
                    <Clock size={13} />
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="focus:border-action-primary w-full rounded-lg border bg-transparent px-3 py-2.5 text-[14px] outline-none border-faint"
                  />
                </div>
              </div>
            )}

            <div className="rounded-lg border px-3 py-3 border-faint">
              <Toggle
                label="Record this Space"
                description="Recording is locked when the Space starts."
                value={recordingEnabled}
                onValueChange={setRecordingEnabled}
                labelClassName="text-[14px] font-semibold text-default"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t px-4 py-3 border-faint">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-[14px] font-medium text-faint hover:bg-overlay-light"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold text-white bg-action-primary hover:opacity-90 disabled:opacity-40"
            >
              {mode === 'now' ? (
                <>
                  <Mic size={13} />
                  {isSubmitting ? 'Starting...' : 'Start now'}
                </>
              ) : (
                <>
                  <Calendar size={13} />
                  {isSubmitting ? 'Scheduling...' : 'Schedule'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

CreateSpaceModal.displayName = 'CreateSpaceModal';

export { CreateSpaceModal };
