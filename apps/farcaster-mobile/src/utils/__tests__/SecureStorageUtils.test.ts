jest.mock('~/utils/ErrorUtils');
jest.mock('expo-secure-store');

import * as SecureStore from 'expo-secure-store';

import { trackError } from '~/utils/ErrorUtils';
import { getSecureItem, setSecureItem } from '~/utils/SecureStorageUtils';

const key = 'testKey';

const mockGetItemAsync = (getItemAsync: () => Promise<unknown>) => {
  (SecureStore.getItemAsync as jest.Mock).mockImplementation(getItemAsync);
};

const mockSetItemAsync = (setItemAsync: () => Promise<unknown>) => {
  (SecureStore.setItemAsync as jest.Mock).mockImplementation(setItemAsync);
};

describe('SecureStorageUtils', () => {
  describe('getSecureItem', () => {
    it('should return the stored value', async () => {
      mockGetItemAsync(async () => JSON.stringify('foo'));
      const result = await getSecureItem({ key, fallback: 'fallback' });
      expect(result).toEqual('foo');

      expect(trackError).not.toHaveBeenCalled();
    });

    it('should notify and return the fallback when a read error occurs', async () => {
      mockGetItemAsync(async () => {
        throw new Error('Kaboom');
      });
      const result = await getSecureItem({ key, fallback: 'fallback' });
      expect(result).toEqual('fallback');

      expect(trackError).toHaveBeenCalledWith(
        new Error(`Error reading ${key} from secure storage`),
      );
    });

    it('should notify and return the fallback when the stored value is not valid json', async () => {
      mockGetItemAsync(async () => 'foo');
      const result = await getSecureItem({ key, fallback: 'fallback' });
      expect(result).toEqual('fallback');

      expect(trackError).toHaveBeenCalledWith(
        new Error(`Error parsing ${key} from secure storage`),
      );
    });
  });

  describe('setSecureItem', () => {
    it('should notify when an error occurs', async () => {
      mockSetItemAsync(async () => {
        throw new Error('Kaboom');
      });
      await setSecureItem({ key, value: 'value' });
      expect(trackError).toHaveBeenCalledWith(
        new Error(`Error writing ${key} to secure storage`),
      );
    });
  });
});
