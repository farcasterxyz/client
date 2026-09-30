import React from 'react';

import { FeedRoute } from '~/hooks/useFeedRoutes';

import { TabBar } from './HomeHeaderTabBar';
import { HomeHeaderWrapper } from './HomeHeaderWrapper';
import { RenderTabBarFnProps } from './Pager';

export function HomeHeader(
  props: RenderTabBarFnProps & {
    onPressSelected: () => void;
    feeds: FeedRoute[];
  },
) {
  const { feeds } = props;

  const onSelect = React.useCallback(
    (index: number) => {
      if (props.onSelect) {
        props.onSelect(index);
      }
    },
    [props],
  );

  const items = React.useMemo(() => {
    return feeds.map((f) => `${f.key}`);
  }, [feeds]);

  return (
    <HomeHeaderWrapper>
      <TabBar
        key={'home-feed-pagers'}
        onPressSelected={props.onPressSelected}
        selectedPage={props.selectedPage}
        onSelect={onSelect}
        items={items}
      />
    </HomeHeaderWrapper>
  );
}
