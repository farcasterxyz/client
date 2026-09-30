import { ApiChannel, isHandledFetchError } from 'farcaster-client-data';
import {
  ChannelUpdateAttributes,
  useChannel,
  useUpdateChannel,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useEffect } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';

interface EditChannelAttributeProps {
  channelKey: string;
  onChannlLoad: (channel: ApiChannel | undefined) => void;
  getUpdateAttributes: () => ChannelUpdateAttributes;
  saveDisabled: () => boolean;
  scrollable?: boolean;
  children: (channel: ApiChannel) => React.ReactNode;
}

const EditChannelAttribute: FC<EditChannelAttributeProps> = memo(
  ({
    channelKey,
    onChannlLoad,
    getUpdateAttributes,
    saveDisabled,
    scrollable = false,
    children,
  }) => {
    const t = useTheme();
    const pop = usePop();
    const updateChannel = useUpdateChannel();
    const { data: channel } = useChannel({ key: channelKey });

    useEffect(() => {
      onChannlLoad(channel);
    }, [channel, onChannlLoad]);

    const onSave = useCallback(async () => {
      try {
        await updateChannel({
          key: channelKey,
          ...getUpdateAttributes(),
        });
        pop();
      } catch (error) {
        if (isHandledFetchError(error) && error.responseData.errors.length) {
          const message = error.responseData.errors[0].message;
          return Alert.alert('Error editing channel', message, [
            {
              text: 'OK',
            },
          ]);
        } else {
          return Alert.alert(
            'Error editing channel',
            'Please try again later',
            [
              {
                text: 'OK',
              },
            ],
          );
        }
      }
    }, [channelKey, getUpdateAttributes, pop, updateChannel]);

    if (!channel) {
      return null;
    }

    return (
      <View style={[t.borderTHairline, t.borderDefault, t.flexCol, t.hFull]}>
        {scrollable ? (
          <ScrollView style={[t.flex1]}>
            <View style={[t.pT5, t.pX4, t.pB1]}>{children(channel)}</View>
          </ScrollView>
        ) : (
          <View style={[t.flex1, t.p4, t.pT5]}>{children(channel)}</View>
        )}
        <View style={[t.p4]}>
          <ButtonV2
            onPress={onSave}
            title="Save changes"
            disabled={saveDisabled()}
          />
        </View>
      </View>
    );
  },
);

EditChannelAttribute.displayName = 'EditChannelAttribute';

export { EditChannelAttribute };
