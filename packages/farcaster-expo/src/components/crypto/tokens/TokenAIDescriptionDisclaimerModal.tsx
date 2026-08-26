import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import { Text2 } from '../../design-system/Text';

export function TokenAIDescriptionDisclaimerModal({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  return (
    <AutoDisplayingBottomSheetModal
      name="tokenAIDescriptionDisclaimerBottomPopup"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View style={[t.flexCol, { gap: 8 }]}>
        <Text2 weight="semibold" size="lg">
          AI generated content
        </Text2>
        <View
          style={[
            t.wFull,
            {
              height: 1,
              backgroundColor: t.colors.border.secondary,
            },
          ]}
        />
        <Text2>
          This content was created with the help of artificial intelligence and
          may contain inaccuracies.
        </Text2>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
