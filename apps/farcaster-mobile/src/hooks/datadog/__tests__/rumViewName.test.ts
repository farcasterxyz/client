import { getRumViewName } from '~/hooks/datadog/rumViewName';

describe('getRumViewName', () => {
  it('returns the explicit rumViewName param when present', () => {
    expect(
      getRumViewName(
        { name: 'aggressive', params: { rumViewName: 'Notifications' } },
        'aggressive',
      ),
    ).toEqual('Notifications');
  });

  it('falls back to the tracked name when no params are present', () => {
    expect(getRumViewName({ name: 'Feed' }, 'Feed')).toEqual('Feed');
  });

  it('falls back to the tracked name when the param is absent', () => {
    // Guards the intentionally-untouched screens (Feed/Feeds, Channel/...).
    expect(getRumViewName({ name: 'Feeds', params: {} }, 'Feeds')).toEqual(
      'Feeds',
    );
  });

  it('only falls back on null/undefined, not on an empty string', () => {
    // Documents that the fallback is `??` (nullish), not `||` — an explicit
    // empty rumViewName is returned as-is rather than masked by trackedName.
    expect(
      getRumViewName({ name: 'X', params: { rumViewName: '' } }, 'X'),
    ).toEqual('');
  });
});
