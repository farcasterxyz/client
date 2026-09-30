import { LinkExternalIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { CastActionIcon } from '~/components/icons/CastActionIcon';
import { ExternalLink } from '~/components/links/ExternalLink';

type CastActionToastProps = {
  message: string;
  iconName: string;
  link?: string;
};

const CastActionToast: FC<CastActionToastProps> = ({
  message,
  iconName,
  link,
}) => {
  const content = (
    <div className="relative mb-1 flex flex-col rounded-lg border p-4 bg-cast-action-toast border-default">
      <div className="flex flex-row items-center justify-center text-default">
        <span className="mr-4 text-[#8a63d2]">
          <CastActionIcon iconName={iconName} size={18} />
        </span>
        <div className={classNames('line-clamp-2', link && 'hover:underline')}>
          {message}
        </div>
        {link && <LinkExternalIcon className="ml-4 text-faint" size={14} />}
      </div>
    </div>
  );

  return link ? (
    <ExternalLink title={message} href={link}>
      {content}
    </ExternalLink>
  ) : (
    content
  );
};

CastActionToast.displayName = 'CastActionToast';

export { CastActionToast };
