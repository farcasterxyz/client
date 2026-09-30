import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiChannel } from 'farcaster-client-data';
import React, { useCallback, useState } from 'react';

import { buildScreen } from '~/components/Screen';
import { TextInputWithCounter } from '~/components/TextInput/TextInputWithCounter';
import { EditChannelAttribute } from '~/screens/ManageOwnedChannels/EditChannelAttribute';
import { CommonStackParamList } from '~/types';

type EditChannelDescriptionScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'EditChannelDescription'
>;

const EditChannelDescriptionScreen =
  buildScreen<EditChannelDescriptionScreenProps>(
    { name: 'EditChannelDescription', insetTop: false, avoidKeyboard: true },
    ({
      route: {
        params: { channelKey },
      },
    }) => {
      const [description, setDescription] = useState('');

      const onChannelLoad = useCallback((channel: ApiChannel | undefined) => {
        setDescription(channel?.description || '');
      }, []);

      return (
        <EditChannelAttribute
          channelKey={channelKey}
          onChannlLoad={onChannelLoad}
          getUpdateAttributes={() =>
            // We don't allow new lines - convert to spaces
            ({ description: description.trim().replace('\n', ' ') })
          }
          saveDisabled={() => false}
        >
          {() => (
            <TextInputWithCounter
              autoCorrect={false}
              autoFocus={false}
              clearButtonMode="never"
              multiline={true}
              numberOfLines={4}
              maxLength={256}
              onChangeText={setDescription}
              placeholder="Share what your community is about …"
              value={description}
            />
          )}
        </EditChannelAttribute>
      );
    },
  );

EditChannelDescriptionScreen.displayName = 'EditChannelDescriptionScreen';

export { EditChannelDescriptionScreen };
