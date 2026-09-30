import { Ionicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  apiChainToChainId,
  ApiViewOnrampUpdateNotificationGroup,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { TokenIcon } from 'farcaster-expo';
import React, { FC, memo, useMemo } from 'react';
import { Linking, View } from 'react-native';

import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type ViewOnRampUpdateNotificationGroupProps = {
  group: ApiViewOnrampUpdateNotificationGroup;
};

const ViewOnRampUpdateNotificationGroup: FC<ViewOnRampUpdateNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const navigate = useNavigate();
    const { trackEvent } = useTrackEvent();

    const { title, description, iconUrl, purchaseCurrency, txHash, chain } =
      useMemo(() => {
        const content = group.previewItems[0].content;
        const eventType = content.eventType;

        let titleText: string;
        let descriptionText: string;

        switch (eventType) {
          case 'created':
            titleText = 'Deposit initiated';
            descriptionText = 'Your deposit is being processed.';
            break;
          case 'in-progress':
            titleText = 'Deposit processing';
            descriptionText = 'Your deposit is on its way.';
            break;
          case 'success':
            titleText = 'Deposit complete';
            descriptionText = `${content.purchaseCurrency} is now available in your wallet.`;
            break;
          case 'failed':
            titleText = 'Deposit failed';
            descriptionText = 'There was an issue with your deposit.';
            break;
          default:
            titleText = 'Deposit update';
            descriptionText = 'Your deposit status has changed.';
        }

        return {
          title: titleText,
          description: descriptionText,
          iconUrl: content.iconUrl,
          purchaseCurrency: content.purchaseCurrency,
          txHash: content.txHash,
          chain: content.chain,
        };
      }, [group.previewItems]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          trackEvent(AnalyticsEvent.ClickNotification, {
            type: group.type,
          });
          if (txHash) {
            const chainId = apiChainToChainId(chain as ApiChain);
            if (!chainId) {
              return;
            }
            const transactionExplorerUrl = getTransactionExplorerUrl({
              chainId,
              hash: txHash,
              type: 'tx',
            });
            if (transactionExplorerUrl) {
              Linking.openURL(transactionExplorerUrl);
              return;
            }
          }
          navigate('Wallet', {});
        }}
      >
        <NotificationGraphic>
          <View style={{ position: 'relative' }}>
            <TokenIcon
              iconUrl={iconUrl}
              diameter={48}
              symbol={purchaseCurrency}
              imageBordered
            />
            <View
              style={[
                t.bgDefault,
                t.itemsCenter,
                t.justifyCenter,
                t.borderHairline,
                t.borders.secondary,
                {
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  overflow: 'hidden',
                },
              ]}
            >
              <View
                style={[
                  t.backgrounds.primary,
                  t.itemsCenter,
                  t.justifyCenter,
                  {
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    overflow: 'hidden',
                  },
                ]}
              >
                <Ionicons name="wallet" size={12} color={t.colors.text.brand} />
              </View>
            </View>
          </View>
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex]}>
            <View style={[t.flex1, t.justifyCenter]}>
              <Text
                style={[t.mR1, t.texts.primary, t.textBase, t.fontSemibold]}
              >
                {title}
              </Text>
              <Text style={[t.mR1, t.mT1, t.texts.primary]}>{description}</Text>
            </View>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ViewOnRampUpdateNotificationGroup.displayName =
  'ViewOnRampUpdateNotificationGroup';

export { ViewOnRampUpdateNotificationGroup };
