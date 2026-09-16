import { memo } from 'react';

import {
  DefaultButton,
  DefaultButtonProps,
} from '~/components/forms/buttons/DefaultButton';
import { Link, LinkProps } from '~/components/links/Link';
import { RouteName } from '~/types';

type DefaultLinkButtonProps<Name extends RouteName> = LinkProps<Name> &
  Pick<DefaultButtonProps, 'variant' | 'size' | 'className'>;

const DefaultLinkButton = <Name extends RouteName>({
  children,
  variant,
  size,
  className,
  ...props
}: DefaultLinkButtonProps<Name>) => {
  return (
    <Link {...props}>
      <DefaultButton variant={variant} size={size} className={className}>
        {children}
      </DefaultButton>
    </Link>
  );
};

const MemoizedDefaultLinkButton = memo(DefaultLinkButton);

export { MemoizedDefaultLinkButton as DefaultLinkButton };
