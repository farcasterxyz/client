import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type NewMessageMarkerProps = {
  conversationId: string;
  messageId: string;
};

const NewMessagesMarker: React.FC<NewMessageMarkerProps> = () => {
  const t = useTheme();

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter, t.mT3, t.mX2, t.mB5]}>
      <View style={[t.flexGrow, t.borderT, t.borderDefault]} />
      <Text style={[t.pX4, t.textXs, t.texts.tertiary, t.textCenter]}>
        New messages
      </Text>
      <View style={[t.flexGrow, t.borderT, t.borderDefault]} />
    </View>
  );
};

export { NewMessagesMarker };
