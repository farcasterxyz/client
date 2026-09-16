import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildPhoneVerificationKey = () => compactQueryKey(['phoneVerification']);

export { buildPhoneVerificationKey };
