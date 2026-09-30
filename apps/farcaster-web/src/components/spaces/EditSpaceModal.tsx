import { ApiAudioRoom } from 'farcaster-client-data';
import { useUpdateAudioRoom } from 'farcaster-client-hooks';
import { Calendar, Check, Clock, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from '~/utils/toast';

/**
 * Modal for editing a Space's title / description / scheduledAt.
 * Host-only; the trigger should already gate on viewer-host. Backend
 * additionally rejects non-host edits and limits live Spaces to title and
 * description.
 */
const EditSpaceModal: React.FC<{
  open: boolean;
  room: ApiAudioRoom;
  onClose: () => void;
  liveEdit?: boolean;
}> = React.memo(({ open, room, onClose, liveEdit = false }) => {
  const updateAudioRoom = useUpdateAudioRoom();

  const initialDate = useMemo(() => {
    if (!room.scheduledAt) {
      return '';
    }
    return new Date(room.scheduledAt).toISOString().slice(0, 10);
  }, [room.scheduledAt]);

  const initialTime = useMemo(() => {
    if (!room.scheduledAt) {
      return '';
    }
    const d = new Date(room.scheduledAt);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }, [room.scheduledAt]);

  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description ?? '');
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [scheduledTime, setScheduledTime] = useState(initialTime);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(room.title);
      setDescription(room.description ?? '');
      setScheduledDate(initialDate);
      setScheduledTime(initialTime);
      setIsSaving(false);
    }
  }, [open, room.title, room.description, initialDate, initialTime]);

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

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving) {
      return;
    }

    if (liveEdit) {
      setIsSaving(true);
      try {
        await updateAudioRoom({
          roomId: room.id,
          title: trimmedTitle,
          description: description.trim(),
        });
        toast({ message: 'Space updated', type: 'success' });
        onClose();
      } catch (err) {
        toast({
          message:
            err instanceof Error ? err.message : 'Failed to update Space',
          type: 'error',
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    let scheduledAt: string | undefined;
    if (scheduledDate && scheduledTime) {
      const next = new Date(`${scheduledDate}T${scheduledTime}`);
      if (isNaN(next.getTime()) || next.getTime() <= Date.now()) {
        toast({
          message: 'Scheduled time must be in the future',
          type: 'error',
        });
        return;
      }
      scheduledAt = next.toISOString();
    }

    setIsSaving(true);
    try {
      await updateAudioRoom({
        roomId: room.id,
        title: trimmedTitle,
        description: description.trim(),
        scheduledAt,
      });
      toast({ message: 'Space updated', type: 'success' });
      onClose();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : 'Failed to update Space',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    description,
    scheduledDate,
    scheduledTime,
    isSaving,
    liveEdit,
    updateAudioRoom,
    room.id,
    onClose,
  ]);

  if (!open) {
    return null;
  }

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
        <div className="flex items-center justify-between border-b px-4 py-3 border-faint">
          <div className="text-[16px] font-semibold text-default">
            {liveEdit ? 'Edit Space' : 'Edit scheduled Space'}
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

        <div className="space-y-4 px-4 py-4">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-faint">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              autoFocus
              className="focus:border-action-primary w-full rounded-lg border bg-transparent px-3 py-2.5 text-[15px] outline-none border-faint"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-faint">
              Description{' '}
              <span className="text-faint/60 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="focus:border-action-primary w-full resize-none rounded-lg border bg-transparent px-3 py-2.5 text-[14px] outline-none border-faint"
            />
          </div>

          {!liveEdit && (
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
        </div>

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
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold text-white bg-action-primary hover:opacity-90 disabled:opacity-40"
          >
            <Check size={13} />
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
});

EditSpaceModal.displayName = 'EditSpaceModal';

export { EditSpaceModal };
