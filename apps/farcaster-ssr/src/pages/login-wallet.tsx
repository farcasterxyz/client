import type { GetServerSideProps } from 'next';

import { buildLoginAppRedirect } from '~/utils/loginRedirectUtils';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return buildLoginAppRedirect(context, 'login-wallet');
};

export default function LoginWalletPage() {
  return null;
}
