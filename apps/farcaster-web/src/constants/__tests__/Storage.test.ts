import * as storage from '~/constants/storage';

describe('Storage', () => {
  it('should have unique keys', () => {
    expect(Object.keys(storage).length).toEqual(
      new Set(Object.keys(storage)).size,
    );
  });
});
