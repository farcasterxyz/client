import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFarcasterProNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type FarcasterProNotificationGroupProps = {
  group: ApiFarcasterProNotificationGroup;
};

const FarcasterProNotificationGroup: FC<FarcasterProNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const push = usePush();
    const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

    const clickTarget = group.previewItems[0].content.clickTarget;
    const ctaTarget = group.previewItems[0].content.cta?.target;
    const ctaText = group.previewItems[0].content.cta?.text;
    const title = group.previewItems[0].content.title;
    const body = group.previewItems[0].content.body;

    return (
      <>
        <NotificationGroupOuterContainer
          group={group}
          onPress={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: group.type,
            });

            if (clickTarget) {
              possiblyNavigateOrOpenUrl({
                url: clickTarget,
              });
            } else {
              push('FarcasterProUpsell', {
                source: 'notification',
              });
            }
          }}
        >
          <NotificationIcon variant="purple">
            {() => <FarcasterProBadge size={20} />}
          </NotificationIcon>
          <NotificationGroupInnerContainer>
            <View style={[t.flexCol]}>
              {title && (
                <Text
                  style={[
                    t.mR1,
                    t.mB1,
                    t.texts.primary,
                    t.textBase,
                    t.fontSemibold,
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              {body && <Text style={[t.mR1, t.texts.primary]}>{body}</Text>}
            </View>
            {ctaTarget && ctaText && (
              <View style={[t.mT2]}>
                <Button
                  onPress={async () => {
                    trackEvent(AnalyticsEvent.ClickNotification, {
                      type: group.type,
                    });

                    possiblyNavigateOrOpenUrl({
                      url: ctaTarget,
                    });
                  }}
                  title={ctaText}
                  variant="muted"
                  size="xs"
                  style={[t.flexGrow0, t.mY1]}
                />
              </View>
            )}
          </NotificationGroupInnerContainer>
        </NotificationGroupOuterContainer>
      </>
    );
  });

FarcasterProNotificationGroup.displayName = 'FarcasterProNotificationGroup';

export { FarcasterProNotificationGroup };
