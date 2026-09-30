import type { LocalAccount } from 'viem';

import { getFarcasterTimestamp } from './SignerUtils';

const buildCustodyVerificationToken = async (account: LocalAccount) => {
  const timestamp = getFarcasterTimestamp(Date.now()).toString();
  const signature = await account.signMessage({ message: timestamp });
  const token = Buffer.from(`eip191:${signature}:${timestamp}`).toString(
    'base64',
  );

  return token;
};

export { buildCustodyVerificationToken };
