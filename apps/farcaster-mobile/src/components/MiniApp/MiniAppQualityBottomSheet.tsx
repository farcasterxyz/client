import { Octicons } from '@expo/vector-icons';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ApiMiniAppQuality } from 'farcaster-client-data';
import { useSetMiniAppQuality } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, {
  ComponentProps,
  FC,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { useBottomSheetModalRef } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';

interface MiniAppQualityBottomSheetProps {
  domain: string;
  name?: string;
  harmful?: boolean;
  onDismiss: () => void;
}

const qualityOptions: {
  value: ApiMiniAppQuality;
  icon: ComponentProps<typeof Octicons>['name'];
  label: string;
}[] = [
  { value: 'neutral', icon: 'dash', label: 'Neutral' },
  { value: 'harmful', icon: 'stop', label: 'Harmful' },
];

const MiniAppQualityBottomSheet: FC<MiniAppQualityBottomSheetProps> = ({
  domain,
  name,
  harmful,
  onDismiss,
}) => {
  const t = useTheme();
  const toast = useToast();
  const bottomSheetRef = useBottomSheetModalRef();
  const { mutateAsync: setMiniAppQuality, isPending } = useSetMiniAppQuality();
  const [reason, setReason] = useState('');
  const [selectedQuality, setSelectedQuality] = useState<ApiMiniAppQuality>(
    harmful ? 'harmful' : 'neutral',
  );

  const canSubmit = useMemo(() => {
    if (selectedQuality === 'harmful' && reason.trim().length === 0) {
      return false;
    }
    return true;
  }, [reason, selectedQuality]);

  const updateQuality = useCallback(async () => {
    try {
      await setMiniAppQuality({
        domain,
        quality: selectedQuality,
        reason,
      });
      onDismiss();
    } catch (error) {
      trackError(error);
      toast.show('Failed to update mini app quality', { type: 'danger' });
    }
  }, [setMiniAppQuality, domain, selectedQuality, reason, onDismiss, toast]);

  const handleUpdate = useCallback(() => {
    if (selectedQuality === 'harmful') {
      Alert.alert(
        'Mark as harmful?',
        `This will hide "${name ?? domain}" from all users.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Harmful',
            style: 'destructive',
            onPress: updateQuality,
          },
        ],
      );
    } else {
      updateQuality();
    }
  }, [selectedQuality, updateQuality, name, domain]);

  return (
    <AutoDisplayingBottomSheetModal
      name="miniAppQuality"
      ref={bottomSheetRef}
      onDismiss={onDismiss}
    >
      <View style={[t.p4]}>
        {qualityOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setSelectedQuality(option.value)}
            style={[
              t.flexRow,
              t.itemsCenter,
              t.p3,
              t.mB2,
              t.borderHairline,
              t.borderDefault,
              t.rounded,
              selectedQuality === option.value ? t.bgFaintOld : undefined,
              { gap: 8 },
            ]}
          >
            <Octicons
              name={option.icon}
              size={16}
              color={t.colors.text.primary}
            />
            <Text style={[t.texts.primary]}>{option.label}</Text>
          </Pressable>
        ))}
        <Text style={[t.texts.primary, t.mB1, t.mT2]}>
          Reason{selectedQuality === 'harmful' ? ' (required)' : ''}:
        </Text>
        <BottomSheetTextInput
          autoCapitalize="none"
          autoCorrect={true}
          multiline={true}
          numberOfLines={3}
          maxLength={256}
          placeholder="Enter reason..."
          placeholderTextColor={t.colors.text.secondary}
          style={[
            t.border,
            t.textSm,
            t.p2,
            t.borderDefault,
            t.borderHairline,
            t.borderBHairline,
            t.h15,
            { color: t.colors.text.primary },
          ]}
          onChangeText={setReason}
          value={reason}
        />
        <AtomsButton
          size="l"
          hierarchy="primary"
          style={[t.mT6]}
          disabled={!canSubmit || isPending}
          onPress={handleUpdate}
        >
          Update
        </AtomsButton>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

MiniAppQualityBottomSheet.displayName = 'MiniAppQualityBottomSheet';

export { MiniAppQualityBottomSheet };
