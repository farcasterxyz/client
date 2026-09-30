import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiLocation } from 'farcaster-client-data';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

type LocationSectionProps = {
  location: ApiLocation;
};

const LocationDescriptionRegex = /^(.*?),.*?, (.*?)$/;

const LocationSection: React.FC<LocationSectionProps> = ({ location }) => {
  const { trackEvent } = useAnalytics();
  const push = usePush();
  const t = useTheme();

  const placeId = React.useMemo(() => {
    return location.placeId;
  }, [location.placeId]);

  const formattedLocationString = React.useMemo(() => {
    return location.description.replace(LocationDescriptionRegex, '$1');
  }, [location.description]);

  const notAValidLocation = React.useMemo(() => {
    return location.placeId === '' || location.description === '';
  }, [location.description, location.placeId]);

  // Server is returning null string values for unset locations
  // so we have to handle it on clients. This should ideally be done
  // on the server so the whole object is undefined.
  if (notAValidLocation) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}
      onPress={() => {
        trackEvent(AnalyticsEvent.ClickLocation, {
          locationDescription: formattedLocationString,
        });

        push('LocationUsers', {
          placeId: placeId,
          description: formattedLocationString,
        });
      }}
      activeOpacity={0.8}
    >
      <Svg
        width="12"
        height="16"
        viewBox="0 0 12 16"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <G clip-path="url(#clip0_2175_25047)">
          <Path
            d="M11.3337 6.66683C11.3337 9.9955 7.64099 13.4622 6.40099 14.5328C6.28548 14.6197 6.14486 14.6667 6.00033 14.6667C5.85579 14.6667 5.71518 14.6197 5.59966 14.5328C4.35966 13.4622 0.666992 9.9955 0.666992 6.66683C0.666992 5.25234 1.2289 3.89579 2.22909 2.89559C3.22928 1.8954 4.58584 1.3335 6.00033 1.3335C7.41481 1.3335 8.77137 1.8954 9.77156 2.89559C10.7718 3.89579 11.3337 5.25234 11.3337 6.66683Z"
            stroke={t.colors.text.secondary}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6 8.6665C7.10457 8.6665 8 7.77107 8 6.6665C8 5.56193 7.10457 4.6665 6 4.6665C4.89543 4.6665 4 5.56193 4 6.6665C4 7.77107 4.89543 8.6665 6 8.6665Z"
            stroke={t.colors.text.secondary}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
        <Defs>
          <ClipPath id="clip0_2175_25047">
            <Rect width="12" height="16" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>

      <Text2
        numberOfLines={1}
        size="sm"
        color="secondary"
        weight="regular"
        style={{ flexShrink: 1 }}
      >
        {formattedLocationString}
      </Text2>
    </TouchableOpacity>
  );
};

LocationSection.displayName = 'LocationSection';

export { LocationSection };
