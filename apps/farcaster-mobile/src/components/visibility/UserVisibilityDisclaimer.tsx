import { ApiUser } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { getUserMarkInvisibleDisclaimer } from '~/utils/UserVisibilityUtils';

interface UserVisibilityDisclaimerProps {
  user: ApiUser;
}

const UserVisibilityDisclaimer: React.FC<UserVisibilityDisclaimerProps> = ({
  user,
}) => {
  const t = useTheme();

  const userVisibilityTitle = React.useMemo(() => {
    return getUserMarkInvisibleDisclaimer({
      user,
      blocked: !!user.viewerContext?.blocking,
    });
  }, [user]);

  return (
    <View
      style={[
        t.pX4,
        t.mT4,
        t.pT5,
        t.pB6,
        t.borderTHairline,
        t.borderBHairline,
        t.borderDefault,
      ]}
    >
      <Text style={[t.texts.primary, t.textXl, t.fontExtrabold, t.mB4]}>
        {userVisibilityTitle}
      </Text>
      <Text style={[t.texts.secondary]}>
        To view their casts, use the action menu above.
      </Text>
    </View>
  );
};

export { UserVisibilityDisclaimer };
