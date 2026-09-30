import { QueryKey } from '@tanstack/react-query';

const buildGetNextNuxTaskKey = (): QueryKey => {
  return ['nextNuxTask'];
};

export { buildGetNextNuxTaskKey };
