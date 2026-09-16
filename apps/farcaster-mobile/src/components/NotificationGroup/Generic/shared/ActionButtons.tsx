import { AnalyticsEvent } from 'farcaster-analytics';
import { useTrackEvent } from 'farcaster-client-hooks';
import { ButtonV2 } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

type ActionButtonsProps = {
  type: string;
  primaryCta?: { text: string; target: string };
  secondaryCta?: { text: string; target: string };
};

export const ActionButtons: FC<ActionButtonsProps> = ({
  type,
  primaryCta,
  secondaryCta,
}) => {
  const t = useTheme();
  const { trackEvent } = useTrackEvent();
  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  if (!primaryCta) {
    return null;
  }

  const hasDualCtas = !!secondaryCta;

  return (
    <View
      style={[
        t.mT2,
        hasDualCtas ? [t.flexRow, t.wFull, { columnGap: 10 }] : undefined,
      ]}
    >
      <View style={hasDualCtas ? t.flex1 : undefined}>
        <ButtonV2
          height="xs"
          variant={hasDualCtas ? 'primary' : 'secondary'}
          onPress={async () => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type,
              ...(hasDualCtas && { cta: 'primary' }),
            });
            possiblyNavigateOrOpenUrl({ url: primaryCta.target });
          }}
          title={primaryCta.text}
        />
      </View>
      {secondaryCta ? (
        <View style={[t.flex1]}>
          <ButtonV2
            height="xs"
            variant="secondary"
            onPress={async () => {
              trackEvent(AnalyticsEvent.ClickNotification, {
                type,
                cta: 'secondary',
              });
              possiblyNavigateOrOpenUrl({ url: secondaryCta.target });
            }}
            title={secondaryCta.text}
          />
        </View>
      ) : null}
    </View>
  );
};
