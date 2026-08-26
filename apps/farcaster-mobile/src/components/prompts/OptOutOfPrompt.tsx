import { CheckBox } from 'farcaster-expo';
import React, { FC, memo, useState } from 'react';
import { InteractionManager, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { setPromptInfo } from '~/utils/PromptUtils';

type OptOutOfPromptProps = {
  storageKey: string;
};

const OptOutOfPrompt: FC<OptOutOfPromptProps> = memo(({ storageKey }) => {
  const t = useTheme();
  const [isOptedOut, setIsOptedOut] = useState(false); // We assume if the user is seeing this they are not opted out.

  return (
    <View style={[t.flexRow, t.itemsCenter, t.pT3]}>
      <CheckBox
        isChecked={isOptedOut}
        toggleIsChecked={async () => {
          const nextIsOptedOut = !isOptedOut;
          setIsOptedOut(nextIsOptedOut);
          InteractionManager.runAfterInteractions(() => {
            setPromptInfo({
              storageKey,
              info: { hasOptedOut: nextIsOptedOut },
            });
          });
        }}
      />
      <Text style={[t.texts.secondary, t.textXs, t.mL2]}>
        Do not show this prompt again
      </Text>
    </View>
  );
});

OptOutOfPrompt.displayName = 'OptOutOfPrompt';

export { OptOutOfPrompt };
