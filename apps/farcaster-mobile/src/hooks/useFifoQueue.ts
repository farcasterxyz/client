import { useMemo, useRef } from 'react';

type Operation<T> = () => Promise<T>;
type Queue = Operation<unknown>[];
type Queues = Record<string, Queue | undefined>;
type PendingResult<T> = Promise<T>;
type PendingResults = Record<string, PendingResult<unknown>[] | undefined>;

const useFifoQueue = () => {
  const queues = useRef<Queues>({}).current;
  const pendingResults = useRef<PendingResults>({}).current;

  return useMemo(() => {
    const enqueue = async <T>(
      key: string,
      operation: Operation<T>,
    ): Promise<T> => {
      let promiseCallbacks: {
        resolve: (value: T) => void;
        reject: (error: unknown) => void;
      };

      const promise = new Promise<T>((resolve, reject) => {
        promiseCallbacks = { resolve, reject };
      });

      const performOperation = async () => {
        try {
          promiseCallbacks.resolve(await operation());
        } catch (error) {
          promiseCallbacks.reject(error);
        }

        queue.shift();
        resultsQueue.shift();

        const nextOperation = queue[0];
        if (nextOperation) {
          nextOperation();
        }
      };

      const queue = (queues[key] = queues[key] || []);
      queue.push(performOperation);

      if (queue.length === 1) {
        performOperation();
      }

      const resultsQueue = (pendingResults[key] = pendingResults[key] || []);
      resultsQueue.push(promise);

      return promise;
    };

    const getQueueSize = (key: string) => {
      const queue = queues[key];
      return queue ? queue.length : 0;
    };

    const getMostRecentPendingResults = <T>(
      key: string,
    ): Promise<T> | undefined => {
      const resultsQueue = pendingResults[key];

      if (!resultsQueue || resultsQueue.length === 0) {
        return;
      }

      return resultsQueue[resultsQueue.length - 1] as Promise<T>;
    };

    return { enqueue, getMostRecentPendingResults, getQueueSize };
  }, [pendingResults, queues]);
};

export { useFifoQueue };
