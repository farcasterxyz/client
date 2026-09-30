import { ApiUser } from 'farcaster-client-data';
import { getNotionLinkTarget, resolveUsername } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import { Linking, View } from 'react-native';

import { TextWithPress } from '~/components/TextWithPress';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

import { Text } from './Text';
interface NerfedAccountDisclaimerProps {
  user: ApiUser;
}

const NerfedAccountDisclaimer: React.FC<NerfedAccountDisclaimerProps> = ({
  user,
}) => {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const t = useTheme();

  const resolvedUsername = useMemo(
    () => resolveUsername({ username: user.username, fid: user.fid }),
    [user],
  );

  const [yourAccountLabel, theyLabel] = React.useMemo(() => {
    if (currentUserFid === user.fid) {
      return ['Your account', 'You'];
    }
    return [resolvedUsername, 'They'];
  }, [currentUserFid, resolvedUsername, user.fid]);

  if (!user.viewerContext?.nerfed) {
    return <></>;
  }

  return (
    <View
      style={[
        t.pT5,
        t.pB6,
        t.pX4,
        t.mY2,
        t.borderDefault,
        t.borderTHairline,
        t.borderBHairline,
      ]}
    >
      <Text style={[t.texts.primary, t.textXl, t.fontExtrabold, t.mB4]}>
        {yourAccountLabel} is nerfed
      </Text>
      <Text style={[t.texts.secondary]}>
        {`${yourAccountLabel} is currently nerfed. ${theyLabel} can still post to the Farcaster protocol, but will not appear on this Farcaster client.`}{' '}
        <TextWithPress
          style={[t.texts.brand]}
          onPress={() => {
            Linking.openURL(getNotionLinkTarget({ to: 'nerfs' }));
          }}
        >
          Learn more
        </TextWithPress>
      </Text>
    </View>
  );
};

export { NerfedAccountDisclaimer };
