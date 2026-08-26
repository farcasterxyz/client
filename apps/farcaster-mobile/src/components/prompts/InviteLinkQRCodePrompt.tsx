import * as Clipboard from 'expo-clipboard';
import React, { FC, memo } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '~/components/Button';
import { inviteLinkQRCodePrompt } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { Prompt } from './Prompt';

type InviteLinkQRCodePromptProps = {
  url?: string;
};

const InviteLinkQRCodePrompt: FC<InviteLinkQRCodePromptProps> = memo(
  ({ url }) => {
    const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();
    const shouldPresent = React.useCallback(() => {
      return (
        activePromptKey === inviteLinkQRCodePrompt && typeof url !== 'undefined'
      );
    }, [activePromptKey, url]);

    return (
      <Prompt
        shouldPresent={shouldPresent}
        height={'60%'}
        storageKey={inviteLinkQRCodePrompt}
        enableTouchThrough={false}
        onBackdropPress={hideGlobalPrompt}
        onCloseCallback={hideGlobalPrompt}
      >
        <InviteLinkQRCodePromptContent url={url!} />
      </Prompt>
    );
  },
);

type InviteLinkQRCodePromptContentProps = {
  url: string;
};

const InviteLinkQRCodePromptContent: React.FC<
  InviteLinkQRCodePromptContentProps
> = ({ url }) => {
  const t = useTheme();

  const onCopyPress = React.useCallback(async () => {
    await Clipboard.setStringAsync(url);
  }, [url]);

  return (
    <View style={[t.flex, t.flexCol, t.itemsCenter, t.pT4]}>
      <QRCode
        backgroundColor={'#ffffff'}
        color={'#000000'}
        ecl="H"
        size={260}
        value={url}
      />
      <View style={[t.flex, t.mT6, t.itemsCenter, t.justifyCenter]}>
        <Button
          onPress={onCopyPress}
          title={'Copy Link'}
          size={'md'}
          minWidth={260}
        />
      </View>
    </View>
  );
};

InviteLinkQRCodePrompt.displayName = 'InviteLinkQRCodePrompt';
export { InviteLinkQRCodePrompt };
