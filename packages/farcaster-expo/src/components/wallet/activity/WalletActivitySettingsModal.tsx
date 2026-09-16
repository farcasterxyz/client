import { ListFilter } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';
import {
  useWalletActivityHideMicrotransactions,
  useWalletActivityHideSpam,
} from '../../../hooks/useWalletPreferences';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import { Switch } from '../../design-system/Switch';
import { Text2 } from '../../design-system/Text';

export function WalletActivitySettingsModal({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  const [hideSpam, setHideSpam] = useWalletActivityHideSpam();
  const [hideMicrotransactions, setHideMicrotransactions] =
    useWalletActivityHideMicrotransactions();

  return (
    <AutoDisplayingBottomSheetModal
      name="walletActivitySettingsBottomPopup"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View style={[t.flexCol, { gap: 4 }]}>
        <View style={[t.flexRow, t.itemsCenter, t.mB2, { gap: 12 }]}>
          <ListFilter size={24} />
          <Text2 weight="semibold" size="lg">
            Activity Settings
          </Text2>
        </View>
        <HideMicrotransactionsToggle
          hideMicrotransactions={hideMicrotransactions}
          setHideMicrotransactions={setHideMicrotransactions}
        />
        <HideSpamToggle hideSpam={hideSpam} setHideSpam={setHideSpam} />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

function HideMicrotransactionsToggle({
  hideMicrotransactions = false,
  setHideMicrotransactions,
}: {
  hideMicrotransactions?: boolean;
  setHideMicrotransactions: (value: boolean) => void;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const [localHideMicrotransactions, setLocalHideMicrotransactions] = useState(
    hideMicrotransactions,
  );

  const handleToggleChangeMicrotransactions = (value: boolean) => {
    triggerImpactAsync();
    setLocalHideMicrotransactions(value);
    setHideMicrotransactions(value);
  };

  return (
    <View style={[t.flexRow, t.p3, t.itemsCenter]}>
      <View style={[t.flexCol, { gap: 4 }, t.flex1]}>
        <Text2 weight="medium" size="base">
          Hide microtransactions
        </Text2>
        <Text2 color="secondary" size="sm">
          Filter out transactions less than $0.10
        </Text2>
      </View>
      <Switch
        value={localHideMicrotransactions}
        onValueChange={handleToggleChangeMicrotransactions}
        newColors
      />
      {/* <View style={[{ gap: 4 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
        </View>
      </View>

      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.pX5,
          t.mB3,
          t.backgrounds.secondary,
          { paddingVertical: 14, borderRadius: 12 },
        ]}
      >
        <Text2 weight="medium" size="base">
          Hide microtransactions
        </Text2>
      </View> */}
    </View>
  );
}

function HideSpamToggle({
  hideSpam = true,
  setHideSpam,
}: {
  hideSpam?: boolean;
  setHideSpam: (value: boolean) => void;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const [localHideSpam, setLocalHideSpam] = useState(hideSpam);

  const handleToggleChangeSpam = (value: boolean) => {
    triggerImpactAsync();
    setLocalHideSpam(value);
    setHideSpam(value);
  };

  return (
    <View style={[t.flexRow, t.p3, t.itemsCenter]}>
      <View style={[t.flexCol, { gap: 4 }, t.flex1]}>
        <Text2 weight="medium" size="base">
          Hide unusual activity
        </Text2>
        <Text2 color="secondary" size="sm">
          Filter out unusual transfers to your wallet
        </Text2>
      </View>
      <Switch
        value={localHideSpam}
        onValueChange={handleToggleChangeSpam}
        newColors
      />
    </View>
  );
}
