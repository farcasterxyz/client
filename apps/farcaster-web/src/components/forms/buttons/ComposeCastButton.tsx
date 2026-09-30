import { FC, memo } from 'react';

import {
  DefaultButton,
  DefaultButtonProps,
} from '~/components/forms/buttons/DefaultButton';

const ComposeCastButton: FC<DefaultButtonProps> = memo((props) => {
  return <DefaultButton {...props} />;
});

ComposeCastButton.displayName = 'ComposeCastButton';

export { ComposeCastButton };
