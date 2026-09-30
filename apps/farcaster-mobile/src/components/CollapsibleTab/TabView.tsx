import React, { FC, memo, Suspense, useMemo } from 'react';

import {
  TabViewInner,
  TabViewProps,
} from '~/components/CollapsibleTab/TabViewInner';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';

export type TabViewOnScrollHandler = (key: string) => void;

const TabView: FC<TabViewProps> = memo((props) => {
  const items = useMemo(() => {
    {
      return props.items.map((item) => (
        <TabViewInner.Screen
          key={item.key}
          name={item.key}
          navigationKey={item.key}
        >
          {() => {
            // TODO: We seem to use "controlled" key state for tabbed views on manage channels screen.
            // This means that the tabs are always rendered and it is not performant.
            // Only other use of this was the notifications tab and this changeset will be removing that
            // use.
            if (typeof item.DeprecatedPreRenderedBody === 'undefined') {
              return <LoadingIndicator style={{ marginTop: 16 }} />;
            }

            return (
              <Suspense fallback={<FullScreenLoadingIndicator />}>
                <RetryableErrorBoundary>
                  <item.DeprecatedPreRenderedBody />
                </RetryableErrorBoundary>
              </Suspense>
            );
          }}
        </TabViewInner.Screen>
      ));
    }
  }, [props.items]);

  return <TabViewInner.Navigator {...props}>{items}</TabViewInner.Navigator>;
});

TabView.displayName = 'TabView';

export { TabView };
