import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiChannelCastingMode } from 'farcaster-client-data';
import { useChannel, useUpdateChannel } from 'farcaster-client-hooks';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { SelectOne, SelectOneOption } from '~/components/settings/SelectOne';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type ChannelManageWhoCanCastScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ChannelManageWhoCanCast'
>;

function getOptions(): SelectOneOption<ApiChannelCastingMode>[] {
  return [
    {
      title: 'Members only',
      subtitle:
        'Show casts and replies from members. Show replies from recommended users.',
      value: 'members-only',
    },
    {
      title: 'Recommended only',
      subtitle:
        'Show casts and replies from all members and recommended users.',
      value: 'recommended',
    },
    {
      title: 'Everyone',
      subtitle: 'Everyone can cast and reply',
      value: 'everyone',
    },
  ];
}

const ChannelManageWhoCanCastScreen =
  buildScreen<ChannelManageWhoCanCastScreenProps>(
    { name: 'ChannelManageWhoCanCast', insetTop: false, avoidKeyboard: true },
    ({
      route: {
        params: { channelKey },
      },
    }) => {
      const t = useTheme();
      const { data: channel } = useChannel({ key: channelKey });

      const updateChannel = useUpdateChannel();

      const [value, setValue] = useState<ApiChannelCastingMode>(
        channel.castingMode || 'recommended',
      );

      const options: SelectOneOption<ApiChannelCastingMode>[] = getOptions();

      const handleChange = (nextValue: ApiChannelCastingMode) => {
        setValue(nextValue);

        void updateChannel({
          publicCasting: nextValue !== 'members-only',
          key: channel.key,
          castingMode: nextValue,
        });
      };

      return (
        <ScrollView style={[t.hFull, t.mT4]}>
          <SelectOne options={options} value={value} onChange={handleChange} />
        </ScrollView>
      );
    },
  );

ChannelManageWhoCanCastScreen.displayName = 'ChannelManageWhoCanCastScreen';

export { ChannelManageWhoCanCastScreen };
