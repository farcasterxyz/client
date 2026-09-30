import React from 'react';
import { G, Path, Svg } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

const FrameTransacationFlagIcon: React.FC = () => {
  const t = useTheme();

  return (
    <Svg width="18" height="19" viewBox="0 0 18 19" fill="none">
      <G id="Frame">
        <Path
          id="Vector"
          d="M2.25 2.75V3.875M2.25 3.875L4.3275 3.35525C5.8908 2.96453 7.54231 3.14597 8.9835 3.86675L9.0645 3.90725C10.4766 4.61323 12.0915 4.80192 13.6283 4.4405L15.9608 3.8915C15.6772 6.50866 15.6785 9.14886 15.9645 11.7657L13.629 12.3148C12.0921 12.6766 10.4769 12.4882 9.0645 11.7823L8.9835 11.7418C7.54231 11.021 5.8908 10.8395 4.3275 11.2303L2.25 11.75M2.25 3.875V11.75M2.25 16.25V11.75"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke={t.colors.text.tertiary}
        />
      </G>
    </Svg>
  );
};

export { FrameTransacationFlagIcon };
