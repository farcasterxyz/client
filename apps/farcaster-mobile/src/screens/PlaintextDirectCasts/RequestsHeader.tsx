import { AnimatedPressable, ScreenTitle } from 'farcaster-expo';
import { ChevronLeft, SettingsIcon } from 'lucide-react-native';
import React, { useCallback } from 'react';

import { useTopBar } from '~/components/TopBar';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUnmediatedNavigate } from '~/hooks/navigation/methods/navigate';
import { useGoBack } from '~/hooks/navigation/useGoBack';

const RequestsHeader: React.FC = React.memo(() => {
  const t = useTheme();
  const goBack = useGoBack();
  const navigate = useUnmediatedNavigate();

  const title = React.useMemo(() => <ScreenTitle title="Requests" />, []);

  const handleSettingsPress = useCallback(() => {
    navigate('DirectCastSettings', {});
  }, [navigate]);

  const { topBar } = useTopBar({
    leftIcon: (
      <AnimatedPressable
        onPress={goBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[
          {
            marginLeft: -8,
            paddingHorizontal: 4,
            transform: [{ translateY: -2 }],
            zIndex: 2,
          },
        ]}
      >
        <ChevronLeft size={24} color={t.colors.text.primary} />
      </AnimatedPressable>
    ),
    title: title,
    rightIcon: (
      <AnimatedPressable
        onPress={handleSettingsPress}
        style={{
          width: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: -8,
        }}
      >
        <SettingsIcon
          size={20}
          style={{ marginRight: -24 }}
          color={t.colors.text.primary}
        />
      </AnimatedPressable>
    ),
  });

  return topBar;
});

RequestsHeader.displayName = 'RequestsHeader';

export { RequestsHeader };
