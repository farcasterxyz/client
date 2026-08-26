import React from 'react';
import { ScrollView } from 'react-native';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';

import { useStarterPacksSetupSteps } from './StepsProvider';

export function StarterPackCategoriesModal({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const modalRef = React.useRef<{ dismiss: () => void }>(null);

  const [, dispatch] = useStarterPacksSetupSteps();

  const onSelect = React.useCallback(
    ({ label }: { label: string }) => {
      dispatch({ type: 'AddLabel', label: label });

      setTimeout(() => modalRef.current?.dismiss(), 300);
    },
    [dispatch],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="starterPackCategoriesModal"
      onDismiss={onDismiss}
      ref={modalRef}
    >
      <StarterPackCategories onSelect={onSelect} />
    </AutoDisplayingBottomSheetModal>
  );
}

function StarterPackCategories({
  onSelect,
}: {
  onSelect: ({ label }: { label: string }) => void;
}) {
  const interests = React.useMemo(() => {
    return [
      'Crypto',
      'Programming',
      'Technology',
      'Memes',
      'TV/Movies',
      'Books',
      'Gaming',
      'Music',
      'Sports',
      'Art',
      'News',
      'Health',
      'Food',
      'Travel',
    ];
  }, []);

  const buttonGroupOptions = React.useMemo(() => {
    const options: ButtonGroupOption[] = [];
    for (const interest of interests) {
      options.push({
        label: interest,
        onPress: () => {
          onSelect({ label: interest });
        },
      });
    }

    return options;
  }, [interests, onSelect]);

  return (
    <ScrollView>
      <ButtonGroup options={buttonGroupOptions} />
    </ScrollView>
  );
}
