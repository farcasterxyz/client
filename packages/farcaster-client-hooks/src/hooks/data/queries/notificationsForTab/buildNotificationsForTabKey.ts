import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildNotificationsForTabKey = ({ tab }: { tab?: string }) =>
  compactQueryKey(['notificationsForTab', tab]);
