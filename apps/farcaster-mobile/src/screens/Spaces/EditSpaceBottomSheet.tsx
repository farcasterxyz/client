import { Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ApiAudioRoom } from 'farcaster-client-data';
import { useUpdateAudioRoom } from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Text } from '~/components/Text';

const ACTION_PRIMARY = '#7c65c1';

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    bg: isDark ? '#1a1a1a' : '#ffffff',
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    bgInput: isDark ? '#2a2a2a' : '#f6f6f6',
    actionPrimary: ACTION_PRIMARY,
  };
}

/**
 * Bottom sheet for editing a Space's title / description / scheduledAt.
 * Backend rejects non-host edits and limits live Spaces to title and
 * description; the trigger already gates on viewer-host.
 */
const EditSpaceBottomSheet: React.FC<{
  open: boolean;
  room: ApiAudioRoom;
  onClose: () => void;
  liveEdit?: boolean;
}> = React.memo(({ open, room, onClose, liveEdit = false }) => {
  const c = useColors();
  const toast = useToast();
  const updateAudioRoom = useUpdateAudioRoom();

  const initialDate = useMemo(() => {
    if (!room.scheduledAt) {
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      return d;
    }
    return new Date(room.scheduledAt);
  }, [room.scheduledAt]);

  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description ?? '');
  const [scheduledDate, setScheduledDate] = useState<Date>(initialDate);
  const [showPicker, setShowPicker] = useState<'date' | 'time' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(room.title);
    setDescription(room.description ?? '');
    setScheduledDate(initialDate);
    setShowPicker(null);
    setIsSaving(false);
  }, [open, room.title, room.description, initialDate]);

  const focusTitleInput = useCallback(() => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    focusTimeoutRef.current = setTimeout(
      () => titleInputRef.current?.focus(),
      120,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || isSaving) return;

    if (liveEdit) {
      setIsSaving(true);
      try {
        await updateAudioRoom({
          roomId: room.id,
          title: trimmed,
          description: description.trim(),
        });
        toast.show('Space updated', { type: 'success' });
        onClose();
      } catch (err) {
        toast.show(
          err instanceof Error ? err.message : 'Failed to update Space',
          { type: 'danger' },
        );
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      toast.show('Scheduled time must be in the future', { type: 'danger' });
      return;
    }

    setIsSaving(true);
    try {
      await updateAudioRoom({
        roomId: room.id,
        title: trimmed,
        description: description.trim(),
        scheduledAt: scheduledDate.toISOString(),
      });
      toast.show('Space updated', { type: 'success' });
      onClose();
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : 'Failed to update Space',
        { type: 'danger' },
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    title,
    description,
    scheduledDate,
    isSaving,
    liveEdit,
    updateAudioRoom,
    room.id,
    onClose,
    toast,
  ]);

  const onPickerChange = useCallback(
    (event: { type?: string }, selected?: Date) => {
      if (Platform.OS === 'android') setShowPicker(null);
      if (event?.type === 'dismissed' || !selected) return;
      setScheduledDate((prev) => {
        const next = new Date(prev);
        if (showPicker === 'date') {
          next.setFullYear(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate(),
          );
        } else if (showPicker === 'time') {
          next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        }
        return next;
      });
    },
    [showPicker],
  );

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onShow={focusTitleInput}
      onRequestClose={onClose}
    >
      {/*
       * Use React Native's built-in KeyboardAvoidingView (not the
       * keyboard-controller variant) inside RN <Modal>: keyboard-controller's
       * KAV uses parent-relative onLayout coordinates which are wrong inside
       * an iOS RN Modal until the `automaticOffset` prop landed in 1.21.0
       * (we are on ^1.20.7), and additionally has a known iOS 26 regression
       * where it only repositions after the keyboard finishes opening.
       */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.bg }]}>
          <View style={styles.grabberWrap}>
            <View style={[styles.grabber, { backgroundColor: c.border }]} />
          </View>

          <View style={[styles.header, { borderColor: c.border }]}>
            <Text style={[styles.headerTitle, { color: c.fg }]}>
              {liveEdit ? 'Edit Space' : 'Edit scheduled Space'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Octicons name="x" size={20} color={c.fg} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            <Text style={[styles.label, { color: c.fgFaint }]}>Title</Text>
            <TextInput
              ref={titleInputRef}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              placeholderTextColor={c.fgFaint}
              style={[
                styles.input,
                {
                  color: c.fg,
                  backgroundColor: c.bgInput,
                  borderColor: c.border,
                },
              ]}
            />

            <Text style={[styles.label, { color: c.fgFaint, marginTop: 16 }]}>
              Description (optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              placeholderTextColor={c.fgFaint}
              style={[
                styles.input,
                styles.textArea,
                {
                  color: c.fg,
                  backgroundColor: c.bgInput,
                  borderColor: c.border,
                },
              ]}
            />

            {!liveEdit && (
              <>
                <View style={styles.scheduleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: c.fgFaint }]}>
                      Date
                    </Text>
                    <Pressable
                      onPress={() => setShowPicker('date')}
                      style={[
                        styles.dateButton,
                        {
                          backgroundColor: c.bgInput,
                          borderColor: c.border,
                        },
                      ]}
                    >
                      <Octicons name="calendar" size={14} color={c.fg} />
                      <Text style={[styles.dateText, { color: c.fg }]}>
                        {scheduledDate.toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: c.fgFaint }]}>
                      Time
                    </Text>
                    <Pressable
                      onPress={() => setShowPicker('time')}
                      style={[
                        styles.dateButton,
                        {
                          backgroundColor: c.bgInput,
                          borderColor: c.border,
                        },
                      ]}
                    >
                      <Octicons name="clock" size={14} color={c.fg} />
                      <Text style={[styles.dateText, { color: c.fg }]}>
                        {scheduledDate.toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {showPicker && (
                  <DateTimePicker
                    value={scheduledDate}
                    mode={showPicker}
                    minimumDate={new Date()}
                    // `spinner` on iOS keeps the picker compact so opening it
                    // doesn't abruptly inflate the scroll content — the inline
                    // calendar made the sheet jump on every focus/blur.
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPickerChange}
                  />
                )}
              </>
            )}
            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={[styles.footer, { borderColor: c.border }]}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: c.fgFaint }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!title.trim() || isSaving}
              style={[
                styles.submitButton,
                {
                  backgroundColor: c.actionPrimary,
                  opacity: !title.trim() || isSaving ? 0.5 : 1,
                },
              ]}
            >
              <Octicons name="check" size={13} color="white" />
              <Text style={styles.submitText}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

EditSpaceBottomSheet.displayName = 'EditSpaceBottomSheet';

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  grabberWrap: { alignItems: 'center', paddingTop: 8 },
  grabber: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingVertical: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  scheduleRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateText: { fontSize: 14, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { fontSize: 14, fontWeight: '500' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  submitText: { color: 'white', fontWeight: '700', fontSize: 14 },
});

export { EditSpaceBottomSheet };
