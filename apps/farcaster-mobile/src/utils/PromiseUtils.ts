import { InteractionManager } from 'react-native';

const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

type PromiseBuilder = () => Promise<unknown>;

const scheduleLowPriorityPromises = (promiseBuilders: PromiseBuilder[]) => {
  if (promiseBuilders.length === 0) {
    return;
  }

  const schedule = (index: number) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        await promiseBuilders[index]();
      } finally {
        const nextIndex = index + 1;
        if (nextIndex < promiseBuilders.length) {
          schedule(nextIndex);
        }
      }
    });
  };

  schedule(0);
};

export { scheduleLowPriorityPromises, sleep };
