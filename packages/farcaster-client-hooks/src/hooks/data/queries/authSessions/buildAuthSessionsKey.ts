import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAuthSessionsKey = () => compactQueryKey(['authSessions']);

export { buildAuthSessionsKey };
