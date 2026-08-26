import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAMAKey = ({ fname }: { fname: string }) =>
  compactQueryKey(['ama', fname]);

export { buildAMAKey };
