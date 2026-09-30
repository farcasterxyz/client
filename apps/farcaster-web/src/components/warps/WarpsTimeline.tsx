import { ApiWarpsTransaction } from 'farcaster-client-data';
import { useWarpTransactions } from 'farcaster-client-hooks';
import React from 'react';

import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { WarpTransaction } from '~/components/warps/WarpTransaction';

const WarpsTimeline: React.FC = () => {
  const { data, onEndReached, isFetchingNextPage } = useWarpTransactions();

  const transactions = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.result.transactions);
  }, [data]);

  return (
    <div className="flex w-full flex-row">
      <FlatList
        containerClassName="w-full"
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        emptyView={
          <DefaultEmptyListView
            className="!bg-transparent"
            message="No warps, yet"
          />
        }
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
};

const keyExtractor = (transaction: ApiWarpsTransaction, index: number) =>
  `${transaction.type}:${index}`;

const renderItem = ({ item }: { item: ApiWarpsTransaction }) => (
  <WarpTransaction transaction={item} />
);

WarpsTimeline.displayName = 'WarpsTimeline';

export { WarpsTimeline };
