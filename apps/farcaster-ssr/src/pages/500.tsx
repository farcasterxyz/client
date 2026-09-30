import { FallbackOGHead } from '~/components/meta/FallbackOGHead';
import { defaultOGDescription, defaultOGTitle } from '~/constants/og';

export default function NotFoundPage() {
  return (
    <>
      <FallbackOGHead />
      <div>{defaultOGTitle}</div>
      <div>{defaultOGDescription}</div>
    </>
  );
}
