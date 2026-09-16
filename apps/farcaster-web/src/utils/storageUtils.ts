// eslint-disable-next-line no-restricted-imports
import localforage from 'localforage';

const getItem = async <T>({
  key,
  fallback,
}: {
  key: string;
  fallback: T;
}): Promise<T> => {
  const result = await localforage.getItem<T>(key);

  if (result === null || result === undefined) {
    return fallback;
  }

  return result;
};

const setItem = async ({ key, value }: { key: string; value: unknown }) => {
  return await localforage.setItem(key, value);
};

const deleteItem = async (key: string) => {
  await localforage.removeItem(key);
};

export { deleteItem, getItem, setItem };
