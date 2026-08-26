import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildPendingAdminReviewsKey = () =>
  compactQueryKey(['pendingAdminReviews']);

export { buildPendingAdminReviewsKey };
