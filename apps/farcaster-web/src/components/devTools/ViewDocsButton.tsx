import { FileTextIcon } from 'lucide-react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

const ViewDocsButton = ({ href }: { href: string }) => {
  const externalNavigate = useExternalNavigate();

  return (
    <DefaultButton
      variant="secondary"
      onClick={() => {
        externalNavigate({ to: href, openInNewTab: true });
      }}
    >
      <div className="flex flex-row items-center gap-2">
        <FileTextIcon className="size-4" />
        View Docs
      </div>
    </DefaultButton>
  );
};

export { ViewDocsButton };
