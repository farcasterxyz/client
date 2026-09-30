import { ApiFrame } from 'farcaster-client-data';
import React from 'react';

import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { MiniAppListItem } from '~/components/miniApp/MiniAppLeaderboardListItem';

interface MiniAppResultsProps {
  results: ApiFrame[] | undefined;
  title?: string;
  emptyViewText: string;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  rightSectionFn?: (item: ApiFrame, index: number) => React.ReactNode;
}

export const MiniAppResults: React.FC<MiniAppResultsProps> = ({
  results,
  title,
  emptyViewText,
  onEndReached,
  isFetchingNextPage,
  rightSectionFn,
}) => {
  return (
    <div className="space-y-3">
      {title && <div className="font-semibold text-muted">{title}</div>}
      <FlatList
        data={results}
        keyExtractor={(item: ApiFrame) => item.domain.toString()}
        renderItem={({ item, index }) => (
          <MiniAppListItem
            key={item.domain}
            item={item}
            noBorder={index === (results ?? []).length - 1}
            rightSection={rightSectionFn?.(item, index)}
          />
        )}
        emptyView={<DefaultEmptyListView message={emptyViewText} />}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
};
