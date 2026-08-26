import { Octicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  normalizeAudioSpaceError,
  useStartAudioRoom,
} from 'farcaster-client-hooks';
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

import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useSpace } from '~/contexts/SpaceContext';
import { usePush } from '~/hooks/navigation/usePush';
import { trackMobileAudioSpaceEvent } from '~/utils/AudioSpaceInstrumentation';

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

type Mode = 'now' | 'schedule';
type CreateSpaceBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
};

/**
 * Bottom-sheet modal for starting or scheduling a Space (mobile parity with
 * web `CreateSpaceModal`). "Start now" creates + joins + navigates.
 * "Schedule" creates a future-dated room and dismisses.
 */
const CreateSpaceBottomSheet: React.FC<CreateSpaceBottomSheetProps> =
  React.memo(({ open, onClose, initialMode = 'now' }) => {
    const c = useColors();
    const toast = useToast();
    const startAudioRoom = useStartAudioRoom();
    const { join, prepareForNewLiveSpace } = useSpace();
    const push = usePush();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mode, setMode] = useState<Mode>('now');
    const [scheduledDate, setScheduledDate] = useState<Date>(() => {
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      return d;
    });
    const [recordingEnabled, setRecordingEnabled] = useState(true);
    const [showPicker, setShowPicker] = useState<'date' | 'time' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const telemetrySessionIdRef = useRef(
      createAudioSpaceTelemetryId('space_create_sheet'),
    );
    const titleInputRef = useRef<TextInput>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasOpenRef = useRef(false);

    // Reset only on closed -> open transitions.
    useEffect(() => {
      if (open && !wasOpenRef.current) {
        setTitle('');
        setDescription('');
        setMode(initialMode);
        const d = new Date();
        d.setHours(d.getHours() + 1, 0, 0, 0);
        setScheduledDate(d);
        setRecordingEnabled(true);
        setShowPicker(null);
        setIsSubmitting(false);
      }

      wasOpenRef.current = open;
    }, [open, initialMode]);

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

    const scheduledLabel = useMemo(() => {
      return scheduledDate.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }, [scheduledDate]);

    const handleSubmit = useCallback(async () => {
      const trimmed = title.trim();
      if (!trimmed || isSubmitting) return;

      if (mode === 'schedule') {
        if (scheduledDate.getTime() <= Date.now()) {
          toast.show('Scheduled time must be in the future', {
            type: 'danger',
          });
          return;
        }
        setIsSubmitting(true);
        try {
          await startAudioRoom({
            title: trimmed,
            description: description.trim() || undefined,
            scheduledAt: scheduledDate.toISOString(),
            recordingEnabled,
          });
          trackMobileAudioSpaceEvent({
            eventName: AUDIO_SPACE_EVENTS.openSource,
            context: {
              spaceSessionId: telemetrySessionIdRef.current,
              platform: 'mobile',
              entrySource: 'spaces_list',
            },
            properties: {
              source: 'schedule_created',
            },
          });
          onClose();
          toast.show('Space scheduled', { type: 'success' });
        } catch (err) {
          trackMobileAudioSpaceEvent({
            eventName: AUDIO_SPACE_EVENTS.scheduleApiFailed,
            context: {
              spaceSessionId: telemetrySessionIdRef.current,
              platform: 'mobile',
              entrySource: 'spaces_list',
            },
            properties: {
              source: 'schedule_create',
              ...normalizeAudioSpaceError(err),
            },
          });
          toast.show(
            err instanceof Error ? err.message : 'Failed to schedule Space',
            { type: 'danger' },
          );
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
        trackMobileAudioSpaceEvent({
          eventName: AUDIO_SPACE_EVENTS.openSource,
          context: {
            spaceSessionId: telemetrySessionIdRef.current,
            roomId: result.room.id,
            platform: 'mobile',
            entrySource: 'spaces_list',
          },
          properties: {
            source: 'start_now',
          },
        });
        const didJoin = await join(result.room.id, 'spaces_list', {
          skipSwitchConfirmation: true,
        });
        if (!didJoin) {
          return;
        }
        push('SpaceRoom', { roomId: result.room.id });
      } catch (err) {
        trackMobileAudioSpaceEvent({
          eventName: AUDIO_SPACE_EVENTS.createApiFailed,
          context: {
            spaceSessionId: telemetrySessionIdRef.current,
            platform: 'mobile',
            entrySource: 'spaces_list',
          },
          properties: {
            source: 'start_now',
            ...normalizeAudioSpaceError(err),
          },
        });
        toast.show(
          err instanceof Error ? err.message : 'Failed to start Space',
          {
            type: 'danger',
          },
        );
      } finally {
        setIsSubmitting(false);
      }
    }, [
      title,
      description,
      mode,
      scheduledDate,
      recordingEnabled,
      isSubmitting,
      startAudioRoom,
      prepareForNewLiveSpace,
      onClose,
      join,
      push,
      toast,
    ]);

    const onPickerChange = useCallback(
      (event: { type?: string }, selected?: Date) => {
        // Android dismisses the modal automatically; iOS keeps it inline.
        if (Platform.OS === 'android') {
          setShowPicker(null);
        }
        if (event?.type === 'dismissed' || !selected) return;
        setScheduledDate((prev) => {
          // If user changed only the date, preserve the time, and vice versa.
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
         *
         * Behavior `padding` on iOS pushes the sheet up by the keyboard height;
         * `height` on Android resizes the avoiding view (keeps the title input
         * visible without flipping `windowSoftInputMode`).
         */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: c.bg }]}>
            {/* Grabber */}
            <View style={styles.grabberWrap}>
              <View style={[styles.grabber, { backgroundColor: c.border }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderColor: c.border }]}>
              <Text style={[styles.headerTitle, { color: c.fg }]}>
                {mode === 'now' ? 'Start a Space' : 'Schedule a Space'}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Octicons name="x" size={20} color={c.fg} />
              </Pressable>
            </View>

            {/* Mode toggle */}
            <View style={[styles.modeRow, { borderColor: c.border }]}>
              <Pressable
                onPress={() => setMode('now')}
                style={styles.modeButton}
              >
                <Text
                  style={[
                    styles.modeText,
                    { color: mode === 'now' ? c.fg : c.fgFaint },
                  ]}
                >
                  Start now
                </Text>
                {mode === 'now' && (
                  <View
                    style={[
                      styles.modeUnderline,
                      { backgroundColor: c.actionPrimary },
                    ]}
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() => setMode('schedule')}
                style={styles.modeButton}
              >
                <Text
                  style={[
                    styles.modeText,
                    { color: mode === 'schedule' ? c.fg : c.fgFaint },
                  ]}
                >
                  Schedule
                </Text>
                {mode === 'schedule' && (
                  <View
                    style={[
                      styles.modeUnderline,
                      { backgroundColor: c.actionPrimary },
                    ]}
                  />
                )}
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
                placeholder="What are you talking about?"
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
                placeholder="What will you discuss?"
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

              {mode === 'schedule' && (
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
              )}

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

              <View
                style={[
                  styles.recordingToggleRow,
                  {
                    backgroundColor: c.bgInput,
                    borderColor: c.border,
                  },
                ]}
              >
                <Pressable
                  onPress={() => setRecordingEnabled((value) => !value)}
                  style={styles.recordingToggleCopy}
                >
                  <Text style={[styles.recordingToggleTitle, { color: c.fg }]}>
                    Record this Space
                  </Text>
                  <Text
                    style={[
                      styles.recordingToggleDescription,
                      { color: c.fgFaint },
                    ]}
                  >
                    Recording is locked when the Space starts.
                  </Text>
                </Pressable>
                <Switch
                  value={recordingEnabled}
                  onValueChange={setRecordingEnabled}
                />
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderColor: c.border }]}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: c.fgFaint }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: c.actionPrimary,
                    opacity: !title.trim() || isSubmitting ? 0.5 : 1,
                  },
                ]}
              >
                <Octicons
                  name={mode === 'now' ? 'unmute' : 'calendar'}
                  size={13}
                  color="white"
                />
                <Text style={styles.submitText}>
                  {isSubmitting
                    ? mode === 'now'
                      ? 'Starting…'
                      : 'Scheduling…'
                    : mode === 'now'
                      ? 'Start now'
                      : `Schedule (${scheduledLabel})`}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  });

CreateSpaceBottomSheet.displayName = 'CreateSpaceBottomSheet';

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
  modeRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: { fontSize: 13, fontWeight: '500' },
  modeUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: 56,
    borderRadius: 2,
  },
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
  recordingToggleRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  recordingToggleCopy: { flex: 1, minWidth: 0 },
  recordingToggleTitle: { fontSize: 14, fontWeight: '700' },
  recordingToggleDescription: { fontSize: 12, marginTop: 2 },
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

export { CreateSpaceBottomSheet };
