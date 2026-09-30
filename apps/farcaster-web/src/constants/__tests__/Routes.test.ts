import { routes } from '~/constants/routes';
import { Route } from '~/types';

describe('Routes', () => {
  it('should define routes', () => {
    expect(Object.keys(routes).length).toBeGreaterThan(0);
  });

  it('should include a path and title for each route', () => {
    Object.values(routes).forEach((route: Route) => {
      expect(route.path).toBeTruthy();
      expect(route.params).toBeTruthy();
    });
  });

  it('should define unique routes', () => {
    const paths = new Set(Object.values(routes).map((route) => route.path));
    expect(paths.size).toEqual(Object.values(routes).length);
  });

  it('should include storage settings route', () => {
    expect(routes.settingsStorage.path).toEqual('/~/settings/storage');
  });
});
