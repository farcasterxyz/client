import type { GetServerSideProps } from 'next';

import { buildLoginAppRedirect } from '~/utils/loginRedirectUtils';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return buildLoginAppRedirect(context, 'login-mobile');
};

export default function LoginMobilePage() {
  return null;
}
