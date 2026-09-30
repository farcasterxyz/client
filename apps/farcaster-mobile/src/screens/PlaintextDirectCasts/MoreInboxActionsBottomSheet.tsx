import { Octicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';

interface MoreInboxActionsBottomSheetProps {
  onDismiss: () => void;
}

const MoreInboxActionsBottomSheet = ({
  onDismiss,
}: MoreInboxActionsBottomSheetProps) => {
  const t = useTheme();
  const push = usePush();
  const { triggerImpactAsync } = useHaptics();

  const options = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    opts.push({
      label: 'Archived Conversations',
      icon: () => (
        <Octicons name="archive" size={24} color={t.colors.text.primary} />
      ),
      onPress: () => {
        triggerImpactAsync();
        push('DirectCastsArchived', {});
        onDismiss();
      },
    });
    opts.push({
      label: 'Settings',
      icon: () => (
        <Octicons name="gear" size={24} color={t.colors.text.primary} />
      ),
      onPress: () => {
        triggerImpactAsync();
        push('DirectCastSettings', {});
        onDismiss();
      },
    });
    return opts;
  }, [onDismiss, push, triggerImpactAsync, t.colors.text.primary]);

  return (
    <AutoDisplayingBottomSheetModal
      name="MoreInboxActionsBottomSheet"
      onDismiss={onDismiss}
    >
      <ButtonGroup options={options} />
    </AutoDisplayingBottomSheetModal>
  );
};

export { MoreInboxActionsBottomSheet };
