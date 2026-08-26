import React, { ReactElement, useCallback, useMemo } from 'react';
import { ColorValue, View } from 'react-native';

import {
  BottomSheetContentContainer,
  BottomSheetHeader,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type UseConfirmBottomSheetOptions = {
  onConfirm: () => void;
  onCancel?: () => void;
};

export function useConfirmBottomSheet({
  onConfirm,
  onCancel,
}: UseConfirmBottomSheetOptions) {
  const modalRef = useBottomSheetModalRef();

  const open = useCallback(() => {
    modalRef.current?.present();
  }, [modalRef]);

  const close = useCallback(() => {
    modalRef.current?.dismiss();
  }, [modalRef]);

  const wrappedOnCancel = useCallback(() => {
    modalRef.current?.dismiss();
    void onCancel?.();
  }, [modalRef, onCancel]);

  const wrappedOnConfirm = useCallback(() => {
    modalRef.current?.dismiss();
    void onConfirm();
  }, [modalRef, onConfirm]);

  return {
    open,
    close,
    modalRef,
    props: {
      onConfirm: wrappedOnConfirm,
      onCancel: wrappedOnCancel,
    },
  };
}

export type ConfirmBottomSheetProps<T = undefined> = {
  onCancel: () => void;
  onConfirm: () => void;
} & T;

export function ConfirmActionBottomSheet({
  Icon,
  title,
  Body,
  destructive,
  hideAreYouSure = false,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onCancel,
  onConfirm,
}: {
  Icon: (options: { size: number; color: ColorValue }) => ReactElement;
  Body: ReactElement | string;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
  cancelText?: string;
  confirmText?: string;
  hideAreYouSure?: boolean;
}) {
  const t = useTheme();

  const BodyComp = useMemo(() => {
    if (typeof Body === 'string') {
      return <Text2>{Body}</Text2>;
    }

    return Body;
  }, [Body]);

  const iconBgColor = useMemo(() => {
    if (destructive) {
      return t.dark ? '#2A1021' : '#FBE7EB';
    }

    // Same as notifications
    return '#e6e0f4';
  }, [destructive, t]);

  return (
    <BottomSheetContentContainer>
      <BottomSheetHeader
        Icon={Icon({
          size: 20,
          color: destructive ? t.colors.text.danger : '#8565cb',
        })}
        iconBgColor={iconBgColor}
        title={title}
      />
      {BodyComp}
      {!hideAreYouSure && (
        <Text2 style={[t.mT4]} color="secondary">
          Are you sure you want to proceed?
        </Text2>
      )}
      <View style={[t.mT4, t.wFull, t.flexRow, { gap: 12 }]}>
        <ButtonV2
          title={cancelText}
          variant="secondary"
          onPress={onCancel}
          width="flex1"
        />
        <ButtonV2
          title={confirmText}
          variant={destructive ? 'destructive' : 'primary'}
          onPress={onConfirm}
          width="flex1"
        />
      </View>
    </BottomSheetContentContainer>
  );
}
