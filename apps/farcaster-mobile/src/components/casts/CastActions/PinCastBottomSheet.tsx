import { AnalyticsEvent } from 'farcaster-analytics';
import { usePinCast, useTrackEvent } from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { FC, memo, useCallback } from 'react';
import { View } from 'react-native';

import { BottomSheetHeader } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { MegaphoneIcon } from '~/components/images/Megaphone';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';

interface PinCastBottomSheetProps {
  castHash: string;
  channelKey: string;
  onDismiss: () => void;
}

const PinCastBottomSheet: FC<PinCastBottomSheetProps> = memo(
  ({ castHash, channelKey, onDismiss }) => {
    const t = useTheme();
    const toast = useRootToast();
    const { trackEvent } = useTrackEvent();

    const pinCast = usePinCast();

    const doPinCast = useCallback(
      async (notify: boolean) => {
        try {
          await pinCast({ castHash, notifyChannelMembers: notify, channelKey });

          if (notify) {
            toast.show('All channel members were notified', {
              type: 'generic',
              data: {
                icon: <MegaphoneIcon color={t.colors.text.primary} size={18} />,
              },
            });
          } else {
            toast.show('Cast pinned', { type: 'generic' });
          }

          trackEvent(AnalyticsEvent.ClickPinCast, { notify });

          onDismiss();
        } catch (error) {
          trackError(error);
          toast.show('Error pinning, please try again later', {
            placement: 'top',
            type: 'danger',
          });
        }
      },
      [castHash, channelKey, onDismiss, pinCast, toast, trackEvent, t],
    );

    return (
      <AutoDisplayingBottomSheetModal
        name="sendAnnouncement"
        onDismiss={onDismiss}
      >
        <BottomSheetHeader
          Icon={<MegaphoneIcon color="#8565cb" size={18} />}
          iconBgColor="purple"
          title="Announcement"
        />
        <Text2 style={[t.mT2]}>
          Would you like to notify all channel followers about this cast?
        </Text2>
        <View style={[t.mT5, t.wFull, t.flexRow, { gap: 12 }]}>
          <ButtonV2
            title="Don't notify"
            variant="tertiary"
            onPress={() => doPinCast(false)}
            width="flex1"
          />
          <ButtonV2
            title="Notify"
            variant="primary"
            onPress={() => doPinCast(true)}
            width="flex1"
          />
        </View>
      </AutoDisplayingBottomSheetModal>
    );
  },
);
PinCastBottomSheet.displayName = 'PinCastBottomSheet';

export { PinCastBottomSheet };
