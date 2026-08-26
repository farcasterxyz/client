jest.mock('~/utils/ErrorUtils');
jest.mock('@react-native-async-storage/async-storage');

import AsyncStorage from '@react-native-async-storage/async-storage';

import { trackError } from '~/utils/ErrorUtils';
import { deleteItem, getItem, setItem } from '~/utils/StorageUtils';

const key = 'testKey';

const mockGetItem = (getItemAsync: () => Promise<unknown>) => {
  (AsyncStorage.getItem as jest.Mock).mockImplementation(getItemAsync);
};

const mockSetItem = (setItemAsync: () => Promise<unknown>) => {
  (AsyncStorage.setItem as jest.Mock).mockImplementation(setItemAsync);
};

const mockRemoveItem = (removeItemAsync: () => Promise<unknown>) => {
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(removeItemAsync);
};

describe('StorageUtils', () => {
  describe('getItem', () => {
    it('should return the stored value', async () => {
      mockGetItem(async () => JSON.stringify('foo'));
      const result = await getItem({ key, fallback: 'fallback' });
      expect(result).toEqual('foo');

      expect(trackError).not.toHaveBeenCalled();
    });

    it('should notify and return the fallback when a read error occurs', async () => {
      mockGetItem(async () => {
        throw new Error('Kaboom');
      });
      const result = await getItem({ key, fallback: 'fallback' });
      expect(result).toEqual('fallback');

      expect(trackError).toHaveBeenCalledWith(
        new Error(`Error reading ${key} from storage err: Kaboom`),
      );
    });

    it('should notify and return the fallback when the stored value is not valid json', async () => {
      mockGetItem(async () => 'foo');
      const result = await getItem({ key, fallback: 'fallback' });
      expect(result).toEqual('fallback');

      expect(trackError).toHaveBeenCalledWith(
        new Error(`Error parsing ${key} from storage`),
      );
    });

    it('should coalesce a stored "null" string to the fallback', async () => {
      // setItem(undefined) persists the string "null" via safeStringify; getItem
      // must heal it back to the fallback rather than leaking JS null (outside T).
      mockGetItem(async () => 'null');
      const result = await getItem({ key, fallback: 'fallback' });
      expect(result).toEqual('fallback');

      expect(trackError).not.toHaveBeenCalled();
    });
  });

  describe('setItem', () => {
    it('should notify when an error occurs', async () => {
      mockSetItem(async () => {
        throw new Error('Kaboom');
      });
      await setItem({ key, value: 'value' });
      expect(trackError).toHaveBeenCalledWith(
        new Error(`Error writing ${key} to storage`),
      );
    });
  });

  describe('deleteItem', () => {
    it('should notify when an error occurs', async () => {
      mockRemoveItem(async () => {
        throw new Error('Kaboom');
      });
      await deleteItem({ key });
      expect(trackError).toHaveBeenCalledWith(
        new Error(`Error deleting ${key} from storage`),
      );
    });
  });
});
