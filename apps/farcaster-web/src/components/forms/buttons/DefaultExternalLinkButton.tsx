import { memo } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import {
  ExternalLink,
  ExternalLinkProps,
} from '~/components/links/ExternalLink';

type DefaultExternalLinkButtonProps = ExternalLinkProps;

const DefaultExternalLinkButton = memo(
  ({ children, ...props }: DefaultExternalLinkButtonProps) => {
    return (
      <ExternalLink {...props}>
        <DefaultButton>{children}</DefaultButton>
      </ExternalLink>
    );
  },
);

export { DefaultExternalLinkButton };
