import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiChannel } from 'farcaster-client-data';
import React, { useCallback, useState } from 'react';

import { buildScreen } from '~/components/Screen';
import { TextInputWithCounter } from '~/components/TextInput/TextInputWithCounter';
import { EditChannelAttribute } from '~/screens/ManageOwnedChannels/EditChannelAttribute';
import { CommonStackParamList } from '~/types';

type EditChannelNameScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'EditChannelName'
>;

const EditChannelNameScreen = buildScreen<EditChannelNameScreenProps>(
  { name: 'EditChannelName', insetTop: false, avoidKeyboard: true },
  ({
    route: {
      params: { channelKey },
    },
  }) => {
    const [name, setName] = useState('');

    const onChannelLoad = useCallback((channel: ApiChannel | undefined) => {
      setName(channel?.name || '');
    }, []);

    return (
      <EditChannelAttribute
        channelKey={channelKey}
        onChannlLoad={onChannelLoad}
        getUpdateAttributes={() => ({ name: name.trim() })}
        saveDisabled={() => name.trim().length === 0}
      >
        {() => (
          <TextInputWithCounter
            autoCorrect={false}
            autoFocus={false}
            clearButtonMode="never"
            maxLength={32}
            onChangeText={setName}
            placeholder="Enter channel display name"
            value={name}
          />
        )}
      </EditChannelAttribute>
    );
  },
);

EditChannelNameScreen.displayName = 'EditChannelNameScreen';

export { EditChannelNameScreen };
