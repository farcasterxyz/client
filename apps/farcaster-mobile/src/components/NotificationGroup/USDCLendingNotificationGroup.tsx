import { ApiUsdcLendingNotificationGroup } from 'farcaster-client-data';
import { useOnchainMorphoFarcasterVault } from 'farcaster-client-hooks';
import { USDCLendingIcon } from 'farcaster-expo';
import { FC, memo } from 'react';
import { View } from 'react-native';

import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { NotificationGroupInnerContainer } from '~/components/NotificationGroup/shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from '~/components/NotificationGroup/shared/NotificationGroupOuterContainer';
import { Text2 } from '~/components/Text';
import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type USDCLendingNotificationGroupProps = {
  group: ApiUsdcLendingNotificationGroup;
};

const USDCLendingNotificationGroup: FC<USDCLendingNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { navigate } = useNavigationMethods();

    const { data } = useOnchainMorphoFarcasterVault();
    const apy = data?.vault.avgApy;
    const apyStr = apy ? `${(apy * 100).toFixed(2)}% ` : '';

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => navigate('Wallet', { usdcLendingLearnMore: true })}
      >
        <NotificationGraphic>
          <USDCLendingIcon size={48} />
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, { gap: 2 }]}>
            <Text2 weight="semibold" color="primary">
              Earn {apyStr}on USDC balances
            </Text2>
            <Text2 size="sm" color="primary">
              Lend your USDC on Farcaster to earn yield. Tap to get started.
            </Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

USDCLendingNotificationGroup.displayName = 'USDCLendingNotificationGroup';

export { USDCLendingNotificationGroup };
