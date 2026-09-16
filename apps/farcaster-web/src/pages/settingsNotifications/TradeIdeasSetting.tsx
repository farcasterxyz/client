import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React from 'react';

import { SelectOne } from '~/components/forms/SelectOne';
import { trackError } from '~/utils/errorUtils';

function TradeIdeasSetting() {
  const { data } = useUserPreferences();

  const setUserPreferences = useSetUserPreferences();

  const defaultFilterPreference = React.useMemo(() => {
    return data.result.preferences.optOutTradeIdeas || false;
  }, [data?.result.preferences]);

  const [controlledFilterValue, setControlledFilterValue] = React.useState<
    'on' | 'off'
  >(defaultFilterPreference ? 'off' : 'on');

  const onFilterPreferenceValueChange = React.useCallback(
    async (value: 'on' | 'off') => {
      setControlledFilterValue(value);

      try {
        await setUserPreferences({
          preferences: { optOutTradeIdeas: value === 'on' ? false : true },
        });
      } catch (error) {
        trackError(error);
      }
    },
    [setUserPreferences],
  );

  return (
    <div className="mx-2 mb-2 flex flex-col">
      <div className="mt-4 flex flex-col">
        <span className="font-semibold">Trade ideas / Clanker Spotlight</span>
      </div>
      <div className="flex flex-col">
        <div className="-mx-4">
          <SelectOne
            options={[
              {
                value: 'on',
                title: 'On',
              },
              {
                value: 'off',
                title: 'Off',
              },
            ]}
            value={controlledFilterValue}
            onChange={onFilterPreferenceValueChange}
          />
        </div>
      </div>
    </div>
  );
}

export { TradeIdeasSetting };
