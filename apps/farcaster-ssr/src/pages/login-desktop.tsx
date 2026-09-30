import type { GetServerSideProps } from 'next';

import { buildLoginAppRedirect } from '~/utils/loginRedirectUtils';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return buildLoginAppRedirect(context, 'login-desktop');
};

export default function LoginDesktopPage() {
  return null;
}
