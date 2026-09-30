const maxEntries = 250;

type StorageBenchmarkEntry = {
  key?: string;
  keys?: string[];
  duration: number;
  type: StrorageBenchmarkType;
};

type StrorageBenchmarkType =
  | 'readKeys'
  | 'read'
  | 'multiRead'
  | 'write'
  | 'delete'
  | 'secureRead'
  | 'secureWrite'
  | 'secureDelete';

const storageBenchmarks: StorageBenchmarkEntry[] = [];

const trackStorageBenchmark = (entry: StorageBenchmarkEntry) => {
  storageBenchmarks.push(entry);

  while (storageBenchmarks.length > maxEntries) {
    storageBenchmarks.shift();
  }
};

export { storageBenchmarks, trackStorageBenchmark };
