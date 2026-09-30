import { _storageKeyPrefixes, _storageKeys } from '../Storage';

describe('Storage constants', () => {
  it('should define unique storage keys', () => {
    const devValues = Object.values(_storageKeys.development).concat(
      Object.values(_storageKeyPrefixes.development),
    );

    const prodValues = Object.values(_storageKeys.production).concat(
      Object.values(_storageKeyPrefixes.production),
    );

    const values = devValues.concat(prodValues);

    const uniqueValues = new Set(values);

    expect(devValues.length + prodValues.length).toEqual(values.length);
    expect(values.length).toEqual(uniqueValues.size);
  });
});
